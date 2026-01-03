<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;


use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function createInstructor(Request $request)
    {
        $data = $request->validate([
            'Name' => ['required', 'string', 'max:255'],
            'Email' => ['required', 'email', 'unique:users,Email'],
            'Password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::create([
            'Name' => $data['Name'],
            'Email' => $data['Email'],
            'Password' => Hash::make($data['Password']),
            'Role' => 'Instructor',
            'IsActive' => true,
        ]);

        return response()->json($user, 201);
    }
    public function approve($Id)
    {
        $user = User::findOrFail($Id);
        $user->update(['IsActive' => true]);

        return response()->json($user, 200);
    }
    
    public function destroy($Id)
    {
        $user = User::findOrFail($Id);
        $user->delete();

        return response()->json(['message' => 'User rejected and deleted successfully']);
    }
}
