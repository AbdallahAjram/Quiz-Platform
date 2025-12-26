<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('answer_options', function (Blueprint $table) {
            $table->bigIncrements('Id');

            $table->unsignedBigInteger('QuestionId');

            $table->text('AnswerText');
            $table->boolean('IsCorrect')->default(false);

            $table->timestamp('CreatedAt')->useCurrent();
            $table->timestamp('UpdatedAt')->nullable();

            $table->foreign('QuestionId')
                ->references('Id')
                ->on('questions')
                ->onDelete('cascade');

            $table->index('QuestionId');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('answer_options');
    }
};
