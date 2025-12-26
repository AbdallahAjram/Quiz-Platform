<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quizzes', function (Blueprint $table) {
            $table->bigIncrements('Id');

            $table->unsignedBigInteger('CourseId');
            $table->unsignedBigInteger('LessonId')->nullable();

            $table->string('Title');
            $table->integer('PassingScore');

            // TimeLimit can be null (store minutes or seconds—be consistent across app)
            $table->integer('TimeLimit')->nullable();

            $table->boolean('ShuffleQuestions')->default(false);

            // PascalCase timestamps
            $table->timestamp('CreatedAt')->useCurrent();
            $table->timestamp('UpdatedAt')->nullable();

            // FKs
            $table->foreign('CourseId')
                ->references('Id')
                ->on('courses')
                ->onDelete('cascade');

            // If a lesson is deleted, keep the quiz but detach it from the lesson
            $table->foreign('LessonId')
                ->references('Id')
                ->on('lessons')
                ->nullOnDelete();

            // Helpful indexes
            $table->index('CourseId');
            $table->index('LessonId');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};
