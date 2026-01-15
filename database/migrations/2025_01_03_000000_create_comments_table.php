<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->bigIncrements('Id');

            // users PK is lowercase "id"
            $table->unsignedBigInteger('UserId');

            // nullable lesson comment
            $table->unsignedBigInteger('LessonId')->nullable();

            // required course comment (per your schema)
            $table->unsignedBigInteger('CourseId');

            // self-referencing parent
            $table->unsignedBigInteger('ParentCommentId')->nullable();

            $table->text('Content');

            $table->timestamp('CreatedAt')->useCurrent();
            $table->timestamp('UpdatedAt')->nullable();

            // FKs
            $table->foreign('UserId')
                ->references('Id')
                ->on('users')
                ->onDelete('cascade');

            $table->foreign('LessonId')
                ->references('Id')
                ->on('lessons')
                ->nullOnDelete();

            $table->foreign('CourseId')
                ->references('Id')
                ->on('courses')
                ->onDelete('cascade');

            // If parent deleted, keep child but detach parent link
            $table->foreign('ParentCommentId')
                ->references('Id')
                ->on('comments')
                ->nullOnDelete();

            // Indexes
            $table->index(['CourseId', 'LessonId']);
            $table->index('UserId');
            $table->index('ParentCommentId');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
