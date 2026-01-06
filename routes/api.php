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
    DashboardController
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

    // Admin-only management routes
    Route::middleware('role:Admin')->prefix('admin')->group(function () {
        // This is for fetching the table of users
        Route::get('users', [UserController::class, 'index']); 
        
        // Your specific Admin actions
        Route::post('instructors', [AdminController::class, 'createInstructor']);
        Route::patch('users/{Id}/approve', [AdminController::class, 'approve']);
        Route::delete('users/{Id}', [AdminController::class, 'destroy']);
        
        // Dashboard specific routes
        Route::get('stats', [AdminController::class, 'getDashboardStats']);
        Route::get('recent-enrollments', [AdminController::class, 'getRecentEnrollments']);
    });

    // Resources (Note: only allow Admin to access full User resource)
    Route::apiResource('users', UserController::class)->middleware('role:Admin');
    
    Route::middleware('role:Student')->prefix('student')->group(function () {
        Route::get('enrolled-courses-count', [EnrollmentController::class, 'enrolledCoursesCount']);
        Route::get('completed-lessons-count', [LessonCompletionController::class, 'completedLessonsCount']);
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
    
    // Quiz System
    Route::apiResource('quizzes', QuizController::class)->except(['create', 'edit']);
    Route::apiResource('questions', QuestionController::class);
    Route::apiResource('answer-options', AnswerOptionController::class);
    Route::apiResource('quiz-attempts', QuizAttemptController::class);
    Route::apiResource('quiz-attempt-answers', QuizAttemptAnswerController::class);
});