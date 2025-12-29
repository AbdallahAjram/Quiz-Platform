<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index()
    {
        return Course::query()
            ->orderByDesc('Id')
            ->get();
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
        ]);

        $data['CreatedBy'] = auth()->id();

        $course = Course::create($data);

        return response()->json($course, 201);
    }

    public function show(Course $course)
    {
        return response()->json($course);
    }

    public function update(Request $request, Course $course)
    {
        $data = $request->validate([
            'Title' => ['sometimes', 'required', 'string', 'max:255'],
            'ShortDescription' => ['nullable', 'string', 'max:255'],
            'LongDescription' => ['nullable', 'string'],
            'Category' => ['nullable', 'string', 'max:255'],
            'Difficulty' => ['nullable', 'string', 'max:255'],
            'Thumbnail' => ['nullable', 'string', 'max:255'],
            'EstimatedDuration' => ['nullable', 'integer', 'min:1'],
        ]);

        $course->update($data);

        return response()->json($course);
    }

    public function destroy(Course $course)
    {
        $course->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
