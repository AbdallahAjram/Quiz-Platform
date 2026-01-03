<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'Name' => ['required','string','max:255'],
            'Email' => ['required','email','unique:users,Email'],
            'Password' => ['required','string','min:6'],
            'Role' => ['required','string'],
            'IsActive' => ['nullable','boolean'],
        ]);

        $isActive = $data['Role'] === 'Instructor' ? false : true;

        $user = User::create([
            'Name' => $data['Name'],
            'Email' => $data['Email'],
            'Password' => Hash::make($data['Password']),
            'Role' => $data['Role'],
            'IsActive' => $isActive,
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'Email' => ['required','email'],
            'Password' => ['required','string'],
        ]);

        $user = User::where('Email', $data['Email'])->first();

        if (!$user || !Hash::check($data['Password'], $user->Password)) {
            throw ValidationException::withMessages([
                'Email' => ['Invalid credentials.'],
            ]);
        }

        if (!$user->IsActive) {
            return response()->json(['message' => 'Your account is pending administrator approval.'], 403);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        $redirect = match ($user->Role) {
            'Admin', 'Instructor' => '/management/dashboard',
            default => '/dashboard',
        };

        return response()->json([
            'user' => $user,
            'token' => $token,
            'redirect' => $redirect,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }
}
