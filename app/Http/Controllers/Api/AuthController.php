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
            'name' => ['required','string','max:255'],
            'email' => ['required','email','unique:users,email'],
            'password' => ['required','string','min:6'],
            'Role' => ['required','string', 'in:Student,Instructor'], // Only allow Student or Instructor roles
        ]);

        $userData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'Role' => $data['Role'],
        ];

        if ($data['Role'] === 'Instructor') {
            $userData['Status'] = 'Pending';
        } else {
            $userData['Status'] = 'Active';
        }

        $user = User::create($userData);

        // Don't return a token for pending instructors
        if ($user->Status === 'Pending') {
            return response()->json([
                'message' => 'Instructor registration successful. Your account is pending approval.'
            ], 201);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required','email'],
            'password' => ['required','string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        // Check if instructor is pending approval
        if ($user->Role === 'Instructor' && $user->Status === 'Pending') {
            return response()->json([
                'message' => 'Your account is awaiting administrative approval.'
            ], 403);
        }

        // Check if user is not active for any other reason
        if ($user->Status !== 'Active') {
            return response()->json([
                'message' => 'Your account is not active.'
            ], 403);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'Role' => $user->Role,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }
}
