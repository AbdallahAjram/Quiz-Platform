<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'CreatedBy',
    ];

    protected $casts = [
        'Id' => 'integer',
        'EstimatedDuration' => 'integer',
        'CreatedAt' => 'datetime',
        'UpdatedAt' => 'datetime',
        'CreatedBy' => 'integer',
    ];

    /**
     * User who created the course (courses.CreatedBy -> users.id).
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'CreatedBy', 'id');
    }

    public function lessons() {
    return $this->hasMany(Lesson::class, 'CourseId', 'Id');
}

public function quizzes() {
    return $this->hasMany(Quiz::class, 'CourseId', 'Id');
}

public function enrollments() {
    return $this->hasMany(Enrollment::class, 'CourseId', 'Id');
}

public function announcements() {
    return $this->hasMany(Announcement::class, 'CourseId', 'Id');
}

public function comments() {
    return $this->hasMany(Comment::class, 'CourseId', 'Id');
}

public function certificates() {
    return $this->hasMany(Certificate::class, 'CourseId', 'Id');
}

}
