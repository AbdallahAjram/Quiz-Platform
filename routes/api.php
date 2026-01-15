<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\{
    AuthController,
    UserController,
    CourseController,
    EnrollmentController,
    LessonController,
    LessonCompletionController,
    AnnouncementController,
    CommentController,
    CertificateController,
    QuizController,
    QuestionController,
    AnswerOptionController,
    QuizAttemptController,
    QuizAttemptAnswerController,
    AdminController,
    DashboardController,
    AnalyticsController,
    AIController
};

// Health check
Route::get('/test', function () {
    return response()->json(['message' => 'API is working']);
});

// ---------- PUBLIC AUTH ----------
Route::post('auth/register', [AuthController::class, 'register']);
Route::post('auth/login', [AuthController::class, 'login']);

// ---------- PROTECTED ROUTES (Sanctum) ----------
Route::middleware('auth:sanctum')->group(function () {

    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('profile', function (Request $request) {
        return $request->user();
    });

    Route::get('dashboard/stats', [DashboardController::class, 'getStats']);

    Route::middleware('role:Admin')->group(function () {
        Route::post('instructors', [AdminController::class, 'createInstructor']);
        Route::get('stats', [AdminController::class, 'getDashboardStats']);
        Route::get('recent-enrollments', [AdminController::class, 'getRecentEnrollments']);
    });

    // AI quiz generation
    Route::middleware('role:Admin,Instructor')->group(function () {
        Route::post('/ai/generate-quiz', [AIController::class, 'generateQuiz']);
        Route::post('/ai/save-quiz', [AIController::class, 'saveQuiz']);
    });

    // User Management routes
    Route::middleware('role:Admin')->group(function() {
        Route::get('/users/instructors', [UserController::class, 'getInstructors']);
        Route::patch('/users/{id}/status', [UserController::class, 'updateStatus']);
    });
    Route::apiResource('users', UserController::class)->middleware('role:Admin');
    
    Route::middleware('role:Student')->prefix('student')->group(function () {
        Route::get('enrolled-courses-count', [EnrollmentController::class, 'enrolledCoursesCount']);
        Route::get('completed-lessons-count', [LessonCompletionController::class, 'completedLessonsCount']);
        Route::get('average-quiz-score', [DashboardController::class, 'getStudentAverageQuizScore']);
        Route::get('available-courses', [CourseController::class, 'availableCourses']);
    });
    
    // Course Management (Accessible by Admin and Instructor)
    Route::apiResource('courses', CourseController::class)->parameters(['courses' => 'Id']);
    Route::get('courses/{CourseId}/lessons', [LessonController::class, 'getLessonsForCourse']);
    Route::patch('courses/{course}/publish', [CourseController::class, 'togglePublish']);

    // Other Tables
    Route::apiResource('enrollments', EnrollmentController::class);
    Route::get('enrollments/my-courses', [EnrollmentController::class, 'myCourses']);
    Route::apiResource('lessons', LessonController::class);
    Route::apiResource('lesson-completions', LessonCompletionController::class);
    Route::apiResource('announcements', AnnouncementController::class);
    Route::apiResource('comments', CommentController::class);
    Route::apiResource('certificates', CertificateController::class);
    
    // Quiz System - Students have read-only access
    Route::get('/courses/{courseId}/quiz', [QuizController::class, 'showByCourse']);
    Route::get('/lessons/{lessonId}/quiz', [QuizController::class, 'showByLesson']);
    Route::post('/courses/{courseId}/quiz', [QuizController::class, 'storeOrUpdateByCourse'])->middleware('role:Admin,Instructor');
    Route::post('/lessons/{lessonId}/quiz', [QuizController::class, 'storeOrUpdateByLesson'])->middleware('role:Admin,Instructor');

    Route::post('quizzes/{quizId}/attempts', [QuizAttemptController::class, 'store']);
    
    // QUIZZES - Read-only for students, write for instructors/admins
    Route::get('quizzes', [QuizController::class, 'index']);
    Route::get('quizzes/{id}', [QuizController::class, 'show'])->where('id', '[0-9]+');
    Route::post('quizzes/{id}/submit', [QuizController::class, 'submit'])->where('id', '[0-9]+');

    Route::middleware('role:Admin,Instructor')->group(function () {
        Route::get('analytics/engagement-insights', [AnalyticsController::class, 'getEngagementInsights']);
        Route::get('quizzes/analytics', [QuizController::class, 'getQuizAnalytics']);
        Route::get('quizzes/{quizId}/students', [QuizController::class, 'getStudentStats']);
        Route::get('instructor/quizzes', [QuizController::class, 'getQuizAnalytics']);
        Route::put('quizzes/{id}', [QuizController::class, 'update'])->where('id', '[0-9]+');
        Route::patch('quizzes/{id}', [QuizController::class, 'update'])->where('id', '[0-9]+');
        Route::delete('quizzes/{id}', [QuizController::class, 'destroy'])->where('id', '[0-9]+');
    });

    Route::apiResource('questions', QuestionController::class);
    Route::apiResource('answer-options', AnswerOptionController::class);
    Route::apiResource('quiz-attempts', QuizAttemptController::class);
    Route::apiResource('quiz-attempt-answers', QuizAttemptAnswerController::class);
    Route::get('/attempts/{attemptId}/details', [QuizAttemptController::class, 'getAttemptDetails']);
});