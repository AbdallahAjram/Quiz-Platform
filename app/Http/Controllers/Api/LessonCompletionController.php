<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LessonCompletion;
use Illuminate\Http\Request;

class LessonCompletionController extends Controller
{
    public function index(Request $request)
    {
        $query = LessonCompletion::query()->with(['lesson'])
            ->where('UserId', $request->user()->Id);

        if ($request->filled('LessonId')) {
            $query->where('LessonId', (int) $request->input('LessonId'));
        }

        if ($request->filled('CourseId')) {
            $courseId = (int) $request->input('CourseId');
            $query->whereHas('lesson', function ($q) use ($courseId) {
                $q->where('CourseId', $courseId);
            });
        }

        $completions = $query
            ->orderByDesc('CompletedDate')
            ->paginate((int) $request->input('per_page', 15));

        return response()->json($completions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'LessonId' => ['required', 'integer', 'exists:lessons,Id'],
            'UserId' => ['nullable', 'integer', 'exists:users,Id'],
            'CompletedDate' => ['nullable', 'date'],
        ]);

        // Default to authenticated user if UserId not provided
        $userId = $validated['UserId'] ?? $request->user()->Id;

        // Idempotent: one completion per (UserId, LessonId)
        $completion = LessonCompletion::where('UserId', $userId)
            ->where('LessonId', (int) $validated['LessonId'])
            ->first();

        if ($completion) {
            // Optionally update CompletedDate if provided
            if (isset($validated['CompletedDate'])) {
                $completion->CompletedDate = $validated['CompletedDate'];
                $completion->save();
            }

            return response()->json([
                'message' => 'Lesson already marked as completed.',
                'data' => $completion,
            ]);
        }

        $completion = LessonCompletion::create([
            'UserId' => $userId,
            'LessonId' => (int) $validated['LessonId'],
            'CompletedDate' => $validated['CompletedDate'] ?? now(),
        ]);

        return response()->json([
            'message' => 'Lesson marked as completed.',
            'data' => $completion,
        ], 201);
    }

    public function show(string $id)
    {
        $completion = LessonCompletion::with(['lesson'])->find($id);

        if (!$completion) {
            return response()->json(['message' => 'Lesson completion not found.'], 404);
        }

        return response()->json(['data' => $completion]);
    }

    public function update(Request $request, string $id)
    {
        $completion = LessonCompletion::find($id);

        if (!$completion) {
            return response()->json(['message' => 'Lesson completion not found.'], 404);
        }

        $validated = $request->validate([
            'CompletedDate' => ['required', 'date'],
        ]);

        $completion->CompletedDate = $validated['CompletedDate'];
        $completion->save();

        return response()->json([
            'message' => 'Lesson completion updated.',
            'data' => $completion,
        ]);
    }

    public function destroy(string $id)
    {
        $completion = LessonCompletion::find($id);

        if (!$completion) {
            return response()->json(['message' => 'Lesson completion not found.'], 404);
        }

        $completion->delete();

        return response()->json(['message' => 'Lesson completion deleted.']);
    }

    public function completedLessonsCount(Request $request)
    {
        $userId = $request->user()->Id;
        $count = LessonCompletion::where('UserId', $userId)->count();

        return response()->json(['CompletedLessonsCount' => $count]);
    }
}
