<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\User;
use App\Models\LessonCompletion;
use App\Models\Question;
use App\Models\AnswerOption;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Lesson;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        if ($user->Role === 'Admin') {
            $quizzes = Quiz::with('course')->withCount('attempts')->get();
        } elseif ($user->Role === 'Instructor') {
            $quizzes = Quiz::whereHas('course', function ($query) use ($user) {
                $query->where('CreatedBy', $user->Id);
            })->with('course')->withCount('attempts')->get();
        } else {
            return response()->json([]);
        }

        $formattedQuizzes = $quizzes->map(function ($quiz) {
            return [
                'Id' => $quiz->Id,
                'Title' => $quiz->Title,
                'CourseTitle' => $quiz->course ? $quiz->course->Title : null,
                'attempts_count' => $quiz->attempts_count,
            ];
        });

        return response()->json($formattedQuizzes);
    }

    public function getStudentStats(Request $request, $quizId)
    {
        $quiz = Quiz::with('course.enrollments.user')->findOrFail($quizId);

        $stats = $quiz->course->enrollments->map(function ($enrollment) use ($quiz) {
            $user = $enrollment->user;

            $highestScore = $user->quizAttempts()
                ->where('QuizId', $quiz->Id)
                ->max('Score');

            $lastAttempt = $user->quizAttempts()
                ->where('QuizId', $quiz->Id)
                ->orderBy('CreatedAt', 'desc')
                ->first();

            $isCompleted = LessonCompletion::where('UserId', $user->Id)
                ->where('LessonId', $quiz->LessonId)
                ->exists();

            return [
                'UserId' => $user->Id,
                'StudentName' => $user->Name,
                'Status' => $isCompleted ? 'Completed' : 'Not Started',
                'HighestScore' => $highestScore,
                'LastAttemptDate' => $lastAttempt ? $lastAttempt->CreatedAt : null,
                'LastAttemptId' => $lastAttempt ? $lastAttempt->Id : null,
            ];
        });

        return response()->json([
            'quizTitle' => $quiz->Title,
            'stats' => $stats,
        ]);
    }

    public function show($id)
    {
        $quiz = Quiz::with(['questions.answerOptions'])->findOrFail($id);

        if ($quiz->ShuffleQuestions) {
            $quiz->questions = $quiz->questions->shuffle();
        }

        // For students, we don't want to send the IsCorrect flag.
        if (Auth::user()->Role === 'Student') {
            $quiz->questions->each(function ($question) {
                $question->answerOptions->each(function ($option) {
                    unset($option->IsCorrect);
                });
            });
        }

        return response()->json($quiz);
    }

        public function showByCourse(Request $request, $courseId)

        {

            $quiz = Quiz::with('questions.answerOptions')->where('CourseId', $courseId)->whereNull('LessonId')->first();

            return response()->json(['quiz' => $quiz]);

        }

    

        public function showByLesson(Request $request, $lessonId)

        {

            $quiz = Quiz::with('questions.answerOptions')->where('LessonId', $lessonId)->first();

            return response()->json(['quiz' => $quiz]);

        }

    

        public function storeOrUpdateByCourse(Request $request, $courseId)

        {

            return $this->_storeOrUpdateQuiz($request, $courseId, null);

        }

    

        public function storeOrUpdateByLesson(Request $request, $lessonId)

        {

            return $this->_storeOrUpdateQuiz($request, null, $lessonId);

        }

    

                private function _storeOrUpdateQuiz(Request $request, $courseId, $lessonId)

    

                {

    

                    $quizData = json_decode($request->input('Quiz'), true);

    

                    $questionsData = json_decode($request->input('Questions'), true);

    

        

    

                    if ($lessonId && !$courseId) {

    

                        $lesson = Lesson::find($lessonId);

    

                        if ($lesson) {

    

                            $courseId = $lesson->CourseId;

    

                        }

    

                    }

    

        

    

                    if (!$courseId) {

    

                        return response()->json(['message' => 'CourseId is required.'], 422);

    

                    }

    

            

    

                    DB::transaction(function () use ($request, $quizData, $questionsData, $courseId, $lessonId) {

    

                        $quiz = Quiz::updateOrCreate(

    

                            ['Id' => $quizData['Id'] ?? null],

    

                            [

    

                                'CourseId' => $courseId,

    

                                'LessonId' => $lessonId,

    

                                'Title' => $quizData['Title'],

    

                                'PassingScore' => $quizData['PassingScore'],

    

                                'TimeLimit' => $quizData['TimeLimit'],

    

                            ]

    

                        );

    

            

    

                        foreach ($questionsData as $index => $questionData) {

    

                            $imagePath = $questionData['ImagePath'] ?? null;

    

        

    

                            // Handle image upload

    

                            if ($request->hasFile("questions.{$index}.image")) {

    

                                $request->validate([

    

                                    "questions.{$index}.image" => 'image|mimes:jpg,png,webp|max:2048',

    

                                ]);

    

                                // Delete old image if it exists

    

                                if ($imagePath && file_exists(storage_path('app/public/' . $imagePath))) {

    

                                    unlink(storage_path('app/public/' . $imagePath));

    

                                }

    

                                $file = $request->file("questions.{$index}.image");

    

                                $path = $file->store('uploads/questions', 'public');

    

                                $imagePath = $path;

    

                            } elseif (isset($questionData['ImagePath']) && $questionData['ImagePath'] === 'DELETE') {

    

                                // Handle image deletion

    

                                $existingQuestion = Question::find($questionData['Id'] ?? null);

    

                                if ($existingQuestion && $existingQuestion->ImagePath) {

    

                                    if (file_exists(storage_path('app/public/' . $existingQuestion->ImagePath))) {

    

                                        unlink(storage_path('app/public/' . $existingQuestion->ImagePath));

    

                                    }

    

                                }

    

                                $imagePath = null;

    

                            }

    

        

    

                            $question = Question::updateOrCreate(

    

                                ['Id' => $questionData['Id'] ?? null],

    

                                [

    

                                    'QuizId' => $quiz->Id,

    

                                    'QuestionText' => $questionData['QuestionText'],

    

                                    'QuestionType' => $questionData['QuestionType'],

    

                                    'Order' => $questionData['Order'],

    

                                    'ImagePath' => $imagePath,

    

                                ]

    

                            );

    

            

    

                            foreach ($questionData['Answers'] as $answerData) {

    

                                AnswerOption::updateOrCreate(

    

                                    ['Id' => $answerData['Id'] ?? null],

    

                                    [

    

                                        'QuestionId' => $question->Id,

    

                                        'AnswerText' => $answerData['AnswerText'],

    

                                        'IsCorrect' => $answerData['IsCorrect'],

    

                                    ]

    

                                );

    

                            }

    

                        }

    

                    });

    

            

    

                    return response()->json(['message' => 'Quiz saved successfully.']);

    

                }

    public function submit(Request $request, $id)
    {
        $user = Auth::user();
        $quiz = Quiz::with('questions.answerOptions')->findOrFail($id);
        $answers = $request->input('answers'); // e.g., ['1' => 3, '2' => 5]

        $correctAnswers = 0;
        $totalQuestions = $quiz->questions->count();

        foreach ($quiz->questions as $question) {
            if (isset($answers[$question->Id])) {
                $answerId = $answers[$question->Id];
                $correctOption = $question->answerOptions->firstWhere('IsCorrect', true);
                if ($correctOption && $correctOption->Id == $answerId) {
                    $correctAnswers++;
                }
            }
        }

        $score = ($totalQuestions > 0) ? ($correctAnswers / $totalQuestions) * 100 : 0;

        $attempt = DB::transaction(function () use ($quiz, $user, $score, $answers) {
            $attempt = QuizAttempt::create([
                'QuizId' => $quiz->Id,
                'UserId' => $user->Id,
                'Score' => $score,
                'AttemptDate' => now(),
            ]);

            foreach ($answers as $questionId => $answerId) {
                QuizAttemptAnswer::create([
                    'AttemptId' => $attempt->Id,
                    'QuestionId' => $questionId,
                    'AnswerId' => $answerId,
                ]);
            }
            
            return $attempt;
        });

        return response()->json([
            'message' => 'Quiz submitted successfully.',
            'attemptId' => $attempt->Id,
            'score' => $score,
        ]);
    }
}