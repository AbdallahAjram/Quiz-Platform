<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        // Filters:
        // ?CourseId=1
        // ?CreatedBy=1
        // ?search=keyword
        $query = Announcement::query();

        if ($request->filled('CourseId')) {
            $query->where('CourseId', (int) $request->input('CourseId'));
        }

        if ($request->filled('CreatedBy')) {
            $query->where('CreatedBy', (int) $request->input('CreatedBy'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('Title', 'ILIKE', "%{$search}%")
                  ->orWhere('Content', 'ILIKE', "%{$search}%");
        }

        $announcements = $query
            ->orderByDesc('CreatedAt')
            ->orderByDesc('Id')
            ->paginate((int) $request->input('per_page', 15));

        return response()->json($announcements);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'CourseId' => ['required', 'integer', 'exists:courses,Id'],
            'Title' => ['required', 'string', 'max:255'],
            'Content' => ['required', 'string'],
        ]);

        $announcement = Announcement::create([
            'CourseId' => (int) $data['CourseId'],
            'CreatedBy' => (int) $request->user()->id,
            'Title' => $data['Title'],
            'Content' => $data['Content'],
        ]);

        return response()->json([
            'message' => 'Announcement created successfully.',
            'data' => $announcement,
        ], 201);
    }

    public function show(string $id)
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json(['message' => 'Announcement not found.'], 404);
        }

        return response()->json(['data' => $announcement]);
    }

    public function update(Request $request, string $id)
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json(['message' => 'Announcement not found.'], 404);
        }

        // Only creator can edit (you can change to admin policy later)
        if ((int) $announcement->CreatedBy !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'Title' => ['sometimes', 'string', 'max:255'],
            'Content' => ['sometimes', 'string'],
        ]);

        $announcement->fill($data);
        $announcement->save();

        return response()->json([
            'message' => 'Announcement updated successfully.',
            'data' => $announcement,
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json(['message' => 'Announcement not found.'], 404);
        }

        if ((int) $announcement->CreatedBy !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted successfully.']);
    }
}
