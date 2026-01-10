<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\QuizResource;
use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\Lesson;
use App\Models\Course;
use App\Models\Question;
use App\Models\AnswerOption;
use App\Models\LessonCompletion;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class QuizController extends Controller
{
    public function showByCourse($courseId)
    {
        $course = Course::find($courseId);
        if (!$course) {
            return response()->json(['message' => 'Course not found.'], 404);
        }

        $userId = auth()->id();
        $quiz = Quiz::where('CourseId', $courseId)
            ->whereNull('LessonId')
            ->withExists(['attempts as has_attempted' => function ($q) use ($userId) {
                $q->where('UserId', $userId);
            }])
            ->first();

        return response()->json(['quiz' => $quiz]);
    }

    public function storeOrUpdateByCourse(Request $request, $courseId)
    {
        Log::info('storeOrUpdateByCourse request data:', $request->all());

        $course = Course::findOrFail($courseId);

        $validatedData = $request->validate([
            'Quiz' => 'required|array',
            'Quiz.Title' => 'required|string|max:255',
            'Quiz.PassingScore' => 'required|integer|min:0|max:100',
            'Quiz.TimeLimit' => 'nullable|integer|min:0',
            'Questions' => 'present|array',
            'Questions.*.Id' => 'nullable|integer',
            'Questions.*.QuestionText' => 'required|string',
            'Questions.*.Answers' => 'present|array',
            'Questions.*.Answers.*.Id' => 'nullable|integer',
            'Questions.*.Answers.*.AnswerText' => 'required|string',
            'Questions.*.Answers.*.IsCorrect' => 'required|boolean',
        ]);

        try {
            DB::transaction(function () use ($validatedData, $course) {
                $quizData = $validatedData['Quiz'];
                $quiz = Quiz::updateOrCreate(
                    ['CourseId' => $course->Id, 'LessonId' => null],
                    [
                        'Title' => $quizData['Title'],
                        'PassingScore' => $quizData['PassingScore'],
                        'TimeLimit' => $quizData['TimeLimit'],
                    ]
                );

                $incomingQuestionIds = [];
                foreach ($validatedData['Questions'] as $questionData) {
                    $question = Question::updateOrCreate(
                        ['Id' => $questionData['Id'] ?? null, 'QuizId' => $quiz->Id],
                        ['QuestionText' => $questionData['QuestionText'], 'QuestionType' => 'single', 'Order' => 0]
                    );
                    $incomingQuestionIds[] = $question->Id;

                    $incomingAnswerIds = [];
                    foreach ($questionData['Answers'] as $answerData) {
                        $answer = AnswerOption::updateOrCreate(
                            ['Id' => $answerData['Id'] ?? null, 'QuestionId' => $question->Id],
                            [
                                'AnswerText' => $answerData['AnswerText'],
                                'IsCorrect' => $answerData['IsCorrect'],
                            ]
                        );
                        $incomingAnswerIds[] = $answer->Id;
                    }
                    // Delete answers that were removed
                    AnswerOption::where('QuestionId', $question->Id)->whereNotIn('Id', $incomingAnswerIds)->delete();
                }
                // Delete questions that were removed
                Question::where('QuizId', $quiz->Id)->whereNotIn('Id', $incomingQuestionIds)->delete();
                
            });
        } catch (\Exception $e) {
            Log::error('Failed to save quiz by course:', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to save quiz.', 'error' => $e->getMessage()], 500);
        }

        return response()->json(['message' => 'Quiz saved successfully.']);
    }

    public function storeOrUpdate(Request $request, $lessonId)
    {
        Log::info('storeOrUpdate by lesson request data:', $request->all());

        $lesson = Lesson::findOrFail($lessonId);

        $validatedData = $request->validate([
            'Quiz' => 'required|array',
            'Quiz.Title' => 'required|string|max:255',
            'Quiz.PassingScore' => 'required|integer|min:0|max:100',
            'Quiz.TimeLimit' => 'nullable|integer|min:0',
            'Questions' => 'present|array',
            'Questions.*.Id' => 'nullable|integer',
            'Questions.*.QuestionText' => 'required|string',
            'Questions.*.Answers' => 'present|array',
            'Questions.*.Answers.*.Id' => 'nullable|integer',
            'Questions.*.Answers.*.AnswerText' => 'required|string',
            'Questions.*.Answers.*.IsCorrect' => 'required|boolean',
        ]);

        try {
            DB::transaction(function () use ($validatedData, $lesson) {
                $quizData = $validatedData['Quiz'];
                $quiz = Quiz::updateOrCreate(
                    ['LessonId' => $lesson->Id],
                    [
                        'CourseId' => $lesson->CourseId,
                        'Title' => $quizData['Title'],
                        'PassingScore' => $quizData['PassingScore'],
                        'TimeLimit' => $quizData['TimeLimit'],
                    ]
                );

                $incomingQuestionIds = [];
                foreach ($validatedData['Questions'] as $questionData) {
                    $question = Question::updateOrCreate(
                        ['Id' => $questionData['Id'] ?? null, 'QuizId' => $quiz->Id],
                        ['QuestionText' => $questionData['QuestionText'], 'QuestionType' => 'single', 'Order' => 0]
                    );
                    $incomingQuestionIds[] = $question->Id;

                    $incomingAnswerIds = [];
                    foreach ($questionData['Answers'] as $answerData) {
                        $answer = AnswerOption::updateOrCreate(
                            ['Id' => $answerData['Id'] ?? null, 'QuestionId' => $question->Id],
                            [
                                'AnswerText' => $answerData['AnswerText'],
                                'IsCorrect' => $answerData['IsCorrect'],
                            ]
                        );
                        $incomingAnswerIds[] = $answer->Id;
                    }
                    // Delete answers that were removed
                    AnswerOption::where('QuestionId', $question->Id)->whereNotIn('Id', $incomingAnswerIds)->delete();
                }
                // Delete questions that were removed
                Question::where('QuizId', $quiz->Id)->whereNotIn('Id', $incomingQuestionIds)->delete();
                
            });
        } catch (\Exception $e) {
            Log::error('Failed to save quiz by lesson:', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to save quiz.', 'error' => $e->getMessage()], 500);
        }

        return response()->json(['message' => 'Quiz saved successfully.']);
    }

    public function showByLesson($lessonId)
    {
        $lesson = Lesson::find($lessonId);
        if (!$lesson) {
            return response()->json(['message' => 'Lesson not found.'], 404);
        }

        $quiz = Quiz::where('LessonId', $lessonId)->with('questions.answerOptions')->first();

        if (!$quiz) {
            return response()->json(['message' => 'Quiz not found for this lesson.'], 404);
        }

        return new QuizResource($quiz);
    }

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
        $quiz = Quiz::with(['questions.answerOptions'])->findOrFail($id);
        $user = Auth::user();

        // Guardrail for Lesson Quizzes
        if ($quiz->LessonId) {
            $isCompleted = LessonCompletion::where('LessonId', $quiz->LessonId)
                                           ->where('UserId', $user->Id)
                                           ->exists();
            if (!$isCompleted) {
                return response()->json(['message' => 'You must complete the lesson before taking the quiz.'], 403);
            }
        }
        // Guardrail for Course Quizzes (Final Exams)
        else if ($quiz->CourseId && $quiz->course) {
            $totalLessons = $quiz->course->lessons ? $quiz->course->lessons->count() : 0;

            if ($totalLessons > 0) {
                $completedLessons = LessonCompletion::whereIn('LessonId', $quiz->course->lessons->pluck('Id'))
                                                    ->where('UserId', $user->Id)
                                                    ->count();

                if ($completedLessons < $totalLessons) {
                    return response()->json(['message' => 'You must complete all lessons in the course before taking the final exam.'], 403);
                }
            }
        }

        if (!$quiz) {
            return response()->json(['message' => 'Quiz not found.'], 404);
        }

        return new QuizResource($quiz);
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

    public function getQuizAnalytics(Request $request)
    {
        $user = Auth::user();
        
        $query = Quiz::with('course:Id,Title')
            ->withCount('attempts');

        if ($user->Role === 'Instructor') {
            $query->whereHas('course', function ($q) use ($user) {
                $q->where('CreatedBy', $user->Id);
            });
        }

        $quizzes = $query->get();

        $stats = $quizzes->map(function ($quiz) {
            return [
                'QuizId' => $quiz->Id,
                'QuizTitle' => $quiz->Title,
                'CourseName' => $quiz->course ? $quiz->course->Title : 'N/A',
                'AttemptCount' => $quiz->attempts_count,
            ];
        });

        return response()->json($stats);
    }

    public function getStudentStats(Request $request, $quizId)
    {
        $user = Auth::user();
        $quiz = Quiz::with('course.enrollments.user')->findOrFail($quizId);

        // Authorization Check
        if ($user->Role === 'Instructor' && $quiz->course->CreatedBy !== $user->Id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $enrolledStudents = $quiz->course->enrollments->map(function ($enrollment) {
            return $enrollment->user;
        })->filter();

        $stats = $enrolledStudents->map(function ($student) use ($quiz) {
            $attempts = $quiz->attempts()->where('UserId', $student->Id)->get();
            
            $highestScore = null;
            $lastAttemptDate = null;

            if ($attempts->isNotEmpty()) {
                $highestScore = $attempts->max('Score');
                $lastAttemptDate = $attempts->max('created_at');
            }

            return [
                'StudentName' => $student->Name,
                'Status' => $attempts->isNotEmpty() ? 'Completed' : 'Not Started',
                'HighestScore' => $highestScore,
                'LastAttemptDate' => $lastAttemptDate,
            ];
        });

        return response()->json([
            'quizTitle' => $quiz->Title,
            'stats' => $stats,
        ]);
    }
}
