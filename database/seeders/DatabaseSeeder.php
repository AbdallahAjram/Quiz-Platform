<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\Quiz;
use App\Models\QuizAttempt;
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
            'IsActive' => true,
        ]);

        // Create a specific instructor
        $mainInstructor = User::updateOrCreate(['Email' => 'instructor@example.com'], [
            'Name' => 'Instructor User',
            'Role' => 'Instructor',
            'Password' => Hash::make('password'),
            'IsActive' => true,
        ]);

        // Create 3 random instructors
        $instructors = User::factory()->count(3)->instructor()->create();
        $instructors->add($mainInstructor);

        // Create 15 random students
        $students = User::factory()->count(15)->create();

        // Create 5 courses, each assigned to one of the instructors
        $courses = Course::factory()->count(5)->make()->each(function ($course) use ($instructors) {
            $course->CreatedBy = $instructors->random()->Id;
            $course->save();
        });

        foreach ($courses as $course) {
            // Create lessons for each course
            $lessons = Lesson::factory()->count(rand(5, 10))->create([
                'CourseId' => $course->Id,
            ]);

            // Enroll some students in the course
            $enrolledStudents = $students->random(rand(5, 10));
            foreach ($enrolledStudents as $student) {
                Enrollment::factory()->create([
                    'CourseId' => $course->Id,
                    'UserId' => $student->Id,
                ]);

                // Create a quiz for the course
                $quiz = Quiz::factory()->create([
                    'CourseId' => $course->Id,
                ]);

                // Create a quiz attempt for the student
                $score = rand(30, 100);
                QuizAttempt::factory()->create([
                    'QuizId' => $quiz->Id,
                    'UserId' => $student->Id,
                    'Score' => $score,
                ]);

                // If the student has a high score, mark lessons as completed
                if ($score >= 70) {
                    $completedLessons = $lessons->random(rand(1, $lessons->count()));
                    foreach ($completedLessons as $lesson) {
                        LessonCompletion::factory()->create([
                            'LessonId' => $lesson->Id,
                            'UserId' => $student->Id,
                        ]);
                    }
                }
            }
        }
    }
}
