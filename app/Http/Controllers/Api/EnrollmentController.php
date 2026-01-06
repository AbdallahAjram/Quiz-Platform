<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;

class EnrollmentController extends Controller
{
    public function index(Request $request)
    {
        // Optional filters:
        // ?UserId=1
        // ?CourseId=2
        // ?Status=active
        $query = Enrollment::query();

        if ($request->filled('UserId')) {
            $query->where('UserId', (int) $request->input('UserId'));
        }

        if ($request->filled('CourseId')) {
            $query->where('CourseId', (int) $request->input('CourseId'));
        }

        if ($request->filled('Status')) {
            $query->where('Status', $request->input('Status'));
        }

        $enrollments = $query
            ->orderByDesc('EnrolledAt')
            ->paginate((int) $request->input('per_page', 15));

        return response()->json($enrollments);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'CourseId' => ['required', 'integer', 'exists:courses,Id'],
            'Status' => ['nullable', 'string', 'max:50'],
            'EnrolledAt' => ['nullable', 'date'],
        ]);

        $userId = $request->user()->Id;

        // Idempotent: prevent duplicates (you also have a DB unique constraint)
        $existing = Enrollment::where('UserId', $userId)
            ->where('CourseId', (int) $validated['CourseId'])
            ->first();

        if ($existing) {
            // Optionally update status/date if provided
            $changed = false;

            if (isset($validated['Status'])) {
                $existing->Status = $validated['Status'];
                $changed = true;
            }

            if (isset($validated['EnrolledAt'])) {
                $existing->EnrolledAt = $validated['EnrolledAt'];
                $changed = true;
            }

            if ($changed) {
                $existing->save();
            }

            return response()->json([
                'message' => 'User is already enrolled in this course.',
                'data' => $existing,
            ]);
        }

        try {
            $enrollment = Enrollment::create([
                'UserId' => $userId,
                'CourseId' => (int) $validated['CourseId'],
                'Status' => $validated['Status'] ?? 'active',
                'EnrolledAt' => $validated['EnrolledAt'] ?? now(),
            ]);
        } catch (QueryException $e) {
            // Safety: if unique constraint triggers
            return response()->json([
                'message' => 'Enrollment already exists.',
            ], 409);
        }

        return response()->json([
            'message' => 'Enrollment created successfully.',
            'data' => $enrollment,
        ], 201);
    }

    public function show(string $id)
    {
        $enrollment = Enrollment::find($id);

        if (!$enrollment) {
            return response()->json(['message' => 'Enrollment not found.'], 404);
        }

        return response()->json(['data' => $enrollment]);
    }

    public function update(Request $request, string $id)
    {
        $enrollment = Enrollment::find($id);

        if (!$enrollment) {
            return response()->json(['message' => 'Enrollment not found.'], 404);
        }

        $validated = $request->validate([
            'Status' => ['sometimes', 'string', 'max:50'],
            'EnrolledAt' => ['sometimes', 'date'],
        ]);

        $enrollment->fill($validated);
        $enrollment->save();

        return response()->json([
            'message' => 'Enrollment updated successfully.',
            'data' => $enrollment,
        ]);
    }

    public function myCourses(Request $request)
    {
        $userId = $request->user()->Id;

        $enrollments = Enrollment::where('UserId', $userId)->with('course')->get();

        $courses = $enrollments->map(function ($enrollment) {
            return $enrollment->course;
        });

        return response()->json($courses);
    }

    public function enrolledCoursesCount(Request $request)
    {
        $userId = $request->user()->Id;
        $count = Enrollment::where('UserId', $userId)->count();

        return response()->json(['EnrolledCoursesCount' => $count]);
    }

    public function destroy(string $id)
    {
        $enrollment = Enrollment::find($id);

        if (!$enrollment) {
            return response()->json(['message' => 'Enrollment not found.'], 404);
        }

        $enrollment->delete();

        return response()->json(['message' => 'Enrollment deleted successfully.']);
    }
   
}
