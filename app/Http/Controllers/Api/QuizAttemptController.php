<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuizAttempt;
use App\Models\LessonCompletion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class QuizAttemptController extends Controller
{
    public function index(Request $request)
    {
        // Optional filters:
        // ?QuizId=1
        // ?UserId=1 (admin/debug only; otherwise it’s current user)
        $query = QuizAttempt::query();

        if ($request->filled('QuizId')) {
            $query->where('QuizId', (int) $request->input('QuizId'));
        }

        // If you want to restrict to current user always, remove this block.
        if ($request->filled('UserId')) {
            $query->where('UserId', (int) $request->input('UserId'));
        } else {
            // Default: current user only
            $query->where('UserId', (int) $request->user()->id);
        }

        $attempts = $query
            ->orderByDesc('AttemptDate')
            ->orderByDesc('Id')
            ->paginate((int) $request->input('per_page', 15));

        return response()->json($attempts);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'QuizId' => 'required|integer|exists:quizzes,Id',
            'Answers' => 'required|array',
            'Answers.*.QuestionId' => 'required|integer|exists:questions,Id',
            'Answers.*.SelectedOptionId' => 'nullable|integer|exists:answer_options,Id', // For MCQ
            'Answers.*.SelectedOptionIds' => 'nullable|array|min:1', // For MSQ
            'Answers.*.SelectedOptionIds.*' => 'integer|exists:answer_options,Id',
        ]);

        $quizId = $validatedData['QuizId'];
        $userAnswers = $validatedData['Answers'];

        $quiz = \App\Models\Quiz::with('questions.answerOptions')->findOrFail($quizId);
        $user = $request->user();

        $correctCount = 0;
        foreach ($userAnswers as $userAnswer) {
            $questionId = $userAnswer['QuestionId'];
            $question = $quiz->questions->find($questionId);

            if (!$question) continue;

            $correctOptionIds = $question->answerOptions->where('IsCorrect', true)->pluck('Id')->sort()->values();

            if ($question->QuestionType === 'MCQ' || $question->QuestionType === 'TF') {
                $selectedOptionId = $userAnswer['SelectedOptionId'] ?? null;
                if ($selectedOptionId && $correctOptionIds->count() === 1 && $correctOptionIds[0] == $selectedOptionId) {
                    $correctCount++;
                }
            } elseif ($question->QuestionType === 'MSQ') {
                $selectedOptionIds = collect($userAnswer['SelectedOptionIds'] ?? [])->map(fn($id) => (int)$id)->sort()->values();
                if ($correctOptionIds->all() === $selectedOptionIds->all()) {
                    $correctCount++;
                }
            }
        }

        $totalQuestions = count($quiz->questions);
        $score = ($totalQuestions > 0) ? ($correctCount / $totalQuestions) * 100 : 0;
        $isPassed = $score >= $quiz->PassingScore;

        try {
            $attempt = null;
            DB::transaction(function () use ($quiz, $user, $score, $isPassed, $userAnswers, &$attempt) {
                $attempt = QuizAttempt::create([
                    'QuizId' => $quiz->Id,
                    'UserId' => $user->Id,
                    'Score' => $score,
                    'AttemptDate' => now(),
                    'IsPassed' => $isPassed,
                ]);

                $attemptAnswers = [];
                foreach ($userAnswers as $userAnswer) {
                    if (!empty($userAnswer['SelectedOptionId'])) { // MCQ/TF
                        $attemptAnswers[] = [
                            'AttemptId' => $attempt->Id,
                            'QuestionId' => $userAnswer['QuestionId'],
                            'AnswerId' => $userAnswer['SelectedOptionId'],
                            'CreatedAt' => now(),
                            'UpdatedAt' => now(),
                        ];
                    } elseif (!empty($userAnswer['SelectedOptionIds'])) { // MSQ
                        foreach ($userAnswer['SelectedOptionIds'] as $selectedId) {
                            $attemptAnswers[] = [
                                'AttemptId' => $attempt->Id,
                                'QuestionId' => $userAnswer['QuestionId'],
                                'AnswerId' => $selectedId,
                                'CreatedAt' => now(),
                                'UpdatedAt' => now(),
                            ];
                        }
                    }
                }
                \App\Models\QuizAttemptAnswer::insert($attemptAnswers);

                if ($isPassed && $quiz->LessonId) {
                    LessonCompletion::firstOrCreate([
                        'UserId' => $user->Id,
                        'LessonId' => $quiz->LessonId,
                    ]);
                }
            });

            return response()->json([
                'message' => 'Quiz submitted successfully.',
                'data' => [
                    'AttemptId' => $attempt->Id,
                    'Score' => $score,
                    'IsPassed' => $isPassed,
                    'PassingScore' => $quiz->PassingScore,
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Quiz submission failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'An error occurred during quiz submission.'], 500);
        }
    }

    public function show(string $id)
    {
        $attempt = QuizAttempt::with(['answers'])->find($id);

        if (!$attempt) {
            return response()->json(['message' => 'Quiz attempt not found.'], 404);
        }

        // Restrict to owner (recommended)
        if ((int) $attempt->UserId !== (int) auth()->id()) {
            // Allow admin/instructor to view
            $user = auth()->user();
            if ($user->Role !== 'Admin') {
                $quiz = $attempt->quiz()->with('course')->first();
                if (!$quiz || $quiz->course->CreatedBy !== $user->Id) {
                    return response()->json(['message' => 'Forbidden.'], 403);
                }
            }
        }

        return response()->json(['data' => $attempt]);
    }

    public function getAttemptDetails($attemptId)
    {
        $attempt = QuizAttempt::with([
            'quiz.questions.answerOptions',
            'answers'
        ])->findOrFail($attemptId);

        // Authorization: User must be the one who took the quiz, or an admin, or the course instructor
        $user = auth()->user();
        if ($user->Id !== $attempt->UserId && $user->Role !== 'Admin') {
            $course = $attempt->quiz->course;
            if ($user->Role !== 'Instructor' || $course->CreatedBy !== $user->Id) {
                return response()->json(['message' => 'This action is unauthorized.'], 403);
            }
        }
        
        $questions = $attempt->quiz->questions->map(function ($question) use ($attempt) {
            $userAnswer = $attempt->answers->firstWhere('QuestionId', $question->Id);
            $correctAnswer = $question->answerOptions->firstWhere('IsCorrect', true);

            return [
                'QuestionId' => $question->Id,
                'QuestionText' => $question->QuestionText,
                'AnswerOptions' => $question->answerOptions->map(function ($option) {
                    return [
                        'Id' => $option->Id,
                        'AnswerText' => $option->AnswerText,
                    ];
                }),
                'UserAnswerId' => $userAnswer ? $userAnswer->AnswerId : null,
                'CorrectAnswerId' => $correctAnswer ? $correctAnswer->Id : null,
            ];
        });

        return response()->json([
            'QuizTitle' => $attempt->quiz->Title,
            'AttemptScore' => $attempt->Score,
            'AttemptDate' => $attempt->AttemptDate,
            'Questions' => $questions,
        ]);
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
