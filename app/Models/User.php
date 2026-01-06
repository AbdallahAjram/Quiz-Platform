<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';
    protected $primaryKey = 'Id';
    public $timestamps = true;
    const CREATED_AT = 'CreatedAt';
    const UPDATED_AT = 'UpdatedAt';

    protected $fillable = [
        'Name',
        'Email',
        'Password',
        'Role',
        'IsActive',
    ];

    protected $hidden = [
        'Password',
        'RememberToken',
    ];

    /**
     * NOTE: users table PK is the default Laravel "id" (lowercase).
     * Many other tables use PascalCase foreign keys like UserId.
     */

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'UserId', 'Id');
    }

    public function lessonCompletions()
    {
        return $this->hasMany(LessonCompletion::class, 'UserId', 'Id');
    }

    public function quizAttempts()
    {
        return $this->hasMany(QuizAttempt::class, 'UserId', 'Id');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class, 'UserId', 'Id');
    }

    public function announcements()
    {
        // announcements.CreatedBy -> users.Id
        return $this->hasMany(Announcement::class, 'CreatedBy', 'Id');
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class, 'UserId', 'Id');
    }

}
