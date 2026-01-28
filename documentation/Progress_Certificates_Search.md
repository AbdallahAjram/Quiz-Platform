# Progress, Certificates, and Search Mechanics

## 1. Progress Tracking
**Core Logic**: "My Courses" Dashboard (`EnrollmentController::myCourses`)

The system tracks progress dynamically by aggregating data from multiple sources:
-   **Structure**: Uses the `myCourses` endpoint to gather all courses a user is enrolled in.
-   **Calculation**:
    1.  **Enrolled Courses**: Fetched via `Enrollment` model.
    2.  **Lesson Count**: Counts total lessons (`lessons_count`) vs. completed lessons (`LessonCompletion` records).
    3.  **Quiz Count**: Counts passed quizzes (`attempts` where `IsPassed` is true).
    4.  **Percentage**: `(Completed Lessons / Total Lessons) * 100`.
-   **Status**: Based on the calculated percentage, the course is marked as 'In Progress' or 'Completed' (implicitly).

## 2. Certificate System
**Eligibility & Verification** (`CertificateController`)

### **A. Generation (`claimCertificate`)**
Before a certificate is issued, a strict eligibility check runs:
1.  **Enrolled?**: User must have an active enrollment.
2.  **Lessons Complete?**: Must have a `LessonCompletion` record for **EVERY** lesson in the course.
3.  **Quizzes Passed?**: Must have a passing score (>= `PassingScore`) for **ALL** quizzes (mini & final) in the course.

### **B. PDF Creation**
-   Uses `dompdf` to render a blade view (`pdf.Certificate`).
-   Embeds the course details, student name, instructor name, and a **Unique Verification Code**.
-   **Storage**: The PDF is uploaded to **Firebase Storage**, and a signed URL (valid for 100 years) is stored in the database.

### **C. Verification (`verify`)**
-   Public Endpoint: `/certificates/verify/{code}`.
-   Anyone with the unique code can validate the certificate authenticity without logging in. Returns student name, course, and issue date.

## 3. Searching and Filtering
**Implementation**: API Query Parameters

The system does not use a heavy search engine (like ElasticSearch) but uses efficient **Database Query Filtering** in the Controllers.

### **Filters Available**:
1.  **Courses** (`CourseController`):
    -   **Instructor View**: Automatically filters/scopes to show only courses created by the logged-in instructor.
    -   **Admin View**: Can see all courses.
    -   **Student View**: `availableCourses` endpoint returning only `IsPublished=true` courses.
2.  **Enrollments**:
    -   Filter by `UserId` (Admin) or `CourseId`.
    -   Filter by `Status` (Active/Completed).
3.  **Certificates**:
    -   Filter by `CourseId`.
4.  **Lesson Completions**:
    -   Filter by `LessonId` or `CourseId`.

### **Pagination**:
-   All list endpoints (Enrollments, Certificates, Completions) use Laravel's `paginate()` method (default 15 items per page) to handle large datasets efficiently.
