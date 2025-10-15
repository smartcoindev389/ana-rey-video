@echo off
echo ========================================
echo   SACRART Frontend Development Server
echo ========================================
echo.

cd frontend

echo Checking for .env file...
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo Creating .env from .env.example...
    copy .env.example .env
    echo .env file created successfully!
    echo.
)

echo Starting Vite development server...
echo.
echo Server will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

npm run dev

