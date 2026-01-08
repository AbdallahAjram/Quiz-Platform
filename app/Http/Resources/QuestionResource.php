<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class QuestionResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'Id' => $this->Id,
            'QuizId' => $this->QuizId,
            'QuestionText' => $this->QuestionText,
            'QuestionType' => $this->QuestionType,
            'Order' => $this->Order,
            'answerOptions' => AnswerOptionResource::collection($this->whenLoaded('answerOptions')),
        ];
    }
}
