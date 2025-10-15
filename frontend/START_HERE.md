# 🚀 Quick Start Guide - SACRART Frontend

## ✅ Configuration Status

All critical issues have been fixed:
- ✅ Environment variables configured (`.env` file)
- ✅ Service worker registration fixed (production only)
- ✅ Asset paths corrected (favicon, logos)
- ✅ Error boundary added (better error handling)
- ✅ API configuration set up

---

## 📋 Prerequisites

1. **Node.js** installed (v18 or higher recommended)
2. **npm** or **bun** package manager
3. **Laravel Backend** running on `http://localhost:8000`

---

## 🏃 How to Start

### Option 1: Quick Start (Recommended for Windows)
```bash
# From the laravel root directory
.\start-frontend.bat
```

### Option 2: Manual Start
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

### Option 3: Using Bun (faster)
```bash
cd frontend
bun install
bun run dev
```

---

## 🌐 Access the Application

Once started, open your browser and navigate to:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api

---

## 🔍 Verify Everything Works

### 1. Check Browser Console (F12)
You should see:
```
⭐⭐ API FILE LOADED - NEW CODE IS RUNNING! ⭐⭐
API Base URL: http://localhost:8000/api
Current time: [timestamp]
```

### 2. Visual Checks
- ✅ SACRART logo visible in header
- ✅ Favicon appears in browser tab
- ✅ Hero section with "Learn Anytime, Anywhere with Ana"
- ✅ Course rows visible (Popular, Trending, New Releases)
- ✅ Sign In / Get Started buttons functional

### 3. No Errors
- ❌ No red errors in console
- ❌ No blank white page
- ❌ No "Service Worker" errors

---

## 🛠️ Troubleshooting

### Issue: Blank Page
**Solution:**
1. Hard reload: `Ctrl + Shift + R`
2. Clear browser cache
3. Check browser console for errors
4. Verify `.env` file exists in `frontend/` folder

### Issue: "Failed to fetch" or API errors
**Solution:**
1. Ensure Laravel backend is running:
   ```bash
   # In laravel root directory
   php artisan serve
   ```
2. Check CORS configuration in `config/cors.php`
3. Verify API URL in `.env` is correct

### Issue: Service Worker Errors
**Solution:**
1. Open DevTools (F12)
2. Go to Application → Service Workers
3. Unregister any old service workers
4. Refresh the page

### Issue: Port Already in Use (3000)
**Solution:**
```bash
# Kill process using port 3000
npx kill-port 3000

# Or change port in vite.config.ts
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (API URL, app config) |
| `vite.config.ts` | Vite configuration (port, plugins) |
| `src/main.tsx` | App entry point (fixed service worker) |
| `src/App.tsx` | Main app component (with error boundary) |
| `src/lib/api.ts` | API client configuration |
| `index.html` | HTML entry point (fixed asset paths) |

---

## 🔐 Environment Variables

Edit `frontend/.env` to customize:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api

# App Configuration
VITE_APP_NAME=SACRART
VITE_APP_ENV=development
```

**Note:** Restart dev server after changing `.env`

---

## 🧪 Testing Features

### Test User Registration
1. Click "Get Started" or "Sign In"
2. Fill in registration form
3. Select subscription type
4. Submit and verify redirect to dashboard

### Test User Login
1. Go to `/auth` route
2. Enter credentials
3. Check authentication state
4. Verify token stored in localStorage

### Test Protected Routes
1. Try accessing `/dashboard` without login
2. Should redirect to `/auth`
3. Login and access should be granted

---

## 📦 Build for Production

```bash
cd frontend
npm run build
```

Output will be in `frontend/dist/` folder

### Preview Production Build
```bash
npm run preview
```

---

## 🎨 Tech Stack

- **Framework:** React 18.3 + TypeScript
- **Build Tool:** Vite 5.4
- **Router:** React Router v6
- **State:** TanStack Query + Context API
- **UI:** Radix UI + TailwindCSS + shadcn/ui
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod

---

## 📝 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🐛 Debug Mode

To see detailed API logs, check browser console for:
- `🚀 API LOGIN CALLED` - Login attempts
- `=== API: Register Request ===` - Registration
- `🔑 AuthContext:` - Auth state changes

---

## 🔄 What Was Fixed

### Before (Issues):
❌ No `.env` file → API URL not configured  
❌ Service worker failing → Blank page  
❌ Wrong asset paths → Icons not loading  
❌ No error handling → Silent failures  

### After (Fixed):
✅ `.env` configured with API URL  
✅ Service worker only in production  
✅ Assets in public folder + correct paths  
✅ Error boundary catches rendering errors  

---

## 📚 Documentation

For more details, see:
- `FRONTEND_CONFIGURATION_FIXES.md` - Detailed fix documentation
- `FRONTEND_BACKEND_CONNECTION.md` - API integration guide
- `AUTHENTICATION_SETUP.md` - Auth system docs

---

## ✨ Success Indicators

When everything is working correctly:
1. ✅ Dev server starts without errors
2. ✅ Page loads showing SACRART homepage
3. ✅ No console errors (red messages)
4. ✅ Can click "Sign In" and see auth page
5. ✅ API URL logged in console

---

## 🆘 Still Having Issues?

1. **Check this first:**
   - Is `.env` file present in `frontend/` folder?
   - Is Laravel backend running on port 8000?
   - Any red errors in browser console?

2. **Try these steps:**
   ```bash
   # Clean install
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

3. **Nuclear option (fresh start):**
   ```bash
   # Clear everything
   rm -rf node_modules dist .vite
   npm cache clean --force
   npm install
   npm run dev
   ```

---

**Last Updated:** October 10, 2025  
**Status:** ✅ Ready to Use  
**Next Step:** Run `npm run dev` and open http://localhost:3000

