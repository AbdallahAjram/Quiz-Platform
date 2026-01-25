<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CourseController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $query = Course::query();

        if ($user->Role === 'Admin') {
            $query->with('instructor:Id,Name');
        } else {
            $query->where('CreatedBy', $user->Id);
        }

        return $query->orderByDesc('Id')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'Title' => ['required', 'string', 'max:255'],
            'ShortDescription' => ['nullable', 'string', 'max:255'],
            'LongDescription' => ['nullable', 'string'],
            'Category' => ['nullable', 'string', 'max:255'],
            'Difficulty' => ['nullable', 'string', 'max:255'],
            'Thumbnail' => ['nullable', 'string', 'max:255'],
            'EstimatedDuration' => ['nullable', 'integer', 'min:1'],
            'CreatedBy' => ['nullable', 'integer', 'exists:users,Id'],
        ]);

        $user = auth()->user();

        // Assign CreatedBy: Admin can pick an instructor; otherwise it's the current user
        if ($user->Role !== 'Admin' || empty($data['CreatedBy'])) {
            $data['CreatedBy'] = $user->Id;
        }

        $data['IsPublished'] = false;

        $course = Course::create($data);

        return response()->json($course, 201);
    }

    public function availableCourses(Request $request)
    {
        $userId = $request->user()->Id;
        $courses = Course::where('IsPublished', true)
            ->with('instructor:Id,Name')
            ->get();

        $courses->each(function ($course) use ($userId) {
            $course->IsEnrolled = $course->enrollments()->where('UserId', $userId)->exists();
            if ($course->IsEnrolled) {
                $firstLesson = $course->lessons()->orderBy('Order')->first();
                $course->FirstLessonId = $firstLesson ? $firstLesson->Id : null;
            }
            $course->Instructor = $course->instructor;
            unset($course->instructor);
        });

        return response()->json($courses);
    }

    public function show($Id)
    {
        return Course::findOrFail($Id);
    }

    public function togglePublish(Request $request, $Id)
    {
        $course = Course::findOrFail($Id);

        $data = $request->validate([
            'IsPublished' => ['required', 'boolean'],
        ]);

        $course->update(['IsPublished' => $data['IsPublished']]);

        return response()->json($course);
    }

    public function update(Request $request, $Id)
    {
        $course = Course::findOrFail($Id);
        $user = auth()->user();

        if ($user->Role !== 'Admin' && $course->CreatedBy !== $user->Id) {
            return response()->json(['message' => 'You are not authorized to update this course.'], 403);
        }

        $data = $request->validate([
            'Title' => ['sometimes', 'required', 'string', 'max:255'],
            'ShortDescription' => ['nullable', 'string', 'max:255'],
            'LongDescription' => ['nullable', 'string'],
            'Category' => ['nullable', 'string', 'max:255'],
            'Difficulty' => ['nullable', 'string', 'max:255'],
            'Thumbnail' => ['nullable', 'string', 'max:255'],
            'EstimatedDuration' => ['nullable', 'integer', 'min:1'],
            'CreatedBy' => ['sometimes', 'integer', 'exists:users,Id'],
            'CertificatesEnabled' => ['sometimes', 'boolean'],
        ]);

        $course->update($data);
        return response()->json($course);
    }

    public function destroy($Id)
    {
        $course = Course::findOrFail($Id);
        $user = auth()->user();

        if ($user->Role !== 'Admin' && $course->CreatedBy !== $user->Id) {
            return response()->json(['message' => 'You are not authorized to delete this course.'], 403);
        }

        DB::transaction(function () use ($course) {
            $course->delete();
        });

        return response()->json(['message' => 'Deleted successfully']);
    }
}