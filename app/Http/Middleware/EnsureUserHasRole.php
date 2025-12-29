<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log; // Import Log facade
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = Auth::user();

        // Temporary debugging log as requested
        Log::info('EnsureUserHasRole Middleware:', [
            'user_role' => $user ? $user->Role : 'User not authenticated',
            'required_roles' => $roles
        ]);

        if (!$user || !$this->userHasAnyRole($user, $roles)) {
            $roleList = implode(', ', $roles);
            return response()->json([
                'error' => 'Unauthorized. This action requires ' . $roleList . ' permissions.'
            ], 403);
        }

        return $next($request);
    }

    /**
     * Check if the user has any of the given roles.
     *
     * @param  mixed  $user
     * @param  array  $roles
     * @return bool
     */
    private function userHasAnyRole($user, array $roles): bool
    {
        foreach ($roles as $role) {
            // Strict, case-sensitive comparison
            if ($user->Role === $role) {
                return true;
            }
        }
        return false;
    }
}
