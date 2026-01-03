<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
  protected $table = 'enrollments';
    protected $primaryKey = 'Id';

    const CREATED_AT = 'CreatedAt';
    const UPDATED_AT = 'UpdatedAt';

    protected $fillable = [
        'UserId',
        'CourseId',
        'EnrolledAt',
        'Status',
    ];

    protected $casts = [
        'Id' => 'integer',
        'UserId' => 'integer',
        'CourseId' => 'integer',
        'EnrolledAt' => 'datetime',
        'CreatedAt' => 'datetime',
        'UpdatedAt' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'UserId', 'Id');
    }

    public function course(): BelongsTo
    {
        // courses PK is PascalCase "Id"
        return $this->belongsTo(Course::class, 'CourseId', 'Id');
    }
}
