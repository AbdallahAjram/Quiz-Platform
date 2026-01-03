<?php

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
    AdminController
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

    // Admin-only routes
    Route::middleware('role:Admin')->group(function () {
        Route::post('admin/instructors', [AdminController::class, 'createInstructor']);
        Route::patch('admin/users/{Id}/approve', [AdminController::class, 'approve']);
        Route::delete('admin/users/{Id}', [AdminController::class, 'destroy']);
    });

    // Resources (13 tables)
    Route::apiResource('users', UserController::class)->middleware('role:Admin');
    Route::apiResource('courses', CourseController::class);
    Route::apiResource('enrollments', EnrollmentController::class);
    Route::apiResource('lessons', LessonController::class);
    Route::apiResource('lesson-completions', LessonCompletionController::class);
    Route::apiResource('announcements', AnnouncementController::class);
    Route::apiResource('comments', CommentController::class);
    Route::apiResource('certificates', CertificateController::class);
        Route::patch('courses/{course}/publish', [CourseController::class, 'togglePublish']);
        Route::apiResource('quizzes', QuizController::class)->except(['create', 'edit']);
    Route::apiResource('questions', QuestionController::class);
    Route::apiResource('answer-options', AnswerOptionController::class);
    Route::apiResource('quiz-attempts', QuizAttemptController::class);
    Route::apiResource('quiz-attempt-answers', QuizAttemptAnswerController::class);

    // Optional: if you have a submit endpoint for attempts
    // Route::post('quiz-attempts/{quiz_attempt}/submit', [QuizAttemptController::class, 'submit']);
});
