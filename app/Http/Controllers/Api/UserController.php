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
            'IsActive' => ['nullable', 'boolean'],
        ]);

        $user = User::create([
            'Name' => $data['Name'],
            'Email' => $data['Email'],
            'Password' => Hash::make($data['Password']),
            'Role' => $data['Role'],
            'IsActive' => $data['IsActive'] ?? null,
        ]);

        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        return $user;
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'Name' => ['sometimes', 'string', 'max:255'],
            'Email' => ['sometimes', 'email', 'unique:users,Email,' . $user->Id],
            'Password' => ['nullable', 'string', 'min:6'],
            'Role' => ['sometimes', 'string'],
            'IsActive' => ['nullable', 'boolean'],
        ]);

        if (!empty($data['Password'] ?? null)) {
            $data['Password'] = Hash::make($data['Password']);
        }

        $user->update($data);

        return $user;
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
