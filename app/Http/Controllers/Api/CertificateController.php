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

class CertificateController extends Controller
{
    public function index(Request $request)
    {
        $query = Certificate::query()
            ->where('UserId', (int) $request->user()->id);

        if ($request->filled('CourseId')) {
            $query->where('CourseId', (int) $request->input('CourseId'));
        }

        $certificates = $query
            ->orderByDesc('GeneratedAt')
            ->orderByDesc('Id')
            ->paginate((int) $request->input('per_page', 15));

        return response()->json($certificates);
    }

    /**
     * Generate certificate for a course (real logic).
     *
     * POST /api/certificates
     * Body: { "CourseId": 1 }
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'CourseId' => ['required', 'integer', 'exists:courses,Id'],
        ]);

        $userId = (int) $request->user()->id;
        $courseId = (int) $data['CourseId'];

        // Prevent duplicates
        $existing = Certificate::where('CourseId', $courseId)
            ->where('UserId', $userId)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Certificate already exists for this course.',
                'data' => $existing,
            ], 409);
        }

        // 1) Must be enrolled
        $enrolled = Enrollment::where('CourseId', $courseId)
            ->where('UserId', $userId)
            ->exists();

        if (!$enrolled) {
            return response()->json([
                'message' => 'You must be enrolled in this course to generate a certificate.'
            ], 422);
        }

        // 2) Must complete all lessons (if course has lessons)
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
                    'data' => [
                        'TotalLessons' => $totalLessons,
                        'CompletedLessons' => $completedLessons,
                        'RemainingLessons' => $totalLessons - $completedLessons,
                    ]
                ], 422);
            }
        }

        // 3) Must pass all quizzes in the course, considering the highest score for each.
        $quizzes = Quiz::where('CourseId', $courseId)->get();

        if ($quizzes->isNotEmpty()) {
            foreach ($quizzes as $quiz) {
                $highestScore = QuizAttempt::where('QuizId', $quiz->Id)
                    ->where('UserId', $userId)
                    ->max('Score');

                if ($highestScore === null || $highestScore < $quiz->PassingScore) {
                    return response()->json([
                        'message' => "You must pass all quizzes in the course. Failed or missing attempt for quiz: {$quiz->Title}",
                    ], 422);
                }
            }
        }

        // Generate
        $certificate = Certificate::create([
            'CourseId' => $courseId,
            'UserId' => $userId,
            'DownloadUrl' => null, // set later if you implement PDF generation
            'VerificationCode' => Str::upper(Str::random(12)),
            'GeneratedAt' => now(),
            'Platform' => 'Quizify',
        ]);

        return response()->json([
            'message' => 'Certificate generated successfully.',
            'data' => $certificate,
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $certificate = Certificate::find($id);

        if (!$certificate) {
            return response()->json(['message' => 'Certificate not found.'], 404);
        }

        if ((int) $certificate->UserId !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json(['data' => $certificate]);
    }

    public function update(Request $request, string $id)
    {
        // In a real system, users should not update certificates.
        // Keeping minimal functionality: allow setting DownloadUrl only.
        $certificate = Certificate::find($id);

        if (!$certificate) {
            return response()->json(['message' => 'Certificate not found.'], 404);
        }

        if ((int) $certificate->UserId !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'DownloadUrl' => ['nullable', 'string', 'max:255'],
        ]);

        $certificate->fill($data);
        $certificate->save();

        return response()->json([
            'message' => 'Certificate updated successfully.',
            'data' => $certificate,
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $certificate = Certificate::find($id);

        if (!$certificate) {
            return response()->json(['message' => 'Certificate not found.'], 404);
        }

        if ((int) $certificate->UserId !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $certificate->delete();

        return response()->json(['message' => 'Certificate deleted successfully.']);
    }
}
