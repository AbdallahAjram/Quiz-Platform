<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        return User::query()->orderByDesc('id')->get();
    }

    public function store(Request $request)
    {
        // This method is now implicitly for admins creating any type of user.
        // The `createInstructor` method is a more specific alias.
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'Role' => ['required', 'string', Rule::in(['Instructor', 'Student'])],
            'Status' => ['nullable', 'string', Rule::in(['Active', 'Pending', 'Inactive'])],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'Role' => $data['Role'],
            'Status' => $data['Status'] ?? 'Active',
            'ApprovedBy' => Auth::id(),
            'ApprovedAt' => now(),
        ]);

        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        return $user;
    }

    public function update(Request $request, User $user)
    {
        $validatedData = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:6'],
            'Status' => ['sometimes', 'string', Rule::in(['Active', 'Pending', 'Inactive'])],
        ]);

        if (!empty($validatedData['password'])) {
            $validatedData['password'] = Hash::make($validatedData['password']);
        }

        $user->update($validatedData);

        return $user;
    }

    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $validatedData = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        if (!empty($validatedData['password'])) {
            $validatedData['password'] = Hash::make($validatedData['password']);
        }

        $user->update($validatedData);

        return $user;
    }


    public function destroy(User $user)
    {
        // Prevent users from deleting themselves, maybe? For now, it's open.
        $user->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    // --- Admin-Only Methods ---

    /**
     * List all users with Role='Instructor' and Status='Pending'.
     */
    public function listPendingInstructors()
    {
        $pending = User::where('Role', 'Instructor')
            ->where('Status', 'Pending')
            ->orderBy('created_at')
            ->get();
        return response()->json($pending);
    }

    /**
     * Approve a user (typically an instructor).
     */
    public function approveUser(Request $request, User $user)
    {
        $user->update([
            'Status' => 'Active',
            'ApprovedBy' => Auth::id(),
            'ApprovedAt' => now(),
        ]);

        return response()->json(['message' => 'User approved successfully.', 'user' => $user]);
    }

    public function getManagementStats()
    {
        $user = Auth::user();

        if ($user->Role === 'Admin') {
            $totalCourses = \App\Models\Course::count();
            $totalStudents = User::where('Role', 'Student')->count();
            $averageQuizScore = \App\Models\QuizAttempt::avg('Score');
        } else { // Instructor
            $instructorId = $user->id;
            $courseIds = \App\Models\Course::where('CreatedBy', $instructorId)->pluck('Id');

            $totalCourses = $courseIds->count();
            $totalStudents = \App\Models\Enrollment::whereIn('CourseId', $courseIds)->distinct('UserId')->count('UserId');

            $averageQuizScore = \App\Models\QuizAttempt::whereHas('quiz.course', function ($query) use ($instructorId) {
                $query->where('CreatedBy', $instructorId);
            })->avg('Score');
        }

        return response()->json([
            'TotalCourses' => $totalCourses,
            'TotalStudents' => $totalStudents,
            'AverageQuizScore' => round($averageQuizScore, 2),
        ]);
    }

    public function createInstructor(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'Role' => 'Instructor',
            'Status' => 'Active',
            'ApprovedBy' => Auth::id(),
            'ApprovedAt' => now(),
        ]);

        return response()->json($user, 201);
    }

    public function rejectUser(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'User rejected successfully.']);
    }

    public function getActiveInstructors()
    {
        $instructors = User::where('Role', 'Instructor')
            ->where('Status', 'Active')
            ->orderBy('name')
            ->get(['id', 'name']);
        return response()->json($instructors);
    }
}
