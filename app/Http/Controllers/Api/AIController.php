<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Services\OpenAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\AnswerOption;
use Illuminate\Support\Facades\Auth;

class AIController extends Controller
{
    protected $openAIService;

    public function __construct(OpenAIService $openAIService)
    {
        $this->openAIService = $openAIService;
    }

    public function generateQuiz(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'prompt' => 'nullable|string|max:5000',
                'lesson_ids' => 'nullable|array',
                'lesson_ids.*' => 'integer|exists:lessons,Id',
                'num_questions' => 'required|integer|min:1|max:20',
                'num_choices' => 'required|integer|min:2|max:8',
                'CourseId' => 'required|integer|exists:courses,Id',
                'LessonId' => 'nullable|integer|exists:lessons,Id',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $prompt = $request->input('prompt');
            $lessonIds = $request->input('lesson_ids');
            $numQuestions = $request->input('num_questions');
            $numChoices = $request->input('num_choices');
            $context = '';

            if (!empty($lessonIds)) {
                $lessons = Lesson::whereIn('Id', $lessonIds)->pluck('Content')->implode("\n\n");
                $context = $lessons;
            } elseif (!empty($prompt)) {
                $context = $prompt;
            } else {
                $course = \App\Models\Course::with('lessons')->find($request->input('CourseId'));
                if ($course) {
                    $context = $course->lessons->pluck('Content')->implode("\n\n");
                }
                if (empty($context)) {
                    return response()->json(['error' => 'Either prompt or lesson_ids must be provided if the course has no content.'], 422);
                }
            }

            $generatedData = $this->openAIService->generateQuiz($context, $numQuestions, $numChoices);

            if (!$generatedData || !isset($generatedData['questions'])) {
                return response()->json(['error' => 'The AI failed to generate a valid quiz. Please try again or adjust your prompt.'], 422);
            }
            
            return response()->json($generatedData['questions']);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function saveQuiz(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'CourseId' => 'required|integer|exists:courses,Id',
            'LessonId' => 'nullable|integer|exists:lessons,Id',
            'Title' => 'required|string|max:255',
            'PassingScore' => 'sometimes|integer|min:0|max:100',
            'TimeLimit' => 'sometimes|integer|min:0',
            'questions' => 'required|array',
            'questions.*.QuestionText' => 'required|string',
            'questions.*.QuestionType' => 'required|string|in:MCQ,TF,MSQ',
            'questions.*.answer_options' => 'required|array',
            'questions.*.answer_options.*.AnswerText' => 'required|string',
            'questions.*.answer_options.*.IsCorrect' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validatedData = $validator->validated();

        try {
            DB::transaction(function () use ($validatedData) {
                $quiz = Quiz::create([
                    'CourseId' => $validatedData['CourseId'],
                    'LessonId' => $validatedData['LessonId'] ?? null,
                    'Title' => $validatedData['Title'],
                    'PassingScore' => $validatedData['PassingScore'] ?? 50,
                    'TimeLimit' => $validatedData['TimeLimit'] ?? 20,
                ]);

                foreach ($validatedData['questions'] as $index => $questionData) {
                    $question = $quiz->questions()->create([
                        'QuestionText' => $questionData['QuestionText'],
                        'QuestionType' => $questionData['QuestionType'],
                        'Order' => $index + 1,
                        'ImagePath' => $questionData['ImagePath'] ?? null,
                    ]);

                    $answerOptions = array_map(function ($option) {
                        return [
                            'AnswerText' => $option['AnswerText'],
                            'IsCorrect' => (int)$option['IsCorrect'],
                        ];
                    }, $questionData['answer_options']);

                    $question->answerOptions()->createMany($answerOptions);
                }
            });
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to save quiz. ' . $e->getMessage()], 500);
        }

        return response()->json(['message' => 'Quiz saved successfully.']);
    }
}
