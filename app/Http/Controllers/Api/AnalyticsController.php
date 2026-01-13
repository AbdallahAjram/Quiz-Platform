<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AnalyticsController extends Controller
{
    public function getEngagementInsights(Request $request)
    {
        $user = Auth::user();

        $query = Course::withCount('enrollments')
            ->with(['quizzes.attempts'])
            ->whereHas('quizzes.attempts');

        if ($user->Role === 'Instructor') {
            $query->where('CreatedBy', $user->Id);
        }

        $courses = $query->get();

        $insights = $courses->map(function ($course) {
            $totalAttempts = $course->quizzes->flatMap(function ($quiz) {
                return $quiz->attempts;
            });

            $averageScore = $totalAttempts->avg('Score');

            $totalLessons = $course->lessons()->count();
            $completedLessons = $course->enrollments->map(function ($enrollment) use ($course, $totalLessons) {
                return $enrollment->user->lessonCompletions->whereIn('LessonId', $course->lessons->pluck('Id'))->count();
            });

            $completionRate = 0;
            if ($course->enrollments_count > 0 && $totalLessons > 0) {
                $totalCompletedCourses = $completedLessons->filter(function ($count) use ($totalLessons) {
                    return $count >= $totalLessons;
                })->count();
                $completionRate = ($totalCompletedCourses / $course->enrollments_count) * 100;
            }

            return [
                'CourseName' => $course->Title,
                'AverageScore' => $averageScore,
                'CompletionRate' => $completionRate,
                'EnrolledCount' => $course->enrollments_count,
            ];
        });

        return response()->json($insights);
    }
}
