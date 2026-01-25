<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificateController extends Controller
{
    /**
     * Public verification endpoint.
     * No auth required.
     */
    public function verify($code)
    {
        $certificate = Certificate::with(['user', 'course'])
            ->where('VerificationCode', $code)
            ->first();

        if (!$certificate) {
            return response()->json(['message' => 'Invalid Code'], 404);
        }

        return response()->json([
            'message' => 'Success',
            'data' => [
                'StudentName' => $certificate->user->FullName,
                'CourseTitle' => $certificate->course->Title,
                'IssueDate' => $certificate->GeneratedAt->format('F j, Y'),
                'Platform' => $certificate->Platform ?? 'Quizify',
            ]
        ]);
    }

    public function claimCertificate(Request $request)
    {
        $request->validate([
            'CourseId' => ['required', 'integer', 'exists:courses,Id'],
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();
        $courseId = (int) $request->input('CourseId');

        // 1. Check eligibility first
        if (!$user->isEligibleForCertificate($courseId)) {
            return response()->json(['message' => 'You are not yet eligible for a certificate for this course.'], 422);
        }

        $course = Course::findOrFail($courseId);

        // Check if certificates are enabled for this course
        if (!$course->CertificatesEnabled) {
            return response()->json(['message' => 'Certification is not yet available for this course.'], 403);
        }

        // 2. Use updateOrCreate and clear existing URL to force re-generation
        $verificationCode = Str::upper(Str::random(10));
        $certificate = Certificate::updateOrCreate(
            ['UserId' => $user->Id, 'CourseId' => $courseId],
            [
                'VerificationCode' => $verificationCode,
                'GeneratedAt' => now(),
                'DownloadUrl' => null,
            ]
        );



        // 4. Generate PDF
        $path = public_path('storage/QuizifyLogo.png');
        if (!file_exists($path)) {
            // Don't delete the record, just report the issue.
            return response()->json(['message' => 'Certificate logo file is missing from the server.'], 500);
        }
        $type = pathinfo($path, PATHINFO_EXTENSION);
        $imgContent = file_get_contents($path);
        $logoSrc = 'data:image/' . $type . ';base64,' . base64_encode($imgContent);

        $instructorName = $course->instructor->FullName ?? 'The Quizify Team';
        $data = [
            'LogoSrc' => $logoSrc,
            'FullName' => $user->FullName,
            'CourseTitle' => $course->Title,
            'IssueDate' => $certificate->GeneratedAt->format('F j, Y'),
            'VerificationCode' => $certificate->VerificationCode,
            'InstructorName' => $instructorName,
        ];

        // LOGGING FOR DEBUG
        Log::info('Certificate Data', ['instructor' => $instructorName, 'data' => $data]);

        try {
            ob_start();
            ob_clean();
            $pdf = Pdf::loadView('pdf.Certificate', $data)->setPaper('a4', 'landscape');
            $pdfContent = $pdf->output();
            if (empty($pdfContent) || strlen($pdfContent) < 100) {
                return response()->json(['message' => 'Failed to generate certificate: PDF content is empty or invalid.'], 500);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to generate certificate PDF.', 'error' => $e->getMessage()], 500);
        } finally {
            if (ob_get_length() > 0) {
                ob_end_clean();
            }
        }

        // 5. Upload to Firebase Storage
        try {
            $storage = app('firebase.storage');
            $bucket = $storage->getBucket('quiz-platform-ids.firebasestorage.app');
            // Add timestamp to filename to force fresh download
            $fileName = 'Certificates/' . $user->Id . '_' . $courseId . '_' . time() . '.pdf';
            $object = $bucket->upload($pdfContent, ['name' => $fileName, 'metadata' => ['contentType' => 'application/pdf']]);
            $downloadUrl = $object->signedUrl(new \DateTime('+100 years'));
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to upload certificate to storage.', 'error' => $e->getMessage()], 500);
        }

        // 6. Update record and return URL
        $certificate->update(['DownloadUrl' => $downloadUrl]);
        return response()->json(['DownloadUrl' => $downloadUrl]);
    }

    public function download(Request $request, string $id)
    {
        $certificate = Certificate::findOrFail($id);
        if ((int) $certificate->UserId !== (int) $request->user()->Id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if (empty($certificate->DownloadUrl)) {
            return response()->json(['message' => 'Certificate is not ready for download.'], 404);
        }
        return redirect($certificate->DownloadUrl);
    }

    public function index(Request $request)
    {
        $query = Certificate::query()->where('UserId', (int) $request->user()->Id);
        if ($request->filled('CourseId')) {
            $query->where('CourseId', (int) $request->input('CourseId'));
        }
        $certificates = $query->orderByDesc('GeneratedAt')->orderByDesc('Id')->paginate((int) $request->input('per_page', 15));
        return response()->json($certificates);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['CourseId' => ['required', 'integer', 'exists:courses,Id']]);
        $userId = (int) $request->user()->Id;
        $courseId = (int) $data['CourseId'];

        $existing = Certificate::where('CourseId', $courseId)->where('UserId', $userId)->first();
        if ($existing) {
            return response()->json(['message' => 'Certificate already exists for this course.', 'data' => $existing], 409);
        }

        $enrolled = Enrollment::where('CourseId', $courseId)->where('UserId', $userId)->exists();
        if (!$enrolled) {
            return response()->json(['message' => 'You must be enrolled in this course to generate a certificate.'], 422);
        }

        $totalLessons = Lesson::where('CourseId', $courseId)->count();
        if ($totalLessons > 0) {
            $completedLessons = LessonCompletion::query()
                ->join('lessons', 'lessons.Id', '=', 'lesson_completions.LessonId')
                ->where('lessons.CourseId', $courseId)
                ->where('lesson_completions.UserId', $userId)
                ->distinct('lesson_completions.LessonId')
                ->count('lesson_completions.LessonId');
            if ($completedLessons < $totalLessons) {
                return response()->json([
                    'message' => 'You must complete all lessons in this course before generating a certificate.',
                    'data' => ['TotalLessons' => $totalLessons, 'CompletedLessons' => $completedLessons, 'RemainingLessons' => $totalLessons - $completedLessons]
                ], 422);
            }
        }

        $quizzes = Quiz::where('CourseId', $courseId)->get();
        if ($quizzes->isNotEmpty()) {
            foreach ($quizzes as $quiz) {
                $highestScore = QuizAttempt::where('QuizId', $quiz->Id)->where('UserId', $userId)->max('Score');
                if ($highestScore === null || $highestScore < $quiz->PassingScore) {
                    return response()->json(['message' => "You must pass all quizzes in the course. Failed or missing attempt for quiz: {$quiz->Title}"], 422);
                }
            }
        }

        $certificate = Certificate::create([
            'CourseId' => $courseId,
            'UserId' => $userId,
            'DownloadUrl' => null,
            'VerificationCode' => Str::upper(Str::random(12)),
            'GeneratedAt' => now(),
            'Platform' => 'Quizify',
        ]);
        return response()->json(['message' => 'Certificate generated successfully.', 'data' => $certificate], 201);
    }

    public function show(Request $request, string $id)
    {
        $certificate = Certificate::find($id);
        if (!$certificate) {
            return response()->json(['message' => 'Certificate not found.'], 404);
        }
        if ((int) $certificate->UserId !== (int) $request->user()->Id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        return response()->json(['data' => $certificate]);
    }

    public function update(Request $request, string $id)
    {
        $certificate = Certificate::find($id);
        if (!$certificate) {
            return response()->json(['message' => 'Certificate not found.'], 404);
        }
        if ((int) $certificate->UserId !== (int) $request->user()->Id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        $data = $request->validate(['DownloadUrl' => ['nullable', 'string', 'max:255']]);
        $certificate->fill($data);
        $certificate->save();
        return response()->json(['message' => 'Certificate updated successfully.', 'data' => $certificate]);
    }

    public function destroy(Request $request, string $id)
    {
        $certificate = Certificate::find($id);
        if (!$certificate) {
            return response()->json(['message' => 'Certificate not found.'], 404);
        }
        if ((int) $certificate->UserId !== (int) $request->user()->Id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        $certificate->delete();
        return response()->json(['message' => 'Certificate deleted successfully.']);
    }
}
