# Frontend-Backend Connection Guide

## ✅ Configuration Complete

### Backend Configuration (Laravel)
- **Database**: MySQL - `education_ana` ✅
- **API Routes**: `http://localhost:8000/api` ✅
- **CORS**: Configured for `http://localhost:8080` (and 5173, 3000) ✅
- **Sanctum**: Installed and configured ✅

### Frontend Configuration (React)
- **Environment**: `.env` file created ✅
- **API Base URL**: `http://localhost:8000/api` ✅
- **Auth Context**: Configured ✅
- **API Client**: Ready ✅

## 🚀 Starting Both Servers

### Terminal 1: Start Laravel Backend
```bash
cd h:/Workana_Git/laravel
php artisan serve
```
Backend will run on: **http://localhost:8000**

### Terminal 2: Start React Frontend
```bash
cd h:/Workana_Git/laravel/frontend
npm run dev
```
Frontend will run on: **http://localhost:8080** (or port shown in terminal)

## 🧪 Testing the Connection

### Method 1: Test via Frontend
1. Open browser: `http://localhost:8080` (check your terminal for the actual port)
2. Click "Sign In" or go to `http://localhost:8080/auth`
3. Try logging in with:
   - **Email**: `admin@ana.com`
   - **Password**: `password`
4. You should be redirected to dashboard on success

### Method 2: Test API Directly
Open a new terminal and run:

```bash
# Test API is running
curl http://localhost:8000/api/user

# Test Login
curl -X POST http://localhost:8000/api/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@ana.com\",\"password\":\"password\"}"
```

**Expected Response:**
```json
{
  "user": {
    "id": 1,
    "name": "Admin Ana",
    "email": "admin@ana.com",
    "subscription_type": "admin",
    "role": "admin",
    "is_admin": true
  },
  "token": "1|...",
  "message": "Login successful"
}
```

## 📋 API Endpoints Available

### Public Endpoints
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Protected Endpoints (Require Token)
- `GET /api/user` - Get current user
- `POST /api/logout` - Logout user
- `PUT /api/subscription` - Update subscription

### Admin Endpoints (Require Admin Token)
- Add admin routes with `middleware(['auth:sanctum', 'admin'])`

## 🔧 Troubleshooting

### Issue: CORS Error
**Symptoms**: Browser console shows CORS error
**Solution**: 
1. Verify backend is running on port 8000
2. Check `config/cors.php` includes your frontend port (8080, 5173, or 3000)
3. Clear Laravel config cache: `php artisan config:clear`
4. Restart Laravel server
5. Clear browser cache

### Issue: 401 Unauthorized
**Symptoms**: API returns 401 error
**Solution**:
1. Check token is being sent in Authorization header
2. Verify token format: `Bearer {token}`
3. Check token hasn't expired

### Issue: 404 Not Found
**Symptoms**: API endpoint not found
**Solution**:
1. Verify backend is running
2. Check API URL is correct: `http://localhost:8000/api`
3. Verify route exists in `routes/api.php`

### Issue: Connection Refused
**Symptoms**: Cannot connect to backend
**Solution**:
1. Ensure Laravel server is running: `php artisan serve`
2. Check port 8000 is not in use by another app
3. Try accessing `http://localhost:8000` directly in browser

## 🔄 Frontend API Usage Examples

### Login Example
```typescript
import { api } from '@/lib/api';

// Login
try {
  const response = await api.login({
    email: 'admin@ana.com',
    password: 'password'
  });
  
  // Token is automatically stored in localStorage
  console.log('Logged in:', response.user);
} catch (error) {
  console.error('Login failed:', error);
}
```

### Get Current User
```typescript
// Get authenticated user
try {
  const { user } = await api.getUser();
  console.log('Current user:', user);
} catch (error) {
  console.error('Not authenticated');
}
```

### Register New User
```typescript
// Register with subscription
try {
  const response = await api.register({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    subscription_type: 'basic'
  });
  
  console.log('Registered:', response.user);
} catch (error) {
  console.error('Registration failed:', error);
}
```

## 📱 Testing User Flow

### 1. Register New User
1. Go to `http://localhost:8080/auth`
2. Click "Sign up"
3. Fill in form:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
4. Click "Continue to Plans"
5. Select a subscription plan
6. You'll be redirected to dashboard

### 2. Login Existing User
1. Go to `http://localhost:8080/auth`
2. Enter credentials:
   - Email: admin@ana.com
   - Password: password
3. Click "Sign In"
4. You'll be redirected to dashboard

### 3. View Dashboard
1. After login, you should see:
   - Welcome message with your name
   - Subscription information
   - Account details
   - Access level information

### 4. Change Subscription
1. From dashboard, click "Change Plan" or "Upgrade Plan"
2. Select a different subscription
3. Dashboard updates with new subscription

### 5. Logout
1. Click "Logout" button in dashboard
2. You'll be redirected to auth page
3. Try accessing `/dashboard` - should redirect to login

## 🔒 Security Features

- ✅ **Token-based authentication** - Laravel Sanctum
- ✅ **Password hashing** - Bcrypt
- ✅ **CORS protection** - Configured for specific origins
- ✅ **API rate limiting** - Laravel default
- ✅ **SQL injection protection** - Eloquent ORM
- ✅ **XSS protection** - React escaping
- ✅ **CSRF protection** - SPA authentication

## 📊 Available Test Users

| Email | Password | Role | Subscription |
|-------|----------|------|--------------|
| admin@ana.com | password | Admin | Admin (Full Access) |

Create more users via registration page!

## 🎯 Quick Commands

```bash
# Start backend
cd h:/Workana_Git/laravel && php artisan serve

# Start frontend (new terminal)
cd h:/Workana_Git/laravel/frontend && npm run dev

# Check database
php artisan tinker
>>> User::all()
>>> SubscriptionPlan::all()

# Clear Laravel cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Check migrations
php artisan migrate:status

# View logs
tail -f storage/logs/laravel.log
```

## 🌐 URL Reference

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:8080 | React application (Vite) |
| Backend API | http://localhost:8000/api | Laravel API |
| Backend Web | http://localhost:8000 | Laravel web routes |
| API Docs | See AUTHENTICATION_SETUP.md | API documentation |

## 🚀 Production Deployment Notes

When deploying to production:

1. **Update Frontend .env**:
   ```
   VITE_API_BASE_URL=https://your-api-domain.com/api
   ```

2. **Update Backend CORS** (`config/cors.php`):
   ```php
   'allowed_origins' => [
       'https://your-frontend-domain.com',
   ],
   ```

3. **Set Secure Sanctum** (`config/sanctum.php`):
   ```php
   'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 
       'your-frontend-domain.com'
   )),
   ```

4. **Environment Variables**:
   - Set `APP_ENV=production`
   - Set `APP_DEBUG=false`
   - Use secure `APP_KEY`
   - Configure production database

5. **HTTPS Required** for production!

---

## ✅ Connection Status

- [x] Backend configured
- [x] Frontend configured
- [x] CORS enabled
- [x] API client ready
- [x] Auth context ready
- [x] Test user created

**Ready to start both servers and test!** 🎉

