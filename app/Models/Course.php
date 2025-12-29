<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $table = 'courses';
    protected $primaryKey = 'Id';

    public $incrementing = true;
    protected $keyType = 'int';

    // Your DB uses PascalCase timestamps
    const CREATED_AT = 'CreatedAt';
    const UPDATED_AT = 'UpdatedAt';

    protected $fillable = [
        'Title',
        'ShortDescription',
        'LongDescription',
        'Category',
        'Difficulty',
        'Thumbnail',
        'EstimatedDuration',
        'CreatedBy',
    ];

    protected $casts = [
        'Id' => 'integer',
        'EstimatedDuration' => 'integer',
        'CreatedAt' => 'datetime',
        'UpdatedAt' => 'datetime',
        'CreatedBy' => 'integer',
    ];

    /**
     * Get the user who created the course.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'CreatedBy');
    }

    /**
     * Get the lessons for the course.
     */
    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class, 'CourseId');
    }

    /**
     * Get the quizzes for the course.
     */
    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class, 'CourseId');
    }

    /**
     * Get the enrollments for the course.
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'CourseId');
    }
}
