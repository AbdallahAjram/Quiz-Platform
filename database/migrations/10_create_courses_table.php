<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->bigIncrements('Id');

            $table->string('Title');
            $table->string('ShortDescription')->nullable();
            $table->text('LongDescription')->nullable();
            $table->string('Category')->nullable();
            $table->string('Difficulty')->nullable();
            $table->string('Thumbnail')->nullable();
            $table->integer('EstimatedDuration')->nullable();

            // PascalCase timestamps (explicit)
            $table->timestamp('CreatedAt')->useCurrent();
            $table->timestamp('UpdatedAt')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
