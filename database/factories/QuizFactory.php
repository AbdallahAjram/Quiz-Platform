<?php

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuizFactory extends Factory
{
    protected $model = Quiz::class;

    public function definition(): array
    {
        return [
            'CourseId' => Course::factory(),
            'Title' => $this->faker->sentence,
            'PassingScore' => 70,
        ];
    }
}
