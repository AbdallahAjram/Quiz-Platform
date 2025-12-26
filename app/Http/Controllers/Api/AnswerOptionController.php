<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnswerOption;
use Illuminate\Http\Request;

class AnswerOptionController extends Controller
{
    public function index(Request $request)
    {
        // Optional filters:
        // ?QuestionId=1
        // ?IsCorrect=true
        // ?search=keyword
        $query = AnswerOption::query();

        if ($request->filled('QuestionId')) {
            $query->where('QuestionId', (int) $request->input('QuestionId'));
        }

        if ($request->filled('IsCorrect')) {
            // Accept true/false/1/0
            $isCorrect = filter_var($request->input('IsCorrect'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if (!is_null($isCorrect)) {
                $query->where('IsCorrect', $isCorrect);
            }
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('AnswerText', 'ILIKE', "%{$search}%");
        }

        $options = $query
            ->orderBy('QuestionId')
            ->orderBy('Id')
            ->paginate((int) $request->input('per_page', 15));

        return response()->json($options);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'QuestionId' => ['required', 'integer', 'exists:questions,Id'],
            'AnswerText' => ['required', 'string'],
            'IsCorrect' => ['nullable', 'boolean'],
        ]);

        $option = AnswerOption::create([
            'QuestionId' => (int) $data['QuestionId'],
            'AnswerText' => $data['AnswerText'],
            'IsCorrect' => (bool) ($data['IsCorrect'] ?? false),
        ]);

        return response()->json([
            'message' => 'Answer option created successfully.',
            'data' => $option,
        ], 201);
    }

    public function show(string $id)
    {
        $option = AnswerOption::find($id);

        if (!$option) {
            return response()->json(['message' => 'Answer option not found.'], 404);
        }

        return response()->json(['data' => $option]);
    }

    public function update(Request $request, string $id)
    {
        $option = AnswerOption::find($id);

        if (!$option) {
            return response()->json(['message' => 'Answer option not found.'], 404);
        }

        $data = $request->validate([
            'QuestionId' => ['sometimes', 'integer', 'exists:questions,Id'],
            'AnswerText' => ['sometimes', 'string'],
            'IsCorrect' => ['sometimes', 'boolean'],
        ]);

        $option->fill($data);
        $option->save();

        return response()->json([
            'message' => 'Answer option updated successfully.',
            'data' => $option,
        ]);
    }

    public function destroy(string $id)
    {
        $option = AnswerOption::find($id);

        if (!$option) {
            return response()->json(['message' => 'Answer option not found.'], 404);
        }

        $option->delete();

        return response()->json(['message' => 'Answer option deleted successfully.']);
    }
}
