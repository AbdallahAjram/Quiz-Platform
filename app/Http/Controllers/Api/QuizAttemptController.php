<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;

class QuizAttemptController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = QuizAttempt::query();

        if ($user->Role === 'Student') {
            $query->where('UserId', $user->id);
        } elseif ($user->Role === 'Instructor') {
            $instructorId = $user->id;
            $query->whereHas('quiz.course', function ($q) use ($instructorId) {
                $q->where('CreatedBy', $instructorId);
            });

            // Allow instructor to filter by a specific student within their courses
            if ($request->filled('UserId')) {
                // Extra check: is this student enrolled in one of my courses? (optional but good)
                $query->where('UserId', (int) $request->input('UserId'));
            }
        }
        // Admin has no restrictions by default

        if ($request->filled('QuizId')) {
            $query->where('QuizId', (int) $request->input('QuizId'));
        }

        if ($user->Role === 'Admin' && $request->filled('UserId')) {
            $query->where('UserId', (int) $request->input('UserId'));
        }

        $attempts = $query
            ->with(['user:id,name', 'quiz:Id,Title']) // Eager load relationships
            ->orderByDesc('AttemptDate')
            ->orderByDesc('Id')
            ->paginate((int) $request->input('per_page', 15));

        return response()->json($attempts);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'QuizId' => ['required', 'integer', 'exists:quizzes,Id'],

            // Optional (you can also compute these later when finishing attempt)
            'AttemptDate' => ['nullable', 'date'],
        ]);

        $attempt = QuizAttempt::create([
            'QuizId' => (int) $data['QuizId'],
            'UserId' => (int) $request->user()->id,
            'Score' => 0,
            'AttemptDate' => $data['AttemptDate'] ?? now(),
            'Duration' => null,
            'IsPassed' => false,
        ]);

        return response()->json([
            'message' => 'Quiz attempt created successfully.',
            'data' => $attempt,
        ], 201);
    }

    public function show(string $id)
    {
        $attempt = QuizAttempt::with(['answers'])->find($id);

        if (!$attempt) {
            return response()->json(['message' => 'Quiz attempt not found.'], 404);
        }

        // Restrict to owner (recommended)
        if ((int) $attempt->UserId !== (int) auth()->id()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json(['data' => $attempt]);
    }

    public function update(Request $request, string $id)
    {
        $attempt = QuizAttempt::find($id);

        if (!$attempt) {
            return response()->json(['message' => 'Quiz attempt not found.'], 404);
        }

        // Restrict to owner
        if ((int) $attempt->UserId !== (int) auth()->id()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // This endpoint is your "finalize attempt" hook.
        // You can set Duration and/or manually set Score/IsPassed.
        // Later you can replace Score/IsPassed with auto-scoring logic.
        $data = $request->validate([
            'Score' => ['sometimes', 'integer', 'min:0'],
            'IsPassed' => ['sometimes', 'boolean'],
            'Duration' => ['nullable', 'integer', 'min:0'],
            'AttemptDate' => ['sometimes', 'date'],
        ]);

        $attempt->fill($data);
        $attempt->save();

        return response()->json([
            'message' => 'Quiz attempt updated successfully.',
            'data' => $attempt,
        ]);
    }

    public function destroy(string $id)
    {
        $attempt = QuizAttempt::find($id);

        if (!$attempt) {
            return response()->json(['message' => 'Quiz attempt not found.'], 404);
        }

        // Restrict to owner
        if ((int) $attempt->UserId !== (int) auth()->id()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $attempt->delete();

        return response()->json(['message' => 'Quiz attempt deleted successfully.']);
    }

    public function submit(Request $request, string $id)
{
    $attempt = \App\Models\QuizAttempt::with([
        'quiz',
        'quiz.questions.answerOptions',
        'answers',
    ])->find($id);

    if (!$attempt) {
        return response()->json(['message' => 'Quiz attempt not found.'], 404);
    }

    if ((int) $attempt->UserId !== (int) auth()->id()) {
        return response()->json(['message' => 'Forbidden.'], 403);
    }

    $data = $request->validate([
        // Optional: store duration at submit time
        'Duration' => ['nullable', 'integer', 'min:0'],
    ]);

    // Group submitted answers by QuestionId
    $submittedByQuestion = [];
    foreach ($attempt->answers as $ans) {
        $qid = (int) $ans->QuestionId;
        if (!isset($submittedByQuestion[$qid])) {
            $submittedByQuestion[$qid] = [
                'answerIds' => [],
                'textAnswers' => [],
            ];
        }
        if (!is_null($ans->AnswerId)) {
            $submittedByQuestion[$qid]['answerIds'][] = (int) $ans->AnswerId;
        }
        if (!is_null($ans->TextAnswer)) {
            $submittedByQuestion[$qid]['textAnswers'][] = (string) $ans->TextAnswer;
        }
    }

    $results = [];
    $gradedCount = 0;
    $correctCount = 0;
    $totalQuestions = $attempt->quiz->questions->count();

    foreach ($attempt->quiz->questions as $q) {
        $qid = (int) $q->Id;
        $type = (string) $q->QuestionType;

        $correctOptionIds = $q->answerOptions
            ->where('IsCorrect', true)
            ->pluck('Id')
            ->map(fn ($v) => (int) $v)
            ->values()
            ->all();

        $submitted = $submittedByQuestion[$qid] ?? ['answerIds' => [], 'textAnswers' => []];
        $submittedIds = array_values(array_unique($submitted['answerIds']));

        // Default: not graded
        $isGraded = false;
        $isCorrect = false;
        $reason = null;

        if ($type === 'single') {
            $isGraded = true;
            $gradedCount++;

            // Single expects exactly 1 selected and exactly 1 correct
            $expected = count($correctOptionIds) === 1 ? $correctOptionIds[0] : null;
            $picked = count($submittedIds) === 1 ? $submittedIds[0] : null;

            $isCorrect = (!is_null($expected) && !is_null($picked) && $picked === $expected);

            if ($expected === null) {
                $reason = 'No single correct option defined for this question.';
            } elseif ($picked === null) {
                $reason = 'No answer selected.';
            }
        } elseif ($type === 'multiple') {
            $isGraded = true;
            $gradedCount++;

            sort($correctOptionIds);
            sort($submittedIds);

            $isCorrect = ($submittedIds === $correctOptionIds);

            if (empty($submittedIds)) {
                $reason = 'No answers selected.';
            }
        } else {
            // text or unknown types: not auto-gradable with current schema
            $reason = 'Not auto-gradable (text/manual grading required).';
        }

        if ($isGraded && $isCorrect) {
            $correctCount++;
        }

        $results[] = [
            'QuestionId' => $qid,
            'QuestionType' => $type,
            'IsGraded' => $isGraded,
            'IsCorrect' => $isCorrect,
            'CorrectOptionIds' => $correctOptionIds,
            'SubmittedAnswerIds' => $submittedIds,
            'Note' => $reason,
        ];
    }

    // Score is percentage over graded questions only
    $score = 0;
    if ($gradedCount > 0) {
        $score = (int) round(($correctCount / $gradedCount) * 100);
    }

    $passed = $attempt->quiz && $score >= (int) $attempt->quiz->PassingScore;

    $attempt->Score = $score;
    $attempt->IsPassed = $passed;
    if (isset($data['Duration'])) {
        $attempt->Duration = (int) $data['Duration'];
    }
    $attempt->save();

    return response()->json([
        'message' => 'Attempt submitted and graded successfully.',
        'data' => [
            'AttemptId' => (int) $attempt->Id,
            'QuizId' => (int) $attempt->QuizId,
            'TotalQuestions' => $totalQuestions,
            'GradedQuestions' => $gradedCount,
            'CorrectGradedAnswers' => $correctCount,
            'Score' => $score,
            'PassingScore' => (int) $attempt->quiz->PassingScore,
            'IsPassed' => (bool) $passed,
            'Duration' => $attempt->Duration,
            'PerQuestion' => $results,
        ],
    ]);
}

}
