<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->bigIncrements('Id');

            $table->unsignedBigInteger('CourseId');

            // users PK is lowercase "id"
            $table->unsignedBigInteger('UserId');

            $table->string('DownloadUrl')->nullable();
            $table->string('VerificationCode')->unique();

            $table->timestamp('GeneratedAt')->useCurrent();

            $table->timestamp('CreatedAt')->useCurrent();
            $table->timestamp('UpdatedAt')->nullable();

            $table->foreign('CourseId')
                ->references('Id')
                ->on('courses')
                ->onDelete('cascade');

            $table->foreign('UserId')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            // Optional but recommended: prevent duplicates per course/user
            $table->unique(['CourseId', 'UserId']);

            $table->index('CourseId');
            $table->index('UserId');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
