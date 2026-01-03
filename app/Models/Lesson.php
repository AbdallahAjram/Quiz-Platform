<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    protected $table = 'lessons';
    protected $primaryKey = 'Id';

    public $incrementing = true;
    protected $keyType = 'int';

    const CREATED_AT = 'CreatedAt';
    const UPDATED_AT = 'UpdatedAt';

    protected $fillable = [
        'CourseId',
        'Title',
        'Content',
        'VideoUrl',
        'EstimatedDuration',
        'Order',
        'CreatedBy',
    ];

    protected $casts = [
        'Id' => 'integer',
        'CourseId' => 'integer',
        'EstimatedDuration' => 'integer',
        'Order' => 'integer',
        'CreatedAt' => 'datetime',
        'UpdatedAt' => 'datetime',
        'CreatedBy' => 'integer',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'CourseId', 'Id');
    }

    /**
     * Get the user who created the lesson.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'CreatedBy', 'Id');
    }

    /**
     * Get the completions for the lesson.
     */
    public function completions(): HasMany
    {
        // lesson_completions.LessonId -> lessons.Id
        return $this->hasMany(LessonCompletion::class, 'LessonId', 'Id');
    }

    /**
     * Get the comments for the lesson.
     */
    public function comments(): HasMany
    {
        // comments.LessonId -> lessons.Id
        return $this->hasMany(Comment::class, 'LessonId', 'Id');
    }
}
