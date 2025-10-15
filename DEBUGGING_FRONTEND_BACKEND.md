# Frontend-Backend Debugging Guide

## 🔍 Step-by-Step Testing

### Step 1: Verify Backend is Running

Open a terminal and run:
```bash
cd h:/Workana_Git/laravel
php artisan serve
```

You should see:
```
Starting Laravel development server: http://127.0.0.1:8000
```

**Test the API directly:**
In a new PowerShell terminal:
```powershell
$body = '{"email":"admin@ana.com","password":"password"}'
Invoke-WebRequest -Uri "http://localhost:8000/api/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing | Select-Object StatusCode, Content
```

Expected: Status 200 with JSON response containing user and token

### Step 2: Verify Frontend Environment

Check if `.env` file exists:
```bash
cd h:/Workana_Git/laravel/frontend
Get-Content .env
```

Should show:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

### Step 3: Restart Frontend Dev Server

**IMPORTANT**: Stop and restart to load .env file:
```bash
cd h:/Workana_Git/laravel/frontend
# Press Ctrl+C to stop if running
npm run dev
```

### Step 4: Test in Browser

1. **Open Browser**: Go to `http://localhost:8080`
2. **Open DevTools**: Press `F12` to open browser console
3. **Go to Auth Page**: Navigate to `http://localhost:8080/auth`

#### What You Should See in Console:

```
API Base URL: http://localhost:8000/api
```

If you DON'T see this, the .env file is not loaded. Restart frontend!

### Step 5: Try to Login

Fill in the login form:
- Email: `admin@ana.com`
- Password: `password`
- Click "Sign In"

#### Expected Console Output:

```
=== Form submitted ===
Is Login: true
Email: admin@ana.com
Calling login function...
Attempting login to: http://localhost:8000/api/login
Login data: { email: "admin@ana.com" }
Login response status: 200
Login successful!
Form submission complete
```

## 🚨 Common Issues and Solutions

### Issue 1: "API Base URL: undefined" in Console

**Problem**: .env file not loaded
**Solution**: 
1. Check `.env` file exists in `frontend/` folder
2. Restart frontend dev server (`Ctrl+C` then `npm run dev`)
3. Hard refresh browser (`Ctrl+Shift+R`)

### Issue 2: CORS Error

**Console Error**: 
```
Access to fetch at 'http://localhost:8000/api/login' from origin 'http://localhost:8080' 
has been blocked by CORS policy
```

**Solution**:
```bash
cd h:/Workana_Git/laravel
php artisan config:clear
# Restart Laravel server (Ctrl+C then php artisan serve)
```

### Issue 3: 500 Internal Server Error

**Problem**: Backend error
**Solution**: Check Laravel logs:
```bash
cd h:/Workana_Git/laravel
Get-Content storage/logs/laravel.log -Tail 50
```

Most common cause: Missing `HasApiTokens` trait in User model (already fixed)

### Issue 4: Network Error / Failed to Fetch

**Problem**: Backend not running or wrong URL
**Solution**:
1. Verify backend is running on port 8000
2. Test backend directly (see Step 1)
3. Check `.env` has correct URL

### Issue 5: No Console Logs Appearing

**Problem**: Old code cached in browser
**Solution**:
1. Hard refresh: `Ctrl+Shift+R`
2. Clear cache: `Ctrl+Shift+Delete`
3. Restart dev server

### Issue 6: "useAuth must be used within AuthProvider"

**Problem**: AuthProvider not wrapping App
**Solution**: Already fixed in App.tsx - just restart frontend

## 🧪 Manual API Test (Without Frontend)

Test backend API directly in browser console:

1. Open `http://localhost:8080` (or any page)
2. Press F12
3. Go to Console tab
4. Paste this:

```javascript
// Test API connection
fetch('http://localhost:8000/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@ana.com',
    password: 'password'
  })
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response:', data);
  if (data.token) {
    console.log('✅ Login successful! Token:', data.token);
    localStorage.setItem('auth_token', data.token);
  }
})
.catch(error => {
  console.error('❌ Error:', error);
});
```

**Expected Output:**
```
Status: 200
Response: {
  user: { id: 1, name: "Admin Ana", email: "admin@ana.com", ... },
  token: "1|xxxxx",
  message: "Login successful"
}
✅ Login successful! Token: 1|xxxxx
```

## 📋 Complete Checklist

Before testing, verify:

- [ ] Backend running: `php artisan serve` (Terminal 1)
- [ ] Backend restarted after User model changes
- [ ] Frontend `.env` exists with correct API URL
- [ ] Frontend running: `npm run dev` (Terminal 2)
- [ ] Frontend restarted after creating .env
- [ ] Browser console open (F12)
- [ ] Browser cache cleared (Ctrl+Shift+R)

## 🎯 What Should Happen

### Successful Login Flow:

1. **Form Submit** → Console: "Form submitted"
2. **Call API** → Console: "Attempting login to..."
3. **API Response** → Console: "Login response status: 200"
4. **Success** → Toast notification appears
5. **Redirect** → Navigates to `/dashboard`

### If Login Fails:

1. **Error appears** → Console shows error details
2. **Toast notification** → Shows error message
3. **Stay on page** → Remains at `/auth`

## 🔧 Quick Fixes

### Reset Everything:

```bash
# Stop all servers (Ctrl+C in both terminals)

# Backend
cd h:/Workana_Git/laravel
php artisan config:clear
php artisan cache:clear
php artisan serve

# Frontend (new terminal)
cd h:/Workana_Git/laravel/frontend
# Delete node_modules/.vite if exists
npm run dev
```

### Create Fresh .env:

```bash
cd h:/Workana_Git/laravel/frontend
"VITE_API_BASE_URL=http://localhost:8000/api" | Out-File -FilePath .env -Encoding utf8 -Force
```

## 📞 Still Not Working?

If after following all steps it still doesn't work, check:

1. **What do you see in console?** (Share the exact error)
2. **What is the API Base URL logged?** (Should be http://localhost:8000/api)
3. **What happens when you click Sign In?** (Any logs? Any errors?)
4. **Did you restart BOTH servers?** (Backend AND Frontend)

## ✅ Success Indicators

You'll know it's working when:
- ✅ Console shows "API Base URL: http://localhost:8000/api" on page load
- ✅ Console shows login attempt when clicking Sign In
- ✅ Console shows "Login response status: 200"
- ✅ Toast notification "Login successful!" appears
- ✅ Page redirects to `/dashboard`
- ✅ Dashboard shows your user information

---

**Follow these steps in order and check the console at each step!** 🚀

