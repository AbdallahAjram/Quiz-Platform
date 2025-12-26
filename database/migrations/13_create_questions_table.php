<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->bigIncrements('Id');

            $table->unsignedBigInteger('QuizId');

            $table->text('QuestionText');
            $table->string('QuestionType'); // e.g. 'single', 'multiple', 'text'
            $table->integer('Order');

            $table->timestamp('CreatedAt')->useCurrent();
            $table->timestamp('UpdatedAt')->nullable();

            $table->foreign('QuizId')
                ->references('Id')
                ->on('quizzes')
                ->onDelete('cascade');

            $table->index(['QuizId', 'Order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
