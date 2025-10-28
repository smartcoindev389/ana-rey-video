# Video Streaming Architecture & Flow

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Complete Flow Diagram](#complete-flow-diagram)
3. [Frontend Components](#frontend-components)
4. [Backend Components](#backend-components)
5. [Data Flow](#data-flow)
6. [Progress Tracking](#progress-tracking)
7. [Authentication & Authorization](#authentication--authorization)
8. [Key Files](#key-files)

---

## System Overview

This project implements a **video streaming platform** with the following key features:
- HTML5-based video playback
- HTTP Range request support for seeking/buffering
- User progress tracking (watch time, completion, favorites)
- Subscription-based access control
- Real-time progress updates

**Technology Stack:**
- **Frontend**: React + TypeScript + Vite
- **Backend**: Laravel 10 (PHP)
- **Video Delivery**: Direct file streaming with Range request support
- **Authentication**: Laravel Sanctum (token-based)

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER CLICKS VIDEO                            │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: FETCH VIDEO DATA                                            │
│                                                                      │
│ Frontend (VideoPlayer.tsx)                                          │
│   ├─ useEffect(() => fetchVideoData())                             │
│   ├─ GET /api/videos/{id}                                          │
│   └─ Headers: Authorization: Bearer {token}                        │
│                                                                      │
│ Backend (VideoController::show)                                     │
│   ├─ Authenticate user via Sanctum                                 │
│   ├─ Load video with relationships                                 │
│   ├─ Check access permissions (subscription/visibility)            │
│   ├─ Load existing user progress                                   │
│   ├─ Increment view count                                          │
│   └─ Return JSON response:                                         │
│       {                                                              │
│         success: true,                                              │
│         data: {                                                      │
│           video: {..., video_url_full: "http://...stream"},        │
│           user_progress: {...},                                     │
│           next_video: {...},                                        │
│           previous_video: {...}                                     │
│         }                                                            │
│       }                                                              │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: RENDER VIDEO PLAYER                                         │
│                                                                      │
│ Frontend State Update                                               │
│   ├─ setVideo(videoData)                                           │
│   ├─ setUserProgress(existingProgress)                             │
│   ├─ setProgress(existingProgress.progress_percentage || 0)        │
│   └─ setIsFavorite(existingProgress.is_favorite || false)          │
│                                                                      │
│ Video Element Creation                                              │
│   <video                                                             │
│     ref={videoRef}                                                   │
│     src={video.video_url_full} ← http://localhost:8000/api/videos/18/stream
│     controls                                                         │
│     crossOrigin="use-credentials"                                   │
│     onTimeUpdate={(e) => setCurrentTime(e.currentTime)}            │
│     onLoadedMetadata={(e) => setDuration(e.duration)}              │
│     onPlay={() => setIsPlaying(true)}                              │
│     onPause={() => setIsPlaying(false)}                            │
│   />                                                                 │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: INITIAL VIDEO STREAM REQUEST                                │
│                                                                      │
│ Browser (HTML5 Video Element)                                       │
│   ├─ GET http://localhost:8000/api/videos/18/stream                │
│   ├─ Method: GET                                                    │
│   ├─ Headers:                                                       │
│   │   ├─ Authorization: Bearer {token}                             │
│   │   └─ (No Range header on initial request)                      │
│   └─ Credentials: include (due to crossOrigin="use-credentials")   │
│                                                                      │
│ Backend (VideoController::stream)                                   │
│   ├─ Check authentication (optional, depends on video visibility)  │
│   ├─ Check video access permissions:                               │
│   │   ├─ Admin: full access                                        │
│   │   ├─ Freemium videos: public access                            │
│   │   ├─ Basic videos: basic/premium/admin subscription            │
│   │   └─ Premium videos: premium/admin subscription                │
│   ├─ Locate video file: storage/app/public/{video_file_path}      │
│   ├─ Get file info:                                                 │
│   │   ├─ File size: 26,786,172 bytes                               │
│   │   └─ MIME type: video/mp4                                      │
│   ├─ Prepare headers:                                               │
│   │   ├─ Content-Type: video/mp4                                   │
│   │   ├─ Content-Length: 26786172                                  │
│   │   ├─ Accept-Ranges: bytes ← CRITICAL for seeking              │
│   │   ├─ Cache-Control: public, max-age=31536000                  │
│   │   └─ CORS headers: Access-Control-Allow-Origin: *             │
│   └─ Stream entire file:                                            │
│       ├─ Status: 200 OK                                             │
│       └─ fpassthru($fileHandle) → stream all bytes                 │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: USER WATCHES & SEEKS (Range Requests)                       │
│                                                                      │
│ Browser Actions                                                      │
│   ├─ User seeks to 30 seconds                                      │
│   ├─ Browser buffers ahead                                          │
│   └─ User drags seek bar                                            │
│                                                                      │
│ Range Request Example                                                │
│   ├─ GET http://localhost:8000/api/videos/18/stream                │
│   ├─ Headers:                                                       │
│   │   ├─ Range: bytes=5000000-10000000                             │
│   │   └─ Authorization: Bearer {token}                             │
│   └─ Request specific byte range (5MB-10MB)                        │
│                                                                      │
│ Backend (VideoController::stream)                                   │
│   ├─ Detect Range header: if ($request->header('Range'))           │
│   ├─ Parse range: "bytes=5000000-10000000"                         │
│   │   ├─ Start: 5,000,000                                          │
│   │   └─ End: 10,000,000                                           │
│   ├─ Calculate chunk length: 5,000,001 bytes                       │
│   ├─ Prepare partial response headers:                             │
│   │   ├─ Content-Range: bytes 5000000-10000000/26786172           │
│   │   ├─ Content-Length: 5000001                                  │
│   │   └─ Accept-Ranges: bytes                                      │
│   └─ Stream partial file:                                           │
│       ├─ Status: 206 Partial Content                               │
│       ├─ fseek($handle, 5000000) → seek to start position         │
│       └─ fread($handle, 5000001) → read chunk                     │
│                                                                      │
│ Why Range Requests Are Critical:                                    │
│   ✅ Enable video seeking (jump to any timestamp)                  │
│   ✅ Enable buffering (download future segments)                   │
│   ✅ Enable resume after pause/network interruption                │
│   ✅ Reduce bandwidth (only fetch needed portions)                 │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 5: PROGRESS TRACKING (Auto-save every 5 seconds)              │
│                                                                      │
│ Frontend (VideoPlayer.tsx)                                          │
│   ├─ useEffect with setInterval:                                   │
│   │   └─ Every 5 seconds while playing:                            │
│   │       if (isPlaying && currentTime > 0) {                       │
│   │         saveProgress();                                         │
│   │       }                                                          │
│   │                                                                  │
│   ├─ saveProgress() function:                                       │
│   │   ├─ Calculate progress: (currentTime / duration) * 100        │
│   │   ├─ PUT /api/progress/video/{id}                             │
│   │   └─ Body: {                                                    │
│   │       time_watched: currentTime (e.g., 45 seconds),            │
│   │       video_duration: duration (e.g., 110 seconds),            │
│   │       progress_percentage: 40.8,                               │
│   │       is_completed: false                                       │
│   │     }                                                            │
│   │                                                                  │
│   └─ Also save on:                                                  │
│       ├─ User clicks pause                                          │
│       ├─ User closes page (beforeunload event)                     │
│       └─ Video ends (onEnded event)                                │
│                                                                      │
│ Backend (UserProgressController::updateVideoProgress)               │
│   ├─ Authenticate user                                              │
│   ├─ Validate request data                                          │
│   ├─ Check video access permissions                                 │
│   └─ Call UserProgress::updateVideoProgress($user, $video, ...)   │
│                                                                      │
│ UserProgress Model (updateVideoProgress method)                     │
│   ├─ Find or create progress record:                               │
│   │   UserProgress::where('user_id', $user->id)                    │
│   │                ->where('video_id', $video->id)                 │
│   │                ->first()                                        │
│   │                                                                  │
│   ├─ Calculate completion:                                          │
│   │   $progressPercentage = ($timeWatched / $videoDuration) * 100  │
│   │   $isCompleted = $progressPercentage >= 90 ? true : false     │
│   │                                                                  │
│   ├─ Update existing record:                                        │
│   │   $progress->update([                                           │
│   │     'time_watched' => max($existing, $new),  ← Keep highest   │
│   │     'progress_percentage' => $calculatedPercentage,            │
│   │     'is_completed' => $isCompleted,                            │
│   │     'last_watched_at' => now(),                                │
│   │     'completed_at' => $isCompleted ? now() : null,            │
│   │     'watch_count' => increment by 1                            │
│   │   ])                                                            │
│   │                                                                  │
│   └─ Update category/series progress:                              │
│       ├─ Find all videos in category                               │
│       ├─ Calculate category progress percentage                    │
│       └─ Update or create category progress record                 │
│                                                                      │
│ Response to Frontend:                                                │
│   {                                                                  │
│     success: true,                                                  │
│     message: "Progress updated successfully",                       │
│     data: {                                                          │
│       time_watched: 45,                                             │
│       progress_percentage: 40.8,                                    │
│       is_completed: false,                                          │
│       last_watched_at: "2025-10-28T20:45:30"                       │
│     }                                                                │
│   }                                                                  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 6: USER INTERACTIONS                                           │
│                                                                      │
│ Favorite Toggle                                                      │
│   ├─ User clicks heart icon                                         │
│   ├─ POST /api/progress/video/{id}/favorite                        │
│   ├─ Backend toggles is_favorite flag                              │
│   └─ Updates favorited_at timestamp                                │
│                                                                      │
│ Rating                                                               │
│   ├─ User submits rating (1-5 stars)                               │
│   ├─ POST /api/progress/video/{id}/rate                           │
│   ├─ Body: { rating: 5, review: "Great video!" }                  │
│   ├─ Backend saves to user_progress                                │
│   └─ Recalculates video's average rating                           │
│                                                                      │
│ Video Completion                                                     │
│   ├─ Progress reaches ≥90%                                         │
│   ├─ is_completed set to true                                      │
│   ├─ completed_at timestamp saved                                  │
│   └─ Category progress recalculated                                │
└─────────────────────────────────────────────────────────────────────┘

```

---

## Frontend Components

### 1. **VideoPlayer Component** (`frontend/src/pages/VideoPlayer.tsx`)

**Purpose**: Main video playback interface

**Key State Variables**:
```typescript
const [video, setVideo] = useState<any | null>(null);        // Video metadata
const [currentTime, setCurrentTime] = useState(0);           // Current playback position
const [duration, setDuration] = useState(0);                 // Total video duration
const [isPlaying, setIsPlaying] = useState(false);          // Playback state
const [progress, setProgress] = useState(0);                 // Progress percentage
const [userProgress, setUserProgress] = useState<any>(null); // Saved progress
const [isFavorite, setIsFavorite] = useState(false);        // Favorite status
```

**Video Element Configuration**:
```tsx
<video
  ref={videoRef}
  src={video.video_url_full}                    // ← Points to streaming endpoint
  controls                                       // Native browser controls
  crossOrigin="use-credentials"                 // Send auth cookies
  onTimeUpdate={(e) => setCurrentTime(...)}     // Track playback position
  onLoadedMetadata={(e) => setDuration(...)}    // Get video duration
  onPlay={() => setIsPlaying(true)}             // User clicks play
  onPause={() => setIsPlaying(false)}           // User clicks pause
/>
```

**Progress Auto-Save**:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    if (isPlaying && currentTime > 0 && duration > 0) {
      saveProgress();  // Save every 5 seconds
    }
  }, 5000);
  
  return () => clearInterval(interval);
}, [isPlaying, currentTime, duration]);
```

### 2. **Video API Service** (`frontend/src/services/videoApi.ts`)

**Purpose**: API calls for video data

```typescript
export const videoApi = {
  // Get single video with progress
  async get(id: number) {
    const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
      headers: getAuthHeaders(),  // Includes: Authorization: Bearer {token}
    });
    return handleResponse(response);
  }
};
```

### 3. **User Progress API** (`frontend/src/services/userProgressApi.ts`)

**Purpose**: Progress tracking API calls

```typescript
export const userProgressApi = {
  // Update video progress
  async updateVideoProgress(videoId: number, data: UpdateProgressRequest) {
    const response = await fetch(`${API_BASE_URL}/progress/video/${videoId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        time_watched: currentTimeInSeconds,
        video_duration: totalDurationInSeconds,
        progress_percentage: calculatedPercentage,
        is_completed: percentage >= 90
      }),
    });
    return handleResponse(response);
  },
  
  // Toggle favorite
  async toggleFavorite(videoId: number) {
    const response = await fetch(`${API_BASE_URL}/progress/video/${videoId}/favorite`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  }
};
```

---

## Backend Components

### 1. **Video Model** (`app/Models/Video.php`)

**URL Accessor** (generates streaming URL):
```php
public function getVideoUrlFullAttribute(): ?string
{
    if ($this->video_file_path) {
        // Use streaming endpoint for Range request support
        return url("api/videos/{$this->id}/stream");
    }
    return $this->video_url;
}
```

**Access Control**:
```php
public function isAccessibleTo(?User $user = null): bool
{
    // Admin can access everything
    if ($user && $user->role === 'admin') {
        return true;
    }

    // Check visibility
    switch ($this->visibility) {
        case 'freemium':
            return true;  // Public access
        case 'basic':
            return $user && in_array($user->subscription_type, ['basic', 'premium', 'admin']);
        case 'premium':
            return $user && in_array($user->subscription_type, ['premium', 'admin']);
        default:
            return false;
    }
}
```

### 2. **Video Controller** (`app/Http/Controllers/Api/VideoController.php`)

**Show Method** (fetch video data):
```php
public function show(Request $request, Video $video): JsonResponse
{
    $user = Auth::user();

    // Check access
    if (!$video->isAccessibleTo($user)) {
        return response()->json(['success' => false, 'message' => 'No access'], 403);
    }

    // Load relationships
    $video->load(['category', 'instructor']);

    // Get user's progress
    $userProgress = null;
    if ($user) {
        $userProgress = UserProgress::where('user_id', $user->id)
            ->where('video_id', $video->id)
            ->first();
    }

    // Increment view count
    $video->incrementViews();

    // Find next/previous videos
    $nextVideo = $video->getNextVideo();
    $previousVideo = $video->getPreviousVideo();

    return response()->json([
        'success' => true,
        'data' => [
            'video' => $video,
            'user_progress' => $userProgress,
            'next_video' => $nextVideo,
            'previous_video' => $previousVideo,
        ],
    ]);
}
```

**Stream Method** (serve video with Range support):
```php
public function stream(Request $request, Video $video)
{
    $user = Auth::user();

    // Check access permissions
    if (!$video->isAccessibleTo($user)) {
        return response()->json(['success' => false, 'message' => 'No access'], 403);
    }

    // Get file path
    $path = storage_path('app/public/' . $video->video_file_path);
    
    if (!file_exists($path)) {
        return response()->json(['success' => false, 'message' => 'File not found'], 404);
    }

    $fileSize = filesize($path);
    $mimeType = mime_content_type($path);
    
    // Base headers
    $headers = [
        'Content-Type' => $mimeType,
        'Content-Length' => $fileSize,
        'Accept-Ranges' => 'bytes',  // ← CRITICAL for video seeking
        'Cache-Control' => 'public, max-age=31536000',
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers' => 'Range',
        'Access-Control-Expose-Headers' => 'Content-Length, Content-Range',
    ];

    // Handle Range requests (for seeking)
    if ($request->header('Range')) {
        $range = $request->header('Range');
        $range = str_replace('bytes=', '', $range);
        $rangeParts = explode('-', $range);
        $start = intval($rangeParts[0]);
        $end = isset($rangeParts[1]) && $rangeParts[1] !== '' 
            ? intval($rangeParts[1]) 
            : $fileSize - 1;
        
        $length = $end - $start + 1;
        
        $headers['Content-Range'] = "bytes {$start}-{$end}/{$fileSize}";
        $headers['Content-Length'] = $length;
        
        // Stream partial content (206)
        return response()->stream(function () use ($path, $start, $length) {
            $stream = fopen($path, 'rb');
            fseek($stream, $start);  // Seek to start position
            echo fread($stream, $length);  // Read only requested chunk
            fclose($stream);
        }, 206, $headers);  // ← 206 Partial Content status
    }

    // Stream full file (200)
    return response()->stream(function () use ($path) {
        $stream = fopen($path, 'rb');
        fpassthru($stream);  // Stream entire file
        fclose($stream);
    }, 200, $headers);
}
```

### 3. **UserProgress Model** (`app/Models/UserProgress.php`)

**Update Progress Method**:
```php
public static function updateVideoProgress(User $user, Video $video, int $timeWatched, int $videoDuration): self
{
    // Calculate progress percentage
    $progressPercentage = $videoDuration > 0 
        ? round(($timeWatched / $videoDuration) * 100, 2) 
        : 0;

    // Consider completed if ≥90%
    $isCompleted = $progressPercentage >= 90;

    // Find existing progress
    $progress = self::where('user_id', $user->id)
        ->where('video_id', $video->id)
        ->first();

    if ($progress) {
        // Update existing record
        $progress->update([
            'time_watched' => max($progress->time_watched, $timeWatched),  // Keep highest
            'progress_percentage' => $progressPercentage,
            'is_completed' => $progress->is_completed || $isCompleted,
            'last_watched_at' => now(),
            'completed_at' => $isCompleted && !$progress->completed_at ? now() : $progress->completed_at,
        ]);
        
        // Increment watch count
        $progress->increment('watch_count');
    } else {
        // Create new progress record
        $progress = self::create([
            'user_id' => $user->id,
            'series_id' => $video->series_id,
            'video_id' => $video->id,
            'time_watched' => $timeWatched,
            'progress_percentage' => $progressPercentage,
            'is_completed' => $isCompleted,
            'watch_count' => 1,
            'first_watched_at' => now(),
            'last_watched_at' => now(),
            'completed_at' => $isCompleted ? now() : null,
        ]);
    }

    // Update series/category progress
    if ($video->series_id) {
        self::updateSeriesProgress($user, $video->series_id);
    }

    return $progress;
}
```

### 4. **User Progress Controller** (`app/Http/Controllers/Api/UserProgressController.php`)

**Update Video Progress Endpoint**:
```php
public function updateVideoProgress(Request $request, Video $video): JsonResponse
{
    $user = Auth::user();

    // Check access
    if (!$video->isAccessibleTo($user)) {
        return response()->json(['success' => false, 'message' => 'No access'], 403);
    }

    // Validate
    $validated = $request->validate([
        'time_watched' => 'required|integer|min:0',
        'video_duration' => 'required|integer|min:1',
        'progress_percentage' => 'nullable|integer|min:0|max:100',
        'is_completed' => 'nullable|boolean',
    ]);

    $timeWatched = $validated['time_watched'];
    $videoDuration = $validated['video_duration'];

    // Update progress
    $progress = UserProgress::updateVideoProgress($user, $video, $timeWatched, $videoDuration);

    return response()->json([
        'success' => true,
        'message' => 'Progress updated successfully.',
        'data' => $progress,
    ]);
}
```

---

## Data Flow

### Video Loading Flow
```
User navigates to /video/18
  ↓
VideoPlayer component mounts
  ↓
useEffect() triggers fetchVideoData()
  ↓
GET /api/videos/18 (with auth token)
  ↓
Backend: VideoController::show()
  ├─ Authenticate user
  ├─ Check permissions
  ├─ Load video + relationships
  ├─ Fetch user progress
  ├─ Increment views
  └─ Return complete data
  ↓
Frontend receives response
  ↓
setVideo(videoData)
setUserProgress(existingProgress)
  ↓
<video> element renders with src={video.video_url_full}
  ↓
Browser requests: GET /api/videos/18/stream
  ↓
Backend: VideoController::stream()
  ├─ Check permissions
  ├─ Locate file
  ├─ Set Range headers
  └─ Stream file (200 or 206)
  ↓
Video plays in browser
```

### Progress Update Flow
```
Video playing
  ↓
Every 5 seconds:
  ├─ currentTime updated by onTimeUpdate
  ├─ Calculate: (currentTime / duration) * 100
  └─ Call saveProgress()
  ↓
PUT /api/progress/video/18
Body: {
  time_watched: 45,
  video_duration: 110,
  progress_percentage: 40.8,
  is_completed: false
}
  ↓
Backend: UserProgressController::updateVideoProgress()
  ├─ Validate data
  ├─ Call UserProgress::updateVideoProgress()
  │   ├─ Find/create progress record
  │   ├─ Update fields
  │   ├─ Mark completed if ≥90%
  │   └─ Update category progress
  └─ Return updated progress
  ↓
Frontend receives confirmation
  ↓
UI reflects updated progress
```

---

## Progress Tracking

### What's Tracked
- **time_watched**: Total seconds watched (e.g., 45 seconds)
- **progress_percentage**: Completion percentage (e.g., 40.8%)
- **is_completed**: Auto-set to `true` when ≥90%
- **watch_count**: Number of times user started watching
- **first_watched_at**: First view timestamp
- **last_watched_at**: Most recent view timestamp
- **completed_at**: When user reached 90%+
- **is_favorite**: User marked as favorite
- **rating**: User's rating (1-5 stars)
- **review**: User's text review

### Progress Calculation
```php
$progressPercentage = ($timeWatched / $videoDuration) * 100;
// Example: (45 / 110) * 100 = 40.9%

$isCompleted = $progressPercentage >= 90;
// Completion threshold: 90% (configurable)
```

### Auto-Save Triggers
1. **Every 5 seconds** while playing
2. **On pause** event
3. **On video end** event
4. **On page unload** (beforeunload event)

---

## Authentication & Authorization

### Authentication Methods
1. **Laravel Sanctum**: Token-based authentication
2. **Storage**: Token stored in `localStorage.getItem('auth_token')`
3. **Header**: `Authorization: Bearer {token}`

### Authorization Levels

| Visibility | Who Can Access |
|------------|----------------|
| `freemium` | Everyone (including guests) |
| `basic` | Users with basic, premium, or admin subscription |
| `premium` | Users with premium or admin subscription |
| N/A | Admins (`role === 'admin'`) have access to ALL content |

### Permission Check Flow
```php
// In Video model
public function isAccessibleTo(?User $user = null): bool
{
    // Admin override
    if ($user && $user->role === 'admin') {
        return true;
    }

    // Check visibility vs subscription
    switch ($this->visibility) {
        case 'freemium':
            return true;
        case 'basic':
            return $user && in_array($user->subscription_type, ['basic', 'premium', 'admin']);
        case 'premium':
            return $user && in_array($user->subscription_type, ['premium', 'admin']);
        default:
            return false;
    }
}
```

---

## Key Files

### Frontend
| File | Purpose |
|------|---------|
| `frontend/src/pages/VideoPlayer.tsx` | Main video player component |
| `frontend/src/services/videoApi.ts` | Video API calls |
| `frontend/src/services/userProgressApi.ts` | Progress tracking API |
| `frontend/src/contexts/AuthContext.tsx` | Authentication context |

### Backend
| File | Purpose |
|------|---------|
| `app/Http/Controllers/Api/VideoController.php` | Video CRUD + streaming |
| `app/Http/Controllers/Api/UserProgressController.php` | Progress tracking |
| `app/Models/Video.php` | Video model + accessors |
| `app/Models/UserProgress.php` | Progress model + logic |
| `app/Models/User.php` | User model + authentication |
| `routes/api.php` | API route definitions |

### Database Tables
| Table | Purpose |
|-------|---------|
| `videos` | Video metadata, URLs, visibility |
| `user_progress` | Watch history, progress, favorites |
| `users` | User accounts, subscriptions, roles |
| `categories` | Video categories/series |

---

## Summary

This video streaming system uses:

1. **HTML5 Video** with native controls for playback
2. **HTTP Range Requests** (206 Partial Content) for seeking and buffering
3. **Laravel Streaming** endpoint that serves video files in chunks
4. **Real-time Progress Tracking** with auto-save every 5 seconds
5. **Subscription-based Access Control** with admin override
6. **Token-based Authentication** via Laravel Sanctum

The architecture ensures:
- ✅ Efficient video delivery with Range request support
- ✅ Accurate progress tracking across sessions
- ✅ Secure access control based on subscriptions
- ✅ Smooth user experience with native browser controls
- ✅ Scalable design supporting thousands of videos

