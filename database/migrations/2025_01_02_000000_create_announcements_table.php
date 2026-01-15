<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->bigIncrements('Id');

            $table->unsignedBigInteger('CourseId');

            // users PK is lowercase "id"
            $table->unsignedBigInteger('CreatedBy');

            $table->string('Title');
            $table->text('Content');

            $table->timestamp('CreatedAt')->useCurrent();
            $table->timestamp('UpdatedAt')->nullable();

            $table->foreign('CourseId')
                ->references('Id')
                ->on('courses')
                ->onDelete('cascade');

            $table->foreign('CreatedBy')
                ->references('Id')
                ->on('users')
                ->onDelete('cascade');

            $table->index('CourseId');
            $table->index('CreatedBy');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
