<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
        $lessons = Lesson::with(['quiz' => function ($query) use ($userId) {
            $query->withExists(['attempts as has_attempted' => function ($q) use ($userId) {
                $q->where('UserId', $userId);
            }]);
            $query->addSelect(['last_attempt_id' => \App\Models\QuizAttempt::select('Id')
                ->whereColumn('QuizId', 'quizzes.Id')
                ->where('UserId', $userId)
                ->orderByDesc('CreatedAt')
                ->limit(1)
            ]);
        }])->where('CourseId', $CourseId)->orderBy('Order')->get();
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
}

