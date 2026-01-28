# User Roles and Authentication System

## 1. Authentication ("Who are you?")
**System**: Laravel Sanctum  
**Type**: Token-based (Bearer Token)

The system uses **Laravel Sanctum** to handle user identity.
- **Login**: When a user logs in via `/api/auth/login`, the system verifies their password (which is securely hashed).
- **Token Issue**: If valid, the system generates a unique API **Access Token**.
- **Usage**: The frontend must send this token in the `Authorization` header (`Bearer <token>`) for every subsequent request to protected routes.
- **Code Reference**:
  - `User.php` uses the `HasApiTokens` trait.
  - Protected routes in `routes/api.php` use the `auth:sanctum` middleware.

## 2. User Roles ("What can you do?")
**Storage**: Database Column  
**Logic**: Middleware Checks

Access control is managed via a dedicated **Role** column in the `users` table.
- **Storage**: The `users` table contains a string column named `Role` (e.g., "Admin", "Student", "Instructor").
- **Middleware**: A custom middleware `EnsureUserHasRole` (aliased as `role`) intercepts requests.
- **Enforcement**:
  - `middleware('role:Admin')`: Only allows users where `Role === 'Admin'`.
  - `middleware('role:Admin,Instructor')`: Allows users with *either* 'Admin' or 'Instructor' roles.
- **Code Reference**:
  - `app/Http/Middleware/EnsureUserHasRole.php`: Contains the logic to check `Auth::user()->Role`.

## 3. Security Highlights
**Protection Layers**

1.  **Password Security**: User passwords are never stored in plain text; they are hashed (typically using Bcrypt) before storage.
2.  **Route Protection**:
    - **Public**: Login/Register/Verify Certificate (No token required).
    - **Protected**: Dashboard/Profile (Requires Token).
    - **Restricted**: Admin Panels (Requires Token + Specific Role).
3.  **Strict Validation**: The role check uses strict comparison (`===`) to prevent type-juggling vulnerabilities.
