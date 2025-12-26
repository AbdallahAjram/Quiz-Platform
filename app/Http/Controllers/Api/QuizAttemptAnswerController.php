<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use App\Models\Question;
use Illuminate\Http\Request;

class QuizAttemptAnswerController extends Controller
{
    public function index(Request $request)
    {
        // Optional filters:
        // ?AttemptId=1
        // ?QuestionId=2
        $query = QuizAttemptAnswer::query();

        if ($request->filled('AttemptId')) {
            $query->where('AttemptId', (int) $request->input('AttemptId'));
        }

        if ($request->filled('QuestionId')) {
            $query->where('QuestionId', (int) $request->input('QuestionId'));
        }

        $answers = $query
            ->orderByDesc('Id')
            ->paginate((int) $request->input('per_page', 15));

        return response()->json($answers);
    }

public function store(Request $request)
{
    $data = $request->validate([
        'AttemptId' => ['required', 'integer', 'exists:quiz_attempts,Id'],
        'QuestionId' => ['required', 'integer', 'exists:questions,Id'],

        // Accept integer or array (we validate deeper below)
        'AnswerId' => ['nullable'],
        'TextAnswer' => ['nullable', 'string'],
    ]);

    $attempt = \App\Models\QuizAttempt::find($data['AttemptId']);
    if ((int) $attempt->UserId !== (int) auth()->id()) {
        return response()->json(['message' => 'Forbidden.'], 403);
    }

    $question = \App\Models\Question::find($data['QuestionId']);
    if ((int) $question->QuizId !== (int) $attempt->QuizId) {
        return response()->json([
            'message' => 'QuestionId does not belong to the quiz of this attempt.'
        ], 422);
    }

    // Normalize AnswerId to array
    $answerIds = [];
    if (array_key_exists('AnswerId', $data) && !is_null($data['AnswerId'])) {
        if (is_array($data['AnswerId'])) {
            $answerIds = $data['AnswerId'];
        } else {
            $answerIds = [(int) $data['AnswerId']];
        }

        // Ensure all are integers and unique
        $answerIds = array_values(array_unique(array_map('intval', $answerIds)));
    }

    // Validate each answer option belongs to this question
    if (!empty($answerIds)) {
        $count = \App\Models\AnswerOption::whereIn('Id', $answerIds)
            ->where('QuestionId', (int) $data['QuestionId'])
            ->count();

        if ($count !== count($answerIds)) {
            return response()->json([
                'message' => 'One or more AnswerId values do not belong to the provided QuestionId.'
            ], 422);
        }
    }

    // Replace any prior answers for this AttemptId + QuestionId
    \App\Models\QuizAttemptAnswer::where('AttemptId', (int) $data['AttemptId'])
        ->where('QuestionId', (int) $data['QuestionId'])
        ->delete();

    // If text answer, insert one row with TextAnswer (AnswerId null)
    if (!empty($data['TextAnswer'])) {
        $created = \App\Models\QuizAttemptAnswer::create([
            'AttemptId' => (int) $data['AttemptId'],
            'QuestionId' => (int) $data['QuestionId'],
            'AnswerId' => null,
            'TextAnswer' => $data['TextAnswer'],
        ]);

        return response()->json([
            'message' => 'Quiz attempt answer saved successfully.',
            'data' => $created,
        ], 201);
    }

    // If choices, insert one row per chosen option
    $createdRows = [];
    foreach ($answerIds as $aid) {
        $createdRows[] = \App\Models\QuizAttemptAnswer::create([
            'AttemptId' => (int) $data['AttemptId'],
            'QuestionId' => (int) $data['QuestionId'],
            'AnswerId' => (int) $aid,
            'TextAnswer' => null,
        ]);
    }

    return response()->json([
        'message' => 'Quiz attempt answers saved successfully.',
        'data' => $createdRows,
    ], 201);
}


    public function show(string $id)
    {
        $answer = QuizAttemptAnswer::find($id);

        if (!$answer) {
            return response()->json(['message' => 'Quiz attempt answer not found.'], 404);
        }

        // Restrict to owner via attempt
        $attempt = QuizAttempt::find($answer->AttemptId);
        if ($attempt && (int) $attempt->UserId !== (int) auth()->id()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json(['data' => $answer]);
    }

    public function update(Request $request, string $id)
    {
        $answer = QuizAttemptAnswer::find($id);

        if (!$answer) {
            return response()->json(['message' => 'Quiz attempt answer not found.'], 404);
        }

        $attempt = QuizAttempt::find($answer->AttemptId);
        if ($attempt && (int) $attempt->UserId !== (int) auth()->id()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'AnswerId' => ['nullable', 'integer', 'exists:answer_options,Id'],
            'TextAnswer' => ['nullable', 'string'],
        ]);

        $answer->fill($data);
        $answer->save();

        return response()->json([
            'message' => 'Quiz attempt answer updated successfully.',
            'data' => $answer,
        ]);
    }

    public function destroy(string $id)
    {
        $answer = QuizAttemptAnswer::find($id);

        if (!$answer) {
            return response()->json(['message' => 'Quiz attempt answer not found.'], 404);
        }

        $attempt = QuizAttempt::find($answer->AttemptId);
        if ($attempt && (int) $attempt->UserId !== (int) auth()->id()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $answer->delete();

        return response()->json(['message' => 'Quiz attempt answer deleted successfully.']);
    }
}
