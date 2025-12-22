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
        return User::query()->orderByDesc('id')->get();
    }

    public function store(Request $request)
    {
       $data = $request->validate([
    'full_name' => ['required', 'string', 'max:255'],
    'email' => ['required', 'email', 'unique:users,email'],
    'password' => ['required', 'string', 'min:6'],
    'role' => ['required', 'string'],
    'is_active' => ['nullable', 'boolean'],
]);


        $user = User::create([
    'full_name' => $data['full_name'],
    'email' => $data['email'],
    'hashed_password' => Hash::make($data['password']),
    'role' => $data['role'],
    'is_active' => $data['is_active'] ?? null,
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
    'full_name' => ['sometimes', 'string', 'max:255'],
    'email' => ['sometimes', 'email', 'unique:users,email,' . $user->id],
    'password' => ['nullable', 'string', 'min:6'],
    'role' => ['sometimes', 'string'],
    'is_active' => ['nullable', 'boolean'],
]);


        if (!empty($data['Password'] ?? null)) {
            $user->HashedPassword = Hash::make($data['Password']);
            unset($data['Password']);
        }

        $user->fill($data)->save();

        return $user;
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
