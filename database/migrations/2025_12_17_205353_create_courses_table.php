<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {Schema::create('courses', function (Blueprint $table) {
    $table->id(); // matches ERD: Id
    $table->string('Title');
    $table->string('ShortDescription')->nullable();
    $table->text('LongDescription')->nullable();
    $table->string('Category')->nullable();
    $table->string('Difficulty')->nullable();
    $table->string('Thumbnail')->nullable();
    $table->integer('EstimatedDuration')->nullable();
    $table->timestamps();
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
