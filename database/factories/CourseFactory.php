<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition(): array
    {
        return [
            'Title' => $this->faker->sentence(3),
            'ShortDescription' => $this->faker->sentence(),
            'LongDescription' => $this->faker->paragraph(),
            'CreatedBy' => User::factory(),
            'IsPublished' => $this->faker->boolean,
        ];
    }
}
