<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_attempt_answers', function (Blueprint $table) {
            $table->bigIncrements('Id');

            $table->unsignedBigInteger('AttemptId');
            $table->unsignedBigInteger('QuestionId');

            // Nullable for text questions
            $table->unsignedBigInteger('AnswerId')->nullable();

            // Nullable for choice questions
            $table->text('TextAnswer')->nullable();

            $table->timestamp('CreatedAt')->useCurrent();
            $table->timestamp('UpdatedAt')->nullable();

            $table->foreign('AttemptId')
                ->references('Id')
                ->on('quiz_attempts')
                ->onDelete('cascade');

            $table->foreign('QuestionId')
                ->references('Id')
                ->on('questions')
                ->onDelete('cascade');

            $table->foreign('AnswerId')
                ->references('Id')
                ->on('answer_options')
                ->onDelete('cascade');

            $table->index(['AttemptId', 'QuestionId']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempt_answers');
    }
};
