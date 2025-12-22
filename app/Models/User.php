<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'full_name',
        'email',
        'hashed_password',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'hashed_password',
        'remember_token',
    ];
}
