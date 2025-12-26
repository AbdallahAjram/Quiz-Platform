<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function index(Request $request)
    {
        // Optional filters:
        // ?CourseId=1
        // ?LessonId=2
        // ?search=keyword
        $query = Quiz::query();

        if ($request->filled('CourseId')) {
            $query->where('CourseId', (int) $request->input('CourseId'));
        }

        if ($request->filled('LessonId')) {
            $query->where('LessonId', (int) $request->input('LessonId'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('Title', 'ILIKE', "%{$search}%");
        }

        $quizzes = $query
            ->orderByDesc('Id')
            ->paginate((int) $request->input('per_page', 15));

        return response()->json($quizzes);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'CourseId' => ['required', 'integer', 'exists:courses,Id'],
            'LessonId' => ['nullable', 'integer', 'exists:lessons,Id'],

            'Title' => ['required', 'string', 'max:255'],
            'PassingScore' => ['required', 'integer', 'min:0'],

            // Decide what units you use (minutes/seconds). This enforces only integer >= 1.
            'TimeLimit' => ['nullable', 'integer', 'min:1'],

            'ShuffleQuestions' => ['nullable', 'boolean'],
        ]);

        // Optional: if LessonId is provided, ensure the lesson belongs to the same course.
        if (!empty($data['LessonId'])) {
            $lesson = \App\Models\Lesson::find($data['LessonId']);
            if ($lesson && (int) $lesson->CourseId !== (int) $data['CourseId']) {
                return response()->json([
                    'message' => 'LessonId does not belong to the specified CourseId.'
                ], 422);
            }
        }

        $quiz = Quiz::create([
            'CourseId' => (int) $data['CourseId'],
            'LessonId' => $data['LessonId'] ?? null,
            'Title' => $data['Title'],
            'PassingScore' => (int) $data['PassingScore'],
            'TimeLimit' => $data['TimeLimit'] ?? null,
            'ShuffleQuestions' => (bool) ($data['ShuffleQuestions'] ?? false),
        ]);

        return response()->json([
            'message' => 'Quiz created successfully.',
            'data' => $quiz,
        ], 201);
    }

    public function show(string $id)
    {
        $quiz = Quiz::find($id);

        if (!$quiz) {
            return response()->json(['message' => 'Quiz not found.'], 404);
        }

        return response()->json(['data' => $quiz]);
    }

    public function update(Request $request, string $id)
    {
        $quiz = Quiz::find($id);

        if (!$quiz) {
            return response()->json(['message' => 'Quiz not found.'], 404);
        }

        $data = $request->validate([
            'CourseId' => ['sometimes', 'integer', 'exists:courses,Id'],
            'LessonId' => ['nullable', 'integer', 'exists:lessons,Id'],

            'Title' => ['sometimes', 'string', 'max:255'],
            'PassingScore' => ['sometimes', 'integer', 'min:0'],
            'TimeLimit' => ['nullable', 'integer', 'min:1'],
            'ShuffleQuestions' => ['sometimes', 'boolean'],
        ]);

        // If both provided/available, enforce lesson belongs to course
        $courseIdToCheck = isset($data['CourseId']) ? (int) $data['CourseId'] : (int) $quiz->CourseId;
        $lessonIdToCheck = array_key_exists('LessonId', $data) ? $data['LessonId'] : $quiz->LessonId;

        if (!empty($lessonIdToCheck)) {
            $lesson = \App\Models\Lesson::find($lessonIdToCheck);
            if ($lesson && (int) $lesson->CourseId !== $courseIdToCheck) {
                return response()->json([
                    'message' => 'LessonId does not belong to the specified CourseId.'
                ], 422);
            }
        }

        $quiz->fill($data);
        $quiz->save();

        return response()->json([
            'message' => 'Quiz updated successfully.',
            'data' => $quiz,
        ]);
    }

    public function destroy(string $id)
    {
        $quiz = Quiz::find($id);

        if (!$quiz) {
            return response()->json(['message' => 'Quiz not found.'], 404);
        }

        $quiz->delete();

        return response()->json(['message' => 'Quiz deleted successfully.']);
    }
}
