<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certificate extends Model
{
    protected $table = 'certificates';
    protected $primaryKey = 'Id';

    public $incrementing = true;
    protected $keyType = 'int';

    const CREATED_AT = 'CreatedAt';
    const UPDATED_AT = 'UpdatedAt';

    protected $fillable = [
        'CourseId',
        'UserId',
        'DownloadUrl',
        'VerificationCode',
        'GeneratedAt',
    ];

    protected $casts = [
        'Id' => 'integer',
        'CourseId' => 'integer',
        'UserId' => 'integer',
        'GeneratedAt' => 'datetime',
        'CreatedAt' => 'datetime',
        'UpdatedAt' => 'datetime',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'CourseId', 'Id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'UserId', 'id');
    }
}
