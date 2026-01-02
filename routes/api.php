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
    QuizAttemptAnswerController
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

    Route::patch('profile', [UserController::class, 'updateProfile']);
    // ---------- MANAGEMENT (Admin & Instructor) RESOURCES ----------
    Route::middleware('role:Admin,Instructor')->group(function () {
        Route::get('management/stats', [UserController::class, 'getManagementStats']);
        // Other shared management routes can go here
    });

    // ---------- ADMIN-ONLY RESOURCES ----------
    Route::middleware('role:Admin')->group(function () {
        Route::apiResource('users', UserController::class)->except(['create', 'edit']);
        Route::apiResource('courses', CourseController::class)->except(['create', 'edit']);
        Route::apiResource('lessons', LessonController::class)->except(['create', 'edit']);
        Route::apiResource('quizzes', QuizController::class)->except(['create', 'edit']);
        Route::apiResource('questions', QuestionController::class)->except(['create', 'edit']);
        Route::apiResource('answer-options', AnswerOptionController::class)->except(['create', 'edit']);
        
        Route::get('admin/pending-instructors', [UserController::class, 'listPendingInstructors']);
        Route::patch('admin/users/{user}/approve', [UserController::class, 'approveUser']);
        Route::post('admin/create-instructor', [UserController::class, 'createInstructor']);
        Route::delete('admin/users/{user}/reject', [UserController::class, 'rejectUser']);
        Route::get('admin/active-instructors', [UserController::class, 'getActiveInstructors']);
    });

    // ---------- USER-ACCESSIBLE RESOURCES ----------
    Route::apiResource('enrollments', EnrollmentController::class);
    Route::apiResource('lesson-completions', LessonCompletionController::class);
    Route::apiResource('announcements', AnnouncementController::class);
    Route::apiResource('comments', CommentController::class);
    Route::apiResource('certificates', CertificateController::class);
    Route::apiResource('quiz-attempts', QuizAttemptController::class);
    Route::apiResource('quiz-attempt-answers', QuizAttemptAnswerController::class);

    // Optional: if you have a submit endpoint for attempts
    // Route::post('quiz-attempts/{quiz_attempt}/submit', [QuizAttemptController::class, 'submit']);

});
