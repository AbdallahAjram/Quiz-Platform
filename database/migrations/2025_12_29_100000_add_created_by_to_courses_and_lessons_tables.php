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
    {
        Schema::table('courses', function (Blueprint $table) {
            // courses primary key is "Id" (PascalCase)
            $table->unsignedBigInteger('CreatedBy')->nullable()->after('Id');
            $table->foreign('CreatedBy')->references('id')->on('users')->onDelete('set null');
            $table->index('CreatedBy');
        });

        Schema::table('lessons', function (Blueprint $table) {
            // lessons primary key is "Id" (PascalCase)
            $table->unsignedBigInteger('CreatedBy')->nullable()->after('Id');
            $table->foreign('CreatedBy')->references('id')->on('users')->onDelete('set null');
            $table->index('CreatedBy');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropForeign(['CreatedBy']);
            $table->dropColumn('CreatedBy');
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->dropForeign(['CreatedBy']);
            $table->dropColumn('CreatedBy');
        });
    }
};
