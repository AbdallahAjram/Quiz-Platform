<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->bigIncrements('Id');

            // Users table uses default Laravel PK: id (lowercase)
            $table->unsignedBigInteger('UserId');

            // Courses table uses PascalCase PK: Id (as you implemented)
            $table->unsignedBigInteger('CourseId');

            $table->timestamp('EnrolledAt')->useCurrent();
            $table->string('Status')->default('active');

            $table->timestamp('CreatedAt')->useCurrent();
            $table->timestamp('UpdatedAt')->nullable();

            $table->unique(['UserId', 'CourseId']);

            $table->foreign('UserId')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->foreign('CourseId')
                ->references('Id')
                ->on('courses')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
