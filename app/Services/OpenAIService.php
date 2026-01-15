<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIService
{
    protected $apiKey;
    protected $apiEndpoint = 'https://api.openai.com/v1/chat/completions';

    public function __construct()
    {
        $this->apiKey = config('services.openai.key');
        if (!$this->apiKey) {
            throw new \Exception('OpenAI API Key is missing from config/services.php');
        }
    }

    public function generateQuiz(string $context, int $numQuestions, int $numChoices)
    {
        $systemPrompt = "You are a JSON-only generator. Your sole purpose is to generate quizzes in a strict JSON format.

**CRITICAL RULES:**
1.  **Return ONLY a valid JSON object.** Do not use Markdown backticks or any conversational text.
2.  The `QuestionType` key MUST be one of the following exact strings: 'MCQ' (for Multiple Choice), 'TF' (for True/False), or 'MSQ' (for Multiple Select).
3.  The `IsCorrect` key MUST be a JSON boolean (`true` or `false`).
4.  Use these PascalCase keys exactly: `QuestionText`, `QuestionType`, `answer_options`.
5.  The `answer_options` array must contain objects with `AnswerText` and `IsCorrect` keys.
6.  Ensure there is exactly one `true` value for `IsCorrect` for `MCQ` and `TF` questions. `MSQ` can have multiple.

Here is an example of the required schema:
```json
{
  \"questions\": [
    {
      \"QuestionText\": \"What is 2+2?\",
      \"QuestionType\": \"MCQ\",
      \"answer_options\": [
        { \"AnswerText\": \"3\", \"IsCorrect\": false },
        { \"AnswerText\": \"4\", \"IsCorrect\": true },
        { \"AnswerText\": \"5\", \"IsCorrect\": false }
      ]
    }
  ]
}
```";

        $userPrompt = "Context: ###\n{$context}\n###\n
        Generate {$numQuestions} questions with {$numChoices} options each. The questions can be a mix of Multiple Choice, True/False, or Multiple Select question types.";

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(90)
                ->post($this->apiEndpoint, [
                    'model' => 'gpt-4o-mini',
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userPrompt],
                    ],
                    'response_format' => ['type' => 'json_object'],
                ]);

            if ($response->successful()) {
                Log::info('Full OpenAI Response Body:', $response->json());
                $rawContent = $response->json('choices.0.message.content');
                Log::info('Raw OpenAI Message Content:', ['content' => $rawContent]);

                $decodedContent = json_decode($rawContent, true);

                if (json_last_error() === JSON_ERROR_NONE && isset($decodedContent['questions'])) {
                    return $decodedContent;
                } else {
                    Log::error('OpenAI API: Failed to decode JSON from content or "questions" key is missing.', ['raw_response' => $rawContent]);
                    // Throw an exception that the controller can catch and display
                    throw new \Exception('AI returned malformed data. Check logs for details.');
                }
            } else {
                Log::error('OpenAI API request failed.', ['status' => $response->status(), 'response' => $response->body()]);
                // Throw an exception that the controller can catch and display
                throw new \Exception('OpenAI API request failed. Status: ' . $response->status());
            }
        } catch (\Exception $e) {
            Log::error('Exception while calling OpenAI API: ' . $e->getMessage());
            // Re-throw the exception so the controller can handle it
            throw $e;
        }
    }
}
