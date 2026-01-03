<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Admin User
        User::create([
            'Name' => 'Admin User',
            'Email' => 'admin@example.com',
            'Password' => Hash::make('password'),
            'Role' => 'Admin',
            'IsActive' => true,
        ]);

        // Create Instructor User
        User::create([
            'Name' => 'Instructor User',
            'Email' => 'instructor@example.com',
            'Password' => Hash::make('password'),
            'Role' => 'Instructor',
            'IsActive' => true,
        ]);

        // Create Student User
        User::create([
            'Name' => 'Student User',
            'Email' => 'student@example.com',
            'Password' => Hash::make('password'),
            'Role' => 'Student',
            'IsActive' => true,
        ]);
    }
}
