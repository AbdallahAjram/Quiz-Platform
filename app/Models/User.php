<?php

namespace App\Models;

use App\Models\Lesson;
use App\Models\Quiz;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Log;
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
        'Status',
    ];

    protected $hidden = [
        'Password',
        'RememberToken',
    ];

    protected $appends = ['FullName'];

    public function getFullNameAttribute()
    {
        return $this->Name;
    }

    public function isEligibleForCertificate(int $courseId): bool
    {
        Log::info("Checking certificate eligibility for User ID: {$this->Id} and Course ID: {$courseId}");

        // Condition 1: Must have a LessonCompletion record for every lesson in the course.
        $lessonCount = Lesson::where('CourseId', $courseId)->count();
        if ($lessonCount > 0) {
            $completedLessonsCount = $this->lessonCompletions()
                ->join('lessons', 'lesson_completions.LessonId', '=', 'lessons.Id')
                ->where('lessons.CourseId', $courseId)
                ->distinct('lessons.Id')
                ->count();
            
            if ($completedLessonsCount < $lessonCount) {
                Log::info("Eligibility failed for User ID: {$this->Id}, Course ID: {$courseId}. Reason: Not all lessons completed. Completed: {$completedLessonsCount}, Total: {$lessonCount}");
                return false;
            }
        }

        // Condition 2: Must have passed the final quiz for the course (if one exists).
        // A final quiz is identified by having a null LessonId.
        $finalQuiz = Quiz::where('CourseId', $courseId)->whereNull('LessonId')->first();

        if ($finalQuiz) {
            $hasPassedFinalQuiz = $this->quizAttempts()
                ->where('QuizId', $finalQuiz->Id)
                ->where('IsPassed', true)
                ->exists();

            if (!$hasPassedFinalQuiz) {
                Log::info("Eligibility failed for User ID: {$this->Id}, Course ID: {$courseId}. Reason: Final quiz not passed. Quiz ID: {$finalQuiz->Id}");
                return false;
            }
        }
        
        Log::info("User ID: {$this->Id} is eligible for certificate for Course ID: {$courseId}");
        // If both conditions are met, the user is eligible.
        return true;
    }

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
