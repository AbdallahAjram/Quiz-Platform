<?php

namespace Database\Factories;

use App\Models\LessonCompletion;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class LessonCompletionFactory extends Factory
{
    protected $model = LessonCompletion::class;

    public function definition(): array
    {
        return [
            'LessonId' => Lesson::factory(),
            'UserId' => User::factory(),
            'CompletedDate' => now(),
        ];
    }
}
