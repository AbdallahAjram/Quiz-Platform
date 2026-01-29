<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class LessonController extends Controller
{
    public function index(Request $request)
    {
        // Optional filters:
        // ?CourseId=1
        // ?search=keyword
        $query = Lesson::query();

        if ($request->filled('CourseId')) {
            $query->where('CourseId', (int) $request->input('CourseId'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('Title', 'ILIKE', "%{$search}%")
                    ->orWhere('Content', 'ILIKE', "%{$search}%");
            });
        }

        // Default ordering: CourseId then Order then Id
        $lessons = $query
            ->orderBy('CourseId')
            ->orderBy('Order')
            ->orderBy('Id')
            ->paginate((int) $request->input('per_page', 15));

        return response()->json($lessons);
    }

    public function getLessonsForCourse($CourseId)
    {
        $userId = auth()->id();
        $lessons = Lesson::with([
            'quiz.attempts' => function ($query) use ($userId) {
                $query->where('UserId', $userId)->orderBy('Score', 'DESC');
            }
        ])->where('CourseId', $CourseId)->orderBy('Order')->get();

        $lessons->each(function ($lesson) {
            if ($lesson->quiz) {
                $lesson->quiz->highestAttempt = $lesson->quiz->attempts->first();
                // unset($lesson->quiz->attempts); // Clean up to reduce payload size
            }
        });

        return response()->json($lessons);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'CourseId' => ['required', 'integer', 'exists:courses,Id'],
            'Title' => ['required', 'string', 'max:255'],
            'Content' => ['required', 'string'],
            'VideoUrl' => ['nullable', 'string', 'max:2048'],
            'AttachmentUrl' => ['nullable', 'string', 'max:2048'],
            'EstimatedDuration' => ['required', 'integer', 'min:0'],
            'Order' => ['required', 'integer', 'min:0'],
        ]);

        $lesson = Lesson::create($validated);

        return response()->json([
            'message' => 'Lesson created successfully.',
            'data' => $lesson,
        ], 201);
    }

    public function show(string $id)
    {
        $lesson = Lesson::find($id);

        if (!$lesson) {
            return response()->json([
                'message' => 'Lesson not found.',
            ], 404);
        }

        return response()->json([
            'data' => $lesson,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $lesson = Lesson::find($id);

        if (!$lesson) {
            return response()->json([
                'message' => 'Lesson not found.',
            ], 404);
        }

        $validated = $request->validate([
            'CourseId' => ['sometimes', 'integer', 'exists:courses,Id'],
            'Title' => ['sometimes', 'string', 'max:255'],
            'Content' => ['sometimes', 'string'],
            'VideoUrl' => ['nullable', 'string', 'max:2048'],
            'AttachmentUrl' => ['nullable', 'string', 'max:2048'],
            'EstimatedDuration' => ['sometimes', 'integer', 'min:0'],
            'Order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $lesson->fill($validated);
        $lesson->save();

        return response()->json([
            'message' => 'Lesson updated successfully.',
            'data' => $lesson,
        ]);
    }

    public function destroy(string $id)
    {
        $lesson = Lesson::find($id);

        if (!$lesson) {
            return response()->json([
                'message' => 'Lesson not found.',
            ], 404);
        }

        $lesson->delete();

        return response()->json(['message' => 'Lesson deleted successfully.']);
    }

    public function download(string $id)
    {
        $lesson = Lesson::find($id);

        if (!$lesson) {
            return response()->json([
                'message' => 'Lesson not found.',
            ], 404);
        }

        if (empty($lesson->AttachmentUrl)) {
            return response()->json([
                'message' => 'No attachment available for this lesson.',
            ], 404);
        }

        $url = $lesson->AttachmentUrl;
        $isExternal = Str::startsWith($url, ['http://', 'https://']);

        // Determine Original Filename for parsing
        if ($isExternal) {
            // Parse URL path to get the filename (ignoring query params like tokens)
            $path = parse_url($url, PHP_URL_PATH);
            $originalFilename = pathinfo(urldecode($path), PATHINFO_BASENAME);
        } else {
            // Check if local file exists
            // Check both public and default disks
            if (!Storage::disk('public')->exists($url) && !Storage::exists($url)) {
                return response()->json([
                    'message' => 'File not found on server.',
                ], 404);
            }
            $originalFilename = pathinfo($url, PATHINFO_BASENAME);
        }

        // Use pathinfo to properly parse name and extension
        $info = pathinfo($originalFilename);
        $extension = isset($info['extension']) ? $info['extension'] : '';

        // Determine the clean extension
        $cleanExtension = $extension;

        // Common extensions list
        $knownExtensions = ['pdf', 'docx', 'doc', 'zip', 'png', 'jpg', 'jpeg', 'mp4'];

        foreach ($knownExtensions as $ext) {
            // If extension starts with a known type but is longer (e.g. "pdfUUID...")
            if (Str::startsWith(Str::lower($extension), $ext) && strlen($extension) > strlen($ext)) {
                $cleanExtension = $ext;
                break;
            }
        }

        // Fallback: Default to pdf if no extension found
        if (empty($cleanExtension)) {
            $cleanExtension = 'pdf';
        }

        // Generate clean filename using Lesson Title + Clean Extension
        // User requested: "NOT import the UUID"
        // Format: Lesson_Title.ext
        $cleanFilename = Str::slug($lesson->Title, '_') . '.' . $cleanExtension;

        // Serve the file
        if ($isExternal) {
            return response()->streamDownload(function () use ($url) {
                echo Http::get($url)->body();
            }, $cleanFilename);
        } else {
            // Serve from correct disk
            if (Storage::disk('public')->exists($url)) {
                return Storage::disk('public')->download($url, $cleanFilename);
            }
            return Storage::download($url, $cleanFilename);
        }
    }
}