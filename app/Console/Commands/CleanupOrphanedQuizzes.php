<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Quiz;
use Illuminate\Support\Facades\DB;

class CleanupOrphanedQuizzes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cleanup:orphaned-quizzes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Deletes quizzes that are not associated with any course.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting cleanup of orphaned quizzes...');

        $orphanedQuizzes = Quiz::whereNotIn('CourseId', function ($query) {
            $query->select('Id')->from('courses');
        })->get();

        if ($orphanedQuizzes->isEmpty()) {
            $this->info('No orphaned quizzes found.');
            return;
        }

        $this->info("Found {$orphanedQuizzes->count()} orphaned quizzes to delete.");

        foreach ($orphanedQuizzes as $quiz) {
            $this->line("Deleting quiz #{$quiz->Id} (Title: {$quiz->Title})");
            $quiz->delete();
        }

        $this->info('Cleanup complete.');
    }
}
