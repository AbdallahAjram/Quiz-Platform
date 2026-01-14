<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create the main admin user
        User::updateOrCreate(['Email' => 'admin@example.com'], [
            'Name' => 'Admin User',
            'Role' => 'Admin',
            'Password' => Hash::make('password'),
            'Status' => 'Active',
        ]);

        // Create a specific instructor
        User::updateOrCreate(['Email' => 'instructor@example.com'], [
            'Name' => 'Instructor User',
            'Role' => 'Instructor',
            'Password' => Hash::make('password'),
            'Status' => 'Active',
        ]);

        // Create a specific student
        User::updateOrCreate(['Email' => 'student@example.com'], [
            'Name' => 'Student User',
            'Role' => 'Student',
            'Password' => Hash::make('password'),
            'Status' => 'Active',
        ]);
    }
}

