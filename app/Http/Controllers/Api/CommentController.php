<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Request $request)
    {
        // Filters:
        // ?CourseId=1 (recommended)
        // ?LessonId=2
        // ?ParentCommentId=3  (replies)
        // ?UserId=1
        // ?search=keyword
        $query = Comment::query();

        if ($request->filled('CourseId')) {
            $query->where('CourseId', (int) $request->input('CourseId'));
        }

        if ($request->filled('LessonId')) {
            $query->where('LessonId', (int) $request->input('LessonId'));
        }

        if ($request->filled('ParentCommentId')) {
            $query->where('ParentCommentId', (int) $request->input('ParentCommentId'));
        }

        if ($request->filled('UserId')) {
            $query->where('UserId', (int) $request->input('UserId'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('Content', 'ILIKE', "%{$search}%");
        }

        $comments = $query
            ->orderByDesc('CreatedAt')
            ->orderByDesc('Id')
            ->paginate((int) $request->input('per_page', 15));

        return response()->json($comments);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'CourseId' => ['required', 'integer', 'exists:courses,Id'],
            'LessonId' => ['nullable', 'integer', 'exists:lessons,Id'],
            'ParentCommentId' => ['nullable', 'integer', 'exists:comments,Id'],
            'Content' => ['required', 'string'],
        ]);

        // If ParentCommentId provided, enforce same CourseId
        if (!empty($data['ParentCommentId'])) {
            $parent = Comment::find($data['ParentCommentId']);
            if ($parent && (int) $parent->CourseId !== (int) $data['CourseId']) {
                return response()->json([
                    'message' => 'ParentCommentId must belong to the same CourseId.'
                ], 422);
            }
        }

        // If LessonId provided, enforce lesson belongs to CourseId
        if (!empty($data['LessonId'])) {
            $lesson = \App\Models\Lesson::find($data['LessonId']);
            if ($lesson && (int) $lesson->CourseId !== (int) $data['CourseId']) {
                return response()->json([
                    'message' => 'LessonId does not belong to the specified CourseId.'
                ], 422);
            }
        }

        $comment = Comment::create([
            'UserId' => (int) $request->user()->id,
            'CourseId' => (int) $data['CourseId'],
            'LessonId' => $data['LessonId'] ?? null,
            'ParentCommentId' => $data['ParentCommentId'] ?? null,
            'Content' => $data['Content'],
        ]);

        return response()->json([
            'message' => 'Comment created successfully.',
            'data' => $comment,
        ], 201);
    }

    public function show(string $id)
    {
        $comment = Comment::with(['replies'])->find($id);

        if (!$comment) {
            return response()->json(['message' => 'Comment not found.'], 404);
        }

        return response()->json(['data' => $comment]);
    }

    public function update(Request $request, string $id)
    {
        $comment = Comment::find($id);

        if (!$comment) {
            return response()->json(['message' => 'Comment not found.'], 404);
        }

        // Only the owner can edit
        if ((int) $comment->UserId !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'Content' => ['required', 'string'],
        ]);

        $comment->Content = $data['Content'];
        $comment->save();

        return response()->json([
            'message' => 'Comment updated successfully.',
            'data' => $comment,
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $comment = Comment::find($id);

        if (!$comment) {
            return response()->json(['message' => 'Comment not found.'], 404);
        }

        // Only the owner can delete
        if ((int) $comment->UserId !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully.']);
    }
}
