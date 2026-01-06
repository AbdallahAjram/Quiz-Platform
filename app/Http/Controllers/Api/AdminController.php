<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Enrollment;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    /**
     * Admin manually adds an instructor (Auto-approved).
     */
    public function createInstructor(Request $request)
    {
        $data = $request->validate([
            'Name' => ['required', 'string', 'max:255'],
            'Email' => ['required', 'email', 'unique:users,Email'],
            'Password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::create([
            'Name' => $data['Name'],
            'Email' => $data['Email'],
            'Password' => Hash::make($data['Password']),
            'Role' => 'Instructor',
            'IsActive' => true, // Manually added instructors are active by default
        ]);

        return response()->json($user, 201);
    }

    /**
     * Approve a pending instructor.
     */
    public function approve($Id)
    {
        // Finding user by PascalCase primary key Id
        $user = User::findOrFail($Id);
        $user->update(['IsActive' => true]);

        return response()->json($user, 200);
    }
    
    /**
     * Reject and delete a pending instructor.
     */
    public function destroy($Id)
    {
        $user = User::findOrFail($Id);
        $user->delete();

        return response()->json(['message' => 'User rejected and deleted successfully']);
    }

    /**
     * Get statistics for the admin dashboard.
     */
    public function getDashboardStats()
    {
        $stats = [
            'CourseCount' => Course::count(),
            'StudentCount' => User::where('Role', 'Student')->count(),
            'LessonCount' => Lesson::count(),
            'AverageQuizScore' => QuizAttempt::avg('Score') ?? 0,
        ];

        return response()->json($stats);
    }

    /**
     * Get the 5 most recent enrollments.
     */
    public function getRecentEnrollments()
    {
        $enrollments = Enrollment::with(['User:Id,Name', 'Course:Id,Title'])
            ->latest('EnrolledAt')
            ->take(5)
            ->get();
            
        return response()->json(['data' => $enrollments]);
    }
}