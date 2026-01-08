<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AnswerOptionResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'Id' => $this->Id,
            'QuestionId' => $this->QuestionId,
            'AnswerText' => $this->AnswerText,
            'IsCorrect' => $this->IsCorrect,
        ];
    }
}
