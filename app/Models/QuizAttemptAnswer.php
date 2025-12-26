<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizAttemptAnswer extends Model
{
    protected $table = 'quiz_attempt_answers';
    protected $primaryKey = 'Id';

    public $incrementing = true;
    protected $keyType = 'int';

    const CREATED_AT = 'CreatedAt';
    const UPDATED_AT = 'UpdatedAt';

    protected $fillable = [
        'AttemptId',
        'QuestionId',
        'AnswerId',
        'TextAnswer',
    ];

    protected $casts = [
        'Id' => 'integer',
        'AttemptId' => 'integer',
        'QuestionId' => 'integer',
        'AnswerId' => 'integer',
        'CreatedAt' => 'datetime',
        'UpdatedAt' => 'datetime',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(QuizAttempt::class, 'AttemptId', 'Id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class, 'QuestionId', 'Id');
    }

    public function answerOption(): BelongsTo
    {
        return $this->belongsTo(AnswerOption::class, 'AnswerId', 'Id');
    }
}
