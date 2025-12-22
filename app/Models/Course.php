<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $table = 'courses';

    

    protected $fillable = [
        'Title',
        'ShortDescription',
        'LongDescription',
        'Category',
        'Difficulty',
        'Thumbnail',
        'EstimatedDuration',
    ];

  
}
