<?php

namespace Database\Factories;

use App\Models\QuizAttempt;
use App\Models\Quiz;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuizAttemptFactory extends Factory
{
    protected $model = QuizAttempt::class;

    public function definition(): array
    {
        return [
            'QuizId' => Quiz::factory(),
            'UserId' => User::factory(),
            'Score' => $this->faker->numberBetween(50, 100),
            'StartTime' => now(),
            'EndTime' => now()->addMinutes(30),
        ];
    }
}
