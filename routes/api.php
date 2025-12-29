<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\{
    AuthController,
    UserController,
    CourseController, EnrollmentController, LessonController, LessonCompletionController,
    AnnouncementController, CommentController, CertificateController, QuizController,
    QuestionController, AnswerOptionController, QuizAttemptController, QuizAttemptAnswerController
};

Route::get('/test', function () {
    return response()->json(['message' => 'API is working']);
});

// Auth (PUBLIC)
Route::post('auth/register', [AuthController::class, 'register']);
Route::post('auth/login', [AuthController::class, 'login']);

// Protected API
Route::middleware('auth:sanctum')->group(function () {

    Route::post('auth/logout', [AuthController::class, 'logout']);

    // COURSES, LESSONS, QUIZZES
    // Anyone authenticated can view (index, show)
    Route::apiResource('courses', CourseController::class)->only(['index', 'show']);
    Route::apiResource('lessons', LessonController::class)->only(['index', 'show']);
    Route::apiResource('quizzes', QuizController::class)->only(['index', 'show']);

    // Only Instructors/Admins can create, update, delete
    Route::apiResource('courses', CourseController::class)->except(['index', 'show'])->middleware('role:Instructor,Admin');
    Route::apiResource('lessons', LessonController::class)->except(['index', 'show'])->middleware('role:Instructor,Admin');
    Route::apiResource('quizzes', QuizController::class)->except(['index', 'show'])->middleware('role:Instructor,Admin');

    // STUDENT & ADMIN ROUTES
    Route::apiResource('enrollments', EnrollmentController::class)->middleware('role:Student,Admin');
    Route::apiResource('lesson-completions', LessonCompletionController::class)->middleware('role:Student,Admin');
    Route::apiResource('quiz-attempts', QuizAttemptController::class)->middleware('role:Student,Admin');
    Route::post('quiz-attempts/{id}/submit', [QuizAttemptController::class, 'submit'])->middleware('role:Student,Admin');

    // OTHER RESOURCES (Remain accessible to all authenticated users as per original file)
    Route::apiResource('users', UserController::class);
    Route::apiResource('announcements', AnnouncementController::class);
    Route::apiResource('comments', CommentController::class);
    Route::apiResource('certificates', CertificateController::class);
    Route::apiResource('questions', QuestionController::class);
    Route::apiResource('answer-options', AnswerOptionController::class);
    Route::apiResource('quiz-attempt-answers', QuizAttemptAnswerController::class);
});
