<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Question;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function index(Request $request)
    {
        // Optional filters:
        // ?QuizId=1
        // ?search=keyword
        $query = Question::query();

        if ($request->filled('QuizId')) {
            $query->where('QuizId', (int) $request->input('QuizId'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('QuestionText', 'ILIKE', "%{$search}%");
        }

        $questions = $query
            ->orderBy('QuizId')
            ->orderBy('Order')
            ->orderBy('Id')
            ->paginate((int) $request->input('per_page', 15));

        return response()->json($questions);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'QuizId' => ['required', 'integer', 'exists:quizzes,Id'],
            'QuestionText' => ['required', 'string'],
            'QuestionType' => ['required', 'string', 'max:50'],
            'Order' => ['required', 'integer', 'min:0'],
        ]);

        $question = Question::create([
            'QuizId' => (int) $data['QuizId'],
            'QuestionText' => $data['QuestionText'],
            'QuestionType' => $data['QuestionType'],
            'Order' => (int) $data['Order'],
        ]);

        return response()->json([
            'message' => 'Question created successfully.',
            'data' => $question,
        ], 201);
    }

    public function show(string $id)
    {
        $question = Question::with(['answerOptions'])->find($id);

        if (!$question) {
            return response()->json(['message' => 'Question not found.'], 404);
        }

        return response()->json(['data' => $question]);
    }

    public function update(Request $request, string $id)
    {
        $question = Question::find($id);

        if (!$question) {
            return response()->json(['message' => 'Question not found.'], 404);
        }

        $data = $request->validate([
            'QuizId' => ['sometimes', 'integer', 'exists:quizzes,Id'],
            'QuestionText' => ['sometimes', 'string'],
            'QuestionType' => ['sometimes', 'string', 'max:50'],
            'Order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $question->fill($data);
        $question->save();

        return response()->json([
            'message' => 'Question updated successfully.',
            'data' => $question,
        ]);
    }

    public function destroy(string $id)
    {
        $question = Question::find($id);

        if (!$question) {
            return response()->json(['message' => 'Question not found.'], 404);
        }

        $question->delete();

        return response()->json(['message' => 'Question deleted successfully.']);
    }
}
