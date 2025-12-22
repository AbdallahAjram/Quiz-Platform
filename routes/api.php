<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\{
    UserController,
    CourseController, EnrollmentController, LessonController, LessonCompletionController,
    AnnouncementController, CommentController, CertificateController, QuizController,
    QuestionController, AnswerOptionController, QuizAttemptController, QuizAttemptAnswerController
};


Route::get('/test', function () {
    return response()->json([
        'message' => 'API is working'
    ]);
});

Route::apiResource('courses', CourseController::class);
Route::apiResource('users', UserController::class);
Route::apiResource('enrollments', EnrollmentController::class);
Route::apiResource('lessons', LessonController::class);
Route::apiResource('lesson-completions', LessonCompletionController::class);
Route::apiResource('announcements', AnnouncementController::class);
Route::apiResource('comments', CommentController::class);
Route::apiResource('certificates', CertificateController::class);
Route::apiResource('quizzes', QuizController::class);
Route::apiResource('questions', QuestionController::class);
Route::apiResource('answer-options', AnswerOptionController::class);
Route::apiResource('quiz-attempts', QuizAttemptController::class);
Route::apiResource('quiz-attempt-answers', QuizAttemptAnswerController::class);
