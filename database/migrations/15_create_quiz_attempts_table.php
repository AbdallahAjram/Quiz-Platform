<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->bigIncrements('Id');

            $table->unsignedBigInteger('QuizId');

            // users PK is lowercase "id"
            $table->unsignedBigInteger('UserId');

            $table->integer('Score')->default(0);
            $table->timestamp('AttemptDate')->useCurrent();

            // Duration in seconds (or minutes). Be consistent in controllers.
            $table->integer('Duration')->nullable();

            $table->boolean('IsPassed')->default(false);

            $table->timestamp('CreatedAt')->useCurrent();
            $table->timestamp('UpdatedAt')->nullable();

            $table->foreign('QuizId')
                ->references('Id')
                ->on('quizzes')
                ->onDelete('cascade');

            $table->foreign('UserId')
                ->references('Id')
                ->on('users')
                ->onDelete('cascade');

            $table->index(['QuizId', 'UserId']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
    }
};
