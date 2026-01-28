# Course & Lesson Management and Quiz System

## 1. Course & Lesson Management
**Heirarchy**: Course -> Lessons -> (Optional) Final Quiz

### **Course Structure** (`Course` Model)
The **Course** is the top-level container.
-   **Data**: Contains `Title`, `Description`, `Difficulty`, `Thumbnail`, and `EstimatedDuration`.
-   **Ownership**: Linked to a User (`CreatedBy`), typically an **Instructor** or **Admin**.
-   **Visibility**: controlled by `IsPublished` (boolean). Only published courses are visible to Students in the generic catalog.
-   **Certificates**: Controlled by `CertificatesEnabled`. If true, users can claim a certificate upon completion.

### **Lesson Structure** (`Lesson` Model)
A **Lesson** represents a single unit of learning within a Course.
-   **Ordering**: The `Order` field determines the sequence of lessons.
-   **Content Types**: Supports text (`Content`), video (`VideoUrl`), and file attachments (`AttachmentUrl`).
-   **Relationship**: Belongs directly to a Course (`CourseId`).

### **Enrollment Logic**
-   **Student Access**: Students must have an **Enrollment** record to track progress.
-   **Progress Tracking**:
    -   `LessonCompletion`: Records when a student finishes a specific lesson.
    -   **Certificate Eligibility**: User must complete **ALL** lessons AND pass the **Final Quiz** (if one exists).

---

## 2. Quiz Management System
**Types**: Lesson Quiz (Mini-assessments) vs. Course Quiz (Final Exam)

### **Quiz Structure** (`Quiz` Model)
A **Quiz** can be attached to either a **Lesson** OR a **Course** (but usually not both simultaneously in this logic).
-   **Properties**:
    -   `PassingScore`: The percentage required to pass (e.g., 80%).
    -   `TimeLimit`: Duration in minutes (enforced by frontend).
    -   `ShuffleQuestions`: Randomizes question order for each attempt.

### **Question & Answer Bank**
-   **Questions** (`Question` Model):
    -   Supports text and images (`ImagePath`).
    -   `QuestionType`: Supports Multiple Choice (and potentially others).
-   **Answers** (`AnswerOption` Model):
    -   Linked to a specific Question.
    -   `IsCorrect`: Boolean flag indicating the right credentials.

### **Submission & Scoring Logic** (Critical)
The scoring algorithm is robust and handles multiple-correct-answer scenarios (Multi-Select).

**The Algorithm (Word-by-Word):**
1.  **Submission**: User submits an array of selected Answer IDs.
2.  **Calculation per Question**:
    -   The system identifies ALL correct options for that question.
    -   **Points Per Option**: `1 / Total Correct Options`. (e.g., if 2 answers are correct, each is worth 0.5).
    -   **Correct Selection**: Adds points (+0.5).
    -   **Wrong Selection**: **Penalizes** points (-0.5).
    -   **Bounds**: The score for a question cannot go below 0 or above 1.
3.  **Final Score**:
    -   Sum of all Question Scores divided by Total Questions.
    -   Multiplied by 100 to get a percentage.
4.  **Result Storage**:
    -   Creates a `QuizAttempt` record with the final `Score`.
    -   Saves every individual selected answer in `QuizAttemptAnswer` for review.

### **Access Control**
-   **Students**: Read-only access to Quizzes; Can create `QuizAttempt` (Submit).
-   **Instructors**: Can Create/Update/Delete Quizzes for *their* courses.
-   **Admins**: Full access to manage all Quizzes.
