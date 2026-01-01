<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_completions', function (Blueprint $table) {
            $table->bigIncrements('Id');

           $table->unsignedBigInteger('LessonId')->index();
           $table->unsignedBigInteger('UserId')->index();


            $table->timestamp('CompletedDate')->useCurrent();

            // PascalCase timestamps
            $table->timestamp('CreatedAt')->useCurrent();
            $table->timestamp('UpdatedAt')->nullable();

            // Prevent duplicate completion rows for same user+lesson
            $table->unique(['LessonId', 'UserId']);

            // FK to lessons: lessons has PK "Id"
            $table->foreign('LessonId')
                ->references('Id')
                ->on('lessons')
                ->onDelete('cascade');

            // FK to users: users PK is "id" (lowercase)
            $table->foreign('UserId')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_completions');
    }
};
