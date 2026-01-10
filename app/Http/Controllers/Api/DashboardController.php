<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Course;
use App\Models\User;
use App\Models\Lesson;
use App\Models\Enrollment;
use App\Models\QuizAttempt;

class DashboardController extends Controller
{
    public function getStats(Request $request)
    {
        $user = Auth::user();
        $isInstructor = $user->Role === 'Instructor';

        $totalCourses = 0;
        $totalLessons = 0;
        $totalStudents = 0;
        $averageScore = 0;
        $recentActivity = [];

        if ($isInstructor) {
            $courseIds = Course::where('CreatedBy', $user->Id)->pluck('Id');

            $totalCourses = $courseIds->count();
            $totalLessons = Lesson::whereIn('CourseId', $courseIds)->count();
            $totalStudents = Enrollment::whereHas('course', function($q) use ($user) {
                $q->where('CreatedBy', $user->Id);
            })->distinct('UserId')->count();
            $averageScore = QuizAttempt::whereHas('quiz', function ($q) use ($courseIds) {
                $q->whereIn('CourseId', $courseIds);
            })->avg('Score');
            
            $recentActivity = Enrollment::with(['User:Id,Name', 'Course:Id,Title'])
                ->whereIn('CourseId', $courseIds)
                ->latest('EnrolledAt')
                ->take(5)
                ->get();
        } else { // Admin
            $totalCourses = Course::count();
            $totalLessons = Lesson::count();
            $totalStudents = User::where('Role', 'Student')->count();
            $averageScore = QuizAttempt::avg('Score');
            $recentActivity = Enrollment::with(['User:Id,Name', 'Course:Id,Title'])
                ->latest('EnrolledAt')
                ->take(5)
                ->get();
        }

        return response()->json([
            'TotalCourses' => $totalCourses,
            'TotalStudents' => $totalStudents,
            'TotalLessons' => $totalLessons,
            'AverageScore' => $averageScore ?? 0,
            'RecentActivity' => $recentActivity,
        ]);
    }

    public function getStudentAverageQuizScore(Request $request)
    {
        $user = Auth::user();

        $averageScore = QuizAttempt::where('UserId', $user->Id)->avg('Score');

        return response()->json([
            'AverageQuizScore' => $averageScore ?? null
        ]);
    }
}
