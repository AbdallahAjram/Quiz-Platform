<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class QuizResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'Id' => $this->Id,
            'CourseId' => $this->CourseId,
            'LessonId' => $this->LessonId,
            'Title' => $this->Title,
            'PassingScore' => $this->PassingScore,
            'TimeLimit' => $this->TimeLimit,
            'ShuffleQuestions' => $this->ShuffleQuestions,
            'CreatedAt' => $this->CreatedAt,
            'UpdatedAt' => $this->UpdatedAt,
            'questions' => QuestionResource::collection($this->whenLoaded('questions')),
        ];
    }
}
