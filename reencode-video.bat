@echo off
REM Re-encode video with browser-compatible codecs (H.264 + AAC)
REM This will create a new file with _web suffix

set INPUT=storage\app\public\data_section\movie\73bde1cb-16b5-4b6b-bd3b-246e95f00f72.mp4
set OUTPUT=storage\app\public\data_section\movie\73bde1cb-16b5-4b6b-bd3b-246e95f00f72_web.mp4

echo Re-encoding video for web compatibility...
echo.
echo Input: %INPUT%
echo Output: %OUTPUT%
echo.

REM Check if ffmpeg is installed
where ffmpeg >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: ffmpeg is not installed or not in PATH
    echo.
    echo Please install ffmpeg from: https://ffmpeg.org/download.html
    echo Or use chocolatey: choco install ffmpeg
    pause
    exit /b 1
)

REM Re-encode with H.264 video + AAC audio
ffmpeg -i "%INPUT%" ^
    -c:v libx264 ^
    -preset medium ^
    -crf 23 ^
    -c:a aac ^
    -b:a 128k ^
    -movflags +faststart ^
    "%OUTPUT%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Re-encoding successful!
    echo.
    echo New file: %OUTPUT%
    echo.
    echo To use this file, update the database:
    echo UPDATE videos SET video_file_path = 'data_section/movie/73bde1cb-16b5-4b6b-bd3b-246e95f00f72_web.mp4' WHERE id = 18;
) else (
    echo.
    echo ❌ Re-encoding failed!
)

pause

