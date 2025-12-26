<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $table = 'courses';
    protected $primaryKey = 'Id';

    public $incrementing = true;
    protected $keyType = 'int';

    // Your DB uses PascalCase timestamps
    const CREATED_AT = 'CreatedAt';
    const UPDATED_AT = 'UpdatedAt';

    protected $fillable = [
        'Title',
        'ShortDescription',
        'LongDescription',
        'Category',
        'Difficulty',
        'Thumbnail',
        'EstimatedDuration',
    ];

    protected $casts = [
        'Id' => 'integer',
        'EstimatedDuration' => 'integer',
        'CreatedAt' => 'datetime',
        'UpdatedAt' => 'datetime',
    ];
}
