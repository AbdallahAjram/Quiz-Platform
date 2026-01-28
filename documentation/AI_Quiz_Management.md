# AI Quiz Generation (Word-by-Word)

**Controller**: `AIController.php`  
**Service**: `OpenAIService.php`  
**Model**: `gpt-4o-mini`

## 1. The Core Workflow
The generated quiz process is a pipeline that transforms raw course content into structured JSON data suitable for the database.

### **Step 1: Input Gathering (`AIController::generateQuiz`)**
The controller first aggregates the "Context" that the AI will learn from.
-   **Method**: `implode("\n\n")` on Lesson Content.
-   **Source**: It pulls from either a specific list of `lesson_ids` provided in the request OR all lessons in a `CourseId`.
-   **Fallback**: If no lessons exist, it checks if a raw `prompt` text was manually provided.

### **Step 2: Prompt Engineering (`OpenAIService::generateQuiz`)**
This is the "Brain" of the operation. The system sends TWO specific messages to OpenAI:

**A. System Prompt (The Rules)**
-   **Role**: "You are a JSON-only generator."
-   **Constraint**: STRICTLY forbids Markdown (` ```json `) or conversational text.
-   **Schema Enforcement**: Explicitly defines the required JSON structure (`QuestionText`, `QuestionType`, `answer_options`, `IsCorrect`).
-   **Logic Rules**: Enforces that `MCQ` (Multiple Choice) and `TF` (True/False) must have exactly one true answer.

**B. User Prompt (The Content)**
-   Injects the aggregated **Context** (Lesson materials).
-   Injects user parameters: `numQuestions` and `numChoices`.
-   Instruction: "Generate X questions... mix of Multiple Choice, True/False...".

### **Step 3: The API Call**
-   **Model**: Uses `gpt-4o-mini` (Cost-effective, high speed).
-   **Mode**: `response_format: { type: "json_object" }` (This guarantees the output is parseable JSON).
-   **Timeout**: 90 seconds (to handle large batch generation).

### **Step 4: Validation & Saving (`AIController::saveQuiz`)**
Once the JSON is returned to the frontend (preview pane), the user can edit it. When they click "Save":
-   **Transaction**: Uses `DB::transaction` to ensure atomicity.
-   **Storage**:
    1.  Creates the `Quiz` record.
    2.  Loops through the returned JSON to create `Question` records.
    3.  Loops through nested `answer_options` to create `AnswerOption` records.
-   **Image Handling**: The `saveQuiz` method also checks for image uploads (`questions.{index}.image`) if the user added custom images to the AI-generated questions.
