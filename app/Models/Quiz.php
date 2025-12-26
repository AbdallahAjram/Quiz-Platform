<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    protected $table = 'quizzes';
    protected $primaryKey = 'Id';

    public $incrementing = true;
    protected $keyType = 'int';

    const CREATED_AT = 'CreatedAt';
    const UPDATED_AT = 'UpdatedAt';

    protected $fillable = [
        'CourseId',
        'LessonId',
        'Title',
        'PassingScore',
        'TimeLimit',
        'ShuffleQuestions',
    ];

    protected $casts = [
        'Id' => 'integer',
        'CourseId' => 'integer',
        'LessonId' => 'integer',
        'PassingScore' => 'integer',
        'TimeLimit' => 'integer',
        'ShuffleQuestions' => 'boolean',
        'CreatedAt' => 'datetime',
        'UpdatedAt' => 'datetime',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'CourseId', 'Id');
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class, 'LessonId', 'Id');
    }

    // ADD THIS
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class, 'QuizId', 'Id');
    }
}
