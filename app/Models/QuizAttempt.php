<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizAttempt extends Model
{
    use HasFactory;
    protected $table = 'quiz_attempts';
    protected $primaryKey = 'Id';

    public $incrementing = true;
    protected $keyType = 'int';

    const CREATED_AT = 'CreatedAt';
    const UPDATED_AT = 'UpdatedAt';

    protected $fillable = [
        'QuizId',
        'UserId',
        'Score',
        'AttemptDate',
        'Duration',
        'IsPassed',
    ];

    protected $casts = [
        'Id' => 'integer',
        'QuizId' => 'integer',
        'UserId' => 'integer',
        'Score' => 'integer',
        'AttemptDate' => 'datetime',
        'Duration' => 'integer',
        'IsPassed' => 'boolean',
        'CreatedAt' => 'datetime',
        'UpdatedAt' => 'datetime',
    ];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class, 'QuizId', 'Id');
    }

    public function user(): BelongsTo
    {
        // users PK is lowercase "id"
        return $this->belongsTo(User::class, 'UserId', 'id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(QuizAttemptAnswer::class, 'AttemptId', 'Id');
    }
}
