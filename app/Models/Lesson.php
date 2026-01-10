<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    use HasFactory;
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
        'AttachmentUrl',
        'EstimatedDuration',
        'Order',
    ];

    protected $casts = [
        'Id' => 'integer',
        'CourseId' => 'integer',
        'EstimatedDuration' => 'integer',
        'Order' => 'integer',
        'CreatedAt' => 'datetime',
        'UpdatedAt' => 'datetime',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'CourseId', 'Id');
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

    /**
     * Get the quiz for the lesson.
     */
    public function quiz(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Quiz::class, 'LessonId', 'Id');
    }
}
