<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Comment extends Model
{
    protected $table = 'comments';
    protected $primaryKey = 'Id';

    public $incrementing = true;
    protected $keyType = 'int';

    const CREATED_AT = 'CreatedAt';
    const UPDATED_AT = 'UpdatedAt';

    protected $fillable = [
        'UserId',
        'LessonId',
        'CourseId',
        'ParentCommentId',
        'Content',
    ];

    protected $casts = [
        'Id' => 'integer',
        'UserId' => 'integer',
        'LessonId' => 'integer',
        'CourseId' => 'integer',
        'ParentCommentId' => 'integer',
        'CreatedAt' => 'datetime',
        'UpdatedAt' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'UserId', 'id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'CourseId', 'Id');
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class, 'LessonId', 'Id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'ParentCommentId', 'Id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'ParentCommentId', 'Id');
    }
}
