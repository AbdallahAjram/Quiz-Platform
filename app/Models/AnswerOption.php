<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnswerOption extends Model
{
    protected $table = 'answer_options';
    protected $primaryKey = 'Id';

    public $incrementing = true;
    protected $keyType = 'int';

    const CREATED_AT = 'CreatedAt';
    const UPDATED_AT = 'UpdatedAt';

    protected $fillable = [
        'QuestionId',
        'AnswerText',
        'IsCorrect',
    ];

    protected $casts = [
        'Id' => 'integer',
        'QuestionId' => 'integer',
        'IsCorrect' => 'boolean',
        'CreatedAt' => 'datetime',
        'UpdatedAt' => 'datetime',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class, 'QuestionId', 'Id');
    }
}
