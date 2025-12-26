<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonCompletion extends Model
{
    protected $table = 'lesson_completions';
    protected $primaryKey = 'Id';

    public $incrementing = true;
    protected $keyType = 'int';

    const CREATED_AT = 'CreatedAt';
    const UPDATED_AT = 'UpdatedAt';

    protected $fillable = [
        'LessonId',
        'UserId',
        'CompletedDate',
    ];

    protected $casts = [
        'Id' => 'integer',
        'LessonId' => 'integer',
        'UserId' => 'integer',
        'CompletedDate' => 'datetime',
        'CreatedAt' => 'datetime',
        'UpdatedAt' => 'datetime',
    ];

    public function lesson(): BelongsTo
    {
        // lessons PK is "Id"
        return $this->belongsTo(Lesson::class, 'LessonId', 'Id');
    }

    public function user(): BelongsTo
    {
        // users PK is "id" (lowercase)
        return $this->belongsTo(User::class, 'UserId', 'id');
    }
}
