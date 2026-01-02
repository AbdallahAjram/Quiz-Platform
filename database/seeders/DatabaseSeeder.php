<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Admin User
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'Role' => 'Admin',
            'Status' => 'Active',
        ]);

        // Pending Instructor
        User::factory()->create([
            'name' => 'Instructor User',
            'email' => 'instructor@example.com',
            'Role' => 'Instructor',
            'Status' => 'Pending',
        ]);

        // Student User
        User::factory()->create([
            'name' => 'Student User',
            'email' => 'student@example.com',
            'Role' => 'Student',
            'Status' => 'Active',
        ]);
    }
}
