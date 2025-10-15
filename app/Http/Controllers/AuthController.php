<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'subscription_type' => 'required|in:freemium,basic,premium,admin',
            'role' => 'nullable|in:user,admin',
        ]);

        // Determine role - admin subscription type automatically gets admin role
        $role = $validated['subscription_type'] === 'admin' 
            ? 'admin' 
            : ($validated['role'] ?? 'user');

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'subscription_type' => $validated['subscription_type'],
            'role' => $role,
            'subscription_started_at' => now(),
            // Set expiration date for paid plans (30 days trial/subscription period)
            // Admin users don't have expiration
            'subscription_expires_at' => $validated['subscription_type'] === 'admin' 
                ? null 
                : (in_array($validated['subscription_type'], ['basic', 'premium']) 
                    ? now()->addDays(30) 
                    : null),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'subscription_type' => $user->subscription_type,
                'role' => $user->role,
                'is_admin' => $user->isAdmin(),
                'subscription_started_at' => $user->subscription_started_at,
                'subscription_expires_at' => $user->subscription_expires_at,
            ],
            'token' => $token,
            'message' => 'Registration successful',
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Revoke previous tokens
        $user->tokens()->delete();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'subscription_type' => $user->subscription_type,
                'role' => $user->role,
                'is_admin' => $user->isAdmin(),
                'subscription_started_at' => $user->subscription_started_at,
                'subscription_expires_at' => $user->subscription_expires_at,
            ],
            'token' => $token,
            'message' => 'Login successful',
        ]);
    }

    /**
     * Get authenticated user
     */
    public function user(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'subscription_type' => $user->subscription_type,
                'role' => $user->role,
                'is_admin' => $user->isAdmin(),
                'subscription_started_at' => $user->subscription_started_at,
                'subscription_expires_at' => $user->subscription_expires_at,
                'is_subscription_active' => $user->isSubscriptionActive(),
            ],
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Logout successful',
        ]);
    }

    /**
     * Update user subscription
     */
    public function updateSubscription(Request $request)
    {
        $validated = $request->validate([
            'subscription_type' => 'required|in:freemium,basic,premium,admin',
        ]);

        $user = $request->user();
        
        // Update role if changing to/from admin
        $role = $validated['subscription_type'] === 'admin' ? 'admin' : 'user';
        
        $user->update([
            'subscription_type' => $validated['subscription_type'],
            'role' => $role,
            'subscription_started_at' => now(),
            'subscription_expires_at' => $validated['subscription_type'] === 'admin'
                ? null
                : (in_array($validated['subscription_type'], ['basic', 'premium']) 
                    ? now()->addDays(30) 
                    : null),
        ]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'subscription_type' => $user->subscription_type,
                'role' => $user->role,
                'is_admin' => $user->isAdmin(),
                'subscription_started_at' => $user->subscription_started_at,
                'subscription_expires_at' => $user->subscription_expires_at,
            ],
            'message' => 'Subscription updated successfully',
        ]);
    }
}

