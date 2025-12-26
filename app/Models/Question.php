<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    protected $table = 'questions';
    protected $primaryKey = 'Id';

    public $incrementing = true;
    protected $keyType = 'int';

    const CREATED_AT = 'CreatedAt';
    const UPDATED_AT = 'UpdatedAt';

    protected $fillable = [
        'QuizId',
        'QuestionText',
        'QuestionType',
        'Order',
    ];

    protected $casts = [
        'Id' => 'integer',
        'QuizId' => 'integer',
        'Order' => 'integer',
        'CreatedAt' => 'datetime',
        'UpdatedAt' => 'datetime',
    ];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class, 'QuizId', 'Id');
    }

    public function answerOptions(): HasMany
    {
        return $this->hasMany(AnswerOption::class, 'QuestionId', 'Id');
    }
}
