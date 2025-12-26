<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->bigIncrements('Id');

            $table->unsignedBigInteger('CourseId');

            $table->string('Title');
            $table->text('Content');
            $table->string('VideoUrl')->nullable();

            $table->integer('EstimatedDuration');
            $table->integer('Order');

            // PascalCase timestamps (explicit)
            $table->timestamp('CreatedAt')->useCurrent();
            $table->timestamp('UpdatedAt')->nullable();

            $table->foreign('CourseId')
                ->references('Id')
                ->on('courses')
                ->onDelete('cascade');

            $table->index(['CourseId', 'Order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
