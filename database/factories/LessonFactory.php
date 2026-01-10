<?php

namespace Database\Factories;

use App\Models\Lesson;
use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

class LessonFactory extends Factory
{
    protected $model = Lesson::class;

    public function definition(): array
    {
        return [
            'CourseId' => Course::factory(),
            'Title' => $this->faker->sentence,
            'Content' => $this->faker->paragraph,
            'EstimatedDuration' => $this->faker->numberBetween(10, 60),
        ];
    }
}
