# Authentication System Setup Guide

## Overview
This document describes the authentication and subscription system implementation for the SACRART online education platform.

## Features Implemented

### Backend (Laravel)
- ✅ User registration with subscription selection
- ✅ User login/logout with token-based authentication (Laravel Sanctum)
- ✅ Three subscription tiers: Freemium, Basic, Premium
- ✅ Subscription management (upgrade/downgrade)
- ✅ Protected API routes
- ✅ CORS configuration for frontend-backend communication

### Frontend (React/TypeScript)
- ✅ Registration page with form validation
- ✅ Login page
- ✅ Subscription selection page
- ✅ User dashboard displaying subscription info
- ✅ Protected routes requiring authentication
- ✅ Authentication context for global state management
- ✅ API client for backend communication

## Setup Instructions

### 1. Backend Setup (Laravel)

#### Environment Configuration
Your `.env` file has been configured to use MySQL with the `education_ana` database:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=education_ana
DB_USERNAME=root
DB_PASSWORD=
```

**Note**: If your MySQL root user has a password, update the `DB_PASSWORD` value in the `.env` file.

#### Database Setup ✅
The migrations have already been run successfully on your MySQL database `education_ana`. The following tables were created:

- ✅ `users` - User accounts with subscription information
- ✅ `password_reset_tokens` - Password reset functionality
- ✅ `sessions` - User sessions
- ✅ `cache` - Application cache
- ✅ `jobs` - Queue jobs

If you need to reset the database:

```bash
php artisan migrate:fresh
```

#### Start Laravel Development Server
```bash
php artisan serve
```

The backend API will be available at: `http://localhost:8000`

### 2. Frontend Setup (React)

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Create Environment File
Create a file named `.env` in the `frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

#### Start Development Server
```bash
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## API Endpoints

### Public Endpoints

#### Register
```
POST /api/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "subscription_type": "freemium" | "basic" | "premium"
}
```

#### Login
```
POST /api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Protected Endpoints (Require Authentication Token)

#### Get Current User
```
GET /api/user
Authorization: Bearer {token}
```

#### Logout
```
POST /api/logout
Authorization: Bearer {token}
```

#### Update Subscription
```
PUT /api/subscription
Authorization: Bearer {token}
Content-Type: application/json

{
  "subscription_type": "freemium" | "basic" | "premium"
}
```

## Subscription Tiers

### Freemium (Free)
- Access to limited content
- Basic video quality
- Watch on 1 device
- Community support

### Basic ($9.99/month)
- Access to intermediate level content
- HD streaming quality
- Watch on 2 devices
- Email support
- Progress tracking

### Premium ($19.99/month)
- Access to all content
- 4K streaming quality
- Watch on 3 devices
- Priority support
- Downloadable content
- Certificates of completion
- Ad-free experience

## User Flow

### Registration Flow
1. User visits `/auth` and clicks "Sign up"
2. User enters name, email, and password
3. User clicks "Continue to Plans"
4. User is redirected to `/subscription` page
5. User selects a subscription plan
6. Account is created with selected plan
7. User is redirected to `/dashboard`

### Login Flow
1. User visits `/auth`
2. User enters email and password
3. User clicks "Sign In"
4. User is redirected to `/dashboard`

### Subscription Management
- Users can change their subscription from the dashboard
- Click "Change Plan" or "Upgrade Plan" button
- Select new plan on subscription page
- Subscription is updated immediately

## Key Files

### Backend
- `app/Http/Controllers/AuthController.php` - Authentication logic
- `app/Models/User.php` - User model with subscription methods
- `routes/api.php` - API routes
- `database/migrations/0001_01_01_000000_create_users_table.php` - User table schema
- `config/cors.php` - CORS configuration
- `config/sanctum.php` - Sanctum configuration

### Frontend
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/lib/api.ts` - API client
- `src/pages/Auth.tsx` - Login/Register page
- `src/pages/Subscription.tsx` - Subscription selection page
- `src/pages/Dashboard.tsx` - User dashboard
- `src/components/ProtectedRoute.tsx` - Route protection wrapper

## Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| name | string | User's full name |
| email | string | Unique email address |
| password | string | Hashed password |
| subscription_type | enum | freemium, basic, or premium |
| subscription_started_at | timestamp | When subscription started |
| subscription_expires_at | timestamp | When subscription expires (null for freemium) |
| created_at | timestamp | Account creation date |
| updated_at | timestamp | Last update date |

## Testing the System

### Test User Registration
1. Go to `http://localhost:5173/auth`
2. Click "Sign up"
3. Fill in the form and continue to subscription
4. Select a plan
5. You should be redirected to the dashboard

### Test User Login
1. Go to `http://localhost:5173/auth`
2. Use credentials from a registered user
3. Click "Sign In"
4. You should be redirected to the dashboard

### Test Protected Routes
1. Without logging in, try to access `http://localhost:5173/dashboard`
2. You should be redirected to `/auth`
3. After logging in, you can access the dashboard

### Test Subscription Change
1. Login and go to dashboard
2. Click "Change Plan" or "Upgrade Plan"
3. Select a different subscription
4. Dashboard should update with new subscription info

## Security Features

- Passwords are hashed using Laravel's built-in bcrypt hashing
- API routes are protected with Laravel Sanctum token authentication
- CORS is configured to only allow requests from the frontend domain
- Frontend stores authentication tokens in localStorage
- Protected routes redirect unauthorized users to login

## Next Steps

To continue building the platform, you can:

1. **Content Management**: Create migrations and models for courses, series, and videos
2. **Video Player**: Integrate video hosting provider (e.g., Bunny.net)
3. **Payment Integration**: Add Stripe/PayPal for paid subscriptions
4. **Admin Panel**: Create admin routes and pages for content management
5. **Multilingual Support**: Implement i18n for Spanish, Portuguese, and English
6. **Progressive Web App**: Configure PWA manifest and service workers
7. **Video Progress Tracking**: Track user watch progress per video
8. **Q&A System**: Implement question submission for premium users

## Troubleshooting

### CORS Errors
If you encounter CORS errors:
1. Make sure Laravel backend is running on port 8000
2. Check that frontend API URL is set correctly in `.env`
3. Verify CORS configuration in `config/cors.php`

### Authentication Issues
If login/register doesn't work:
1. Check browser console for errors
2. Verify backend API is accessible
3. Check that migrations have been run
4. Ensure Sanctum is properly installed

### Token Expiration
- Sanctum tokens don't expire by default
- Users need to manually logout or clear localStorage
- You can configure token expiration in `config/sanctum.php`

## Support

For questions or issues, refer to:
- Laravel Documentation: https://laravel.com/docs
- Laravel Sanctum: https://laravel.com/docs/sanctum
- React Documentation: https://react.dev
- TypeScript Documentation: https://www.typescriptlang.org/docs

