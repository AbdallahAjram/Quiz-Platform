<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return User::query()->orderByDesc('Id')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'Name' => ['required', 'string', 'max:255'],
            'Email' => ['required', 'email', 'unique:users,Email'],
            'Password' => ['required', 'string', 'min:6'],
            'Role' => ['required', 'string'],
            'Status' => ['nullable', 'string'],
        ]);

        $user = User::create([
            'Name' => $data['Name'],
            'Email' => $data['Email'],
            'Password' => Hash::make($data['Password']),
            'Role' => $data['Role'],
            'Status' => $data['Status'] ?? 'Active',
        ]);

        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        return $user;
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'Name' => ['sometimes', 'string', 'max:255'],
            'Email' => ['sometimes', 'email', 'unique:users,Email,' . $user->Id],
            'Password' => ['nullable', 'string', 'min:6'],
            'Role' => ['sometimes', 'string'],
            'Status' => ['nullable', 'string'],
        ]);

        if (!empty($data['Password'] ?? null)) {
            $data['Password'] = Hash::make($data['Password']);
        }

        $user->update($data);

        return $user;
    }

    public function updateStatus(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'Status' => ['required', 'string', 'in:Active,Pending,Revoked'],
        ]);

        $user->Status = $data['Status'];
        $user->save();

        return response()->json([
            'message' => 'User status updated successfully.',
            'user' => $user,
        ]);
    }

    public function getInstructors()
    {
        $instructors = User::whereIn('Role', ['Instructor', 'Admin'])->select('Id', 'Name')->get();
        return response()->json($instructors);
    }
}
