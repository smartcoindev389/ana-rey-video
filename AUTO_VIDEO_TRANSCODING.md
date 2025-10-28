# Automatic Video Transcoding with FFMpeg

## 🎯 Overview

Automatic video re-encoding has been integrated into the video upload process to fix audio codec compatibility issues. Videos are now automatically converted to web-compatible formats (H.264 + AAC) when uploaded.

## ✅ What Was Implemented

### 1. **PHP-FFMpeg Library Installed**
```bash
composer require php-ffmpeg/php-ffmpeg
```

### 2. **VideoTranscodingService Created**
**File**: `app/Services/VideoTranscodingService.php`

**Key Methods**:
- `reencodeForWeb()` - Re-encode video with H.264 + AAC
- `reencodeStorageVideo()` - Re-encode from storage path
- `needsReencoding()` - Check if video needs re-encoding
- `getVideoInfo()` - Extract video metadata

**Usage**:
```php
$ffmpeg = FFMpeg\FFMpeg::create();
$video = $ffmpeg->open($path);
$video->save(new FFMpeg\Format\Video\X264('aac', 'libx264'), $outputPath);
```

### 3. **VideoController Updated**
**File**: `app/Http/Controllers/Api/VideoController.php`

**Auto-encoding on upload**:
```php
// After video upload
$reencodeResult = $this->transcodingService->reencodeStorageVideo(
    $originalPath,
    [
        'audio_bitrate' => 128,      // 128kbps AAC audio
        'video_quality' => 23,       // CRF 23 (balanced quality/size)
        'preset' => 'medium',        // Encoding speed
        'delete_original' => true,   // Save storage space
    ]
);
```

### 4. **Configuration File Created**
**File**: `config/ffmpeg.php`

Configurable options:
- FFMpeg binary paths
- Encoding timeout
- Thread count
- Audio bitrate
- Video quality (CRF)
- Encoding preset
- Auto-encode on upload

### 5. **Environment Variables Added**
**File**: `.env.example`

```env
# FFMpeg Configuration
FFMPEG_BINARY=ffmpeg
FFPROBE_BINARY=ffprobe
FFMPEG_TIMEOUT=3600
FFMPEG_THREADS=12

# Video Encoding Settings
FFMPEG_AUDIO_BITRATE=128
FFMPEG_VIDEO_QUALITY=23
FFMPEG_PRESET=medium
FFMPEG_DELETE_ORIGINAL=true
FFMPEG_AUTO_REENCODE=true
```

---

## 📦 Installation Requirements

### 1. **Install FFMpeg on Your System**

**Windows** (via Chocolatey):
```powershell
choco install ffmpeg
```

**Windows** (Manual):
1. Download from: https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to System PATH
4. Restart terminal/IDE

**macOS**:
```bash
brew install ffmpeg
```

**Linux** (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**Linux** (CentOS/RHEL):
```bash
sudo yum install ffmpeg
```

### 2. **Verify Installation**
```bash
ffmpeg -version
ffprobe -version
```

Should show version information without errors.

### 3. **Update .env File**
Copy settings from `.env.example`:
```env
FFMPEG_BINARY=ffmpeg
FFPROBE_BINARY=ffprobe
FFMPEG_AUTO_REENCODE=true
```

---

## 🎬 How It Works

### Upload Flow

```
1. User uploads video → VideoController::store()
   ↓
2. Video saved to storage/app/public/data_section/movie/
   ↓
3. VideoTranscodingService::reencodeStorageVideo()
   ├─ Opens original video file
   ├─ Creates H.264 + AAC format
   ├─ Encodes with settings:
   │  ├─ Audio: AAC @ 128kbps (web-compatible)
   │  ├─ Video: H.264, CRF 23 (balanced quality)
   │  ├─ Preset: medium (balanced speed/quality)
   │  └─ Fast start: enabled (web streaming optimized)
   ├─ Saves as: {original_name}_web.mp4
   └─ Deletes original (if delete_original=true)
   ↓
4. Video record created with re-encoded file path
   ↓
5. User can play video without audio codec errors
```

### Encoding Parameters

| Parameter | Default | Purpose |
|-----------|---------|---------|
| **Video Codec** | H.264 (libx264) | Universal browser support |
| **Audio Codec** | AAC | Universal browser support |
| **Audio Bitrate** | 128 kbps | Good quality, reasonable size |
| **Video Quality (CRF)** | 23 | Balanced quality/size (18=best, 28=smallest) |
| **Preset** | medium | Balanced encoding speed/efficiency |
| **Fast Start** | enabled | Metadata at file start for web streaming |

### File Naming Convention

```
Original: 73bde1cb-16b5-4b6b-bd3b-246e95f00f72.mp4
Re-encoded: 73bde1cb-16b5-4b6b-bd3b-246e95f00f72_web.mp4
```

---

## 🧪 Testing

### 1. **Test Video Upload**

Upload a video with incompatible audio codec (AC3, DTS, E-AC3):

**API Request**:
```bash
POST /api/admin/videos
Content-Type: multipart/form-data

{
  "title": "Test Video",
  "category_id": 1,
  "video_file": [video file with AC3 audio],
  "visibility": "freemium",
  "description": "Test upload"
}
```

**Expected Logs**:
```
Video file upload started
Video file uploaded successfully
Starting video re-encoding for web compatibility
Video re-encoded successfully
  - original_size: 26786172
  - new_size: 24500000
  - size_saved: 2286172
```

### 2. **Verify Re-encoded File**

Check that `_web.mp4` file was created:
```bash
cd storage/app/public/data_section/movie
ls -lh *_web.mp4
```

### 3. **Test Playback**

Navigate to video page in browser:
```
http://localhost:3000/video/{id}
```

**Expected**:
- ✅ Video loads
- ✅ Video plays with audio
- ✅ No "AUDIO_RENDERER_ERROR"
- ✅ Seeking works smoothly

---

## ⚙️ Configuration Options

### Encoding Quality Presets

**High Quality** (larger files, slower encoding):
```env
FFMPEG_VIDEO_QUALITY=18
FFMPEG_PRESET=slow
FFMPEG_AUDIO_BITRATE=192
```

**Balanced** (recommended):
```env
FFMPEG_VIDEO_QUALITY=23
FFMPEG_PRESET=medium
FFMPEG_AUDIO_BITRATE=128
```

**Fast Encoding** (smaller files, faster encoding):
```env
FFMPEG_VIDEO_QUALITY=28
FFMPEG_PRESET=veryfast
FFMPEG_AUDIO_BITRATE=96
```

### Custom FFMpeg Path

If FFMpeg is installed in a custom location:
```env
# Windows
FFMPEG_BINARY=C:\ffmpeg\bin\ffmpeg.exe
FFPROBE_BINARY=C:\ffmpeg\bin\ffprobe.exe

# Linux/Mac
FFMPEG_BINARY=/usr/local/bin/ffmpeg
FFPROBE_BINARY=/usr/local/bin/ffprobe
```

### Disable Auto Re-encoding

To disable automatic re-encoding (not recommended):
```env
FFMPEG_AUTO_REENCODE=false
```

---

## 🐛 Troubleshooting

### Issue: "FFMpeg is not installed"

**Solution**:
1. Install FFMpeg (see Installation Requirements)
2. Verify installation: `ffmpeg -version`
3. Check `.env` has correct binary paths
4. Restart Laravel: `php artisan config:clear`

### Issue: "Re-encoding failed: timeout"

**Solution**:
Increase timeout for large videos:
```env
FFMPEG_TIMEOUT=7200  # 2 hours
```

### Issue: "Re-encoding very slow"

**Solutions**:
1. Use faster preset:
   ```env
   FFMPEG_PRESET=veryfast
   ```

2. Increase thread count:
   ```env
   FFMPEG_THREADS=16  # Match your CPU cores
   ```

3. Use lower quality:
   ```env
   FFMPEG_VIDEO_QUALITY=28
   ```

### Issue: "Original file not deleted"

**Solution**:
Check file permissions:
```bash
# Linux/Mac
chmod -R 775 storage/app/public

# Windows (PowerShell as Admin)
icacls "storage\app\public" /grant Users:F /t
```

### Issue: "Re-encoded file larger than original"

**Solution**:
Adjust encoding settings:
```env
FFMPEG_VIDEO_QUALITY=28  # Higher CRF = smaller file
FFMPEG_PRESET=slow       # Better compression
```

---

## 📊 Performance Impact

### Encoding Time Estimates

| Video Size | Duration | Preset | Approx. Time |
|------------|----------|--------|--------------|
| 100 MB | 5 min | veryfast | 30 sec |
| 100 MB | 5 min | medium | 1-2 min |
| 100 MB | 5 min | slow | 3-4 min |
| 500 MB | 30 min | medium | 8-12 min |
| 1 GB | 60 min | medium | 15-25 min |

*Times vary based on CPU and video complexity*

### File Size Impact

Typical compression results:
- Videos with AC3 audio: **5-15% smaller** after re-encoding
- Videos with multiple audio tracks: **20-30% smaller**
- Already optimized videos: **Similar size** or slightly larger

---

## 🔄 Manual Re-encoding

To manually re-encode existing videos:

### Using Artisan Command (TODO: Create this)
```bash
php artisan video:reencode {video_id}
php artisan video:reencode --all  # Re-encode all videos
```

### Using Tinker
```php
php artisan tinker

$service = app(\App\Services\VideoTranscodingService::class);
$video = \App\Models\Video::find(18);

// Re-encode single video
$result = $service->reencodeStorageVideo(
    $video->video_file_path,
    ['delete_original' => true]
);

dd($result);
```

### Batch Re-encoding Script
```php
// Create: app/Console/Commands/ReencodeVideos.php
// Run: php artisan video:reencode-all
```

---

## 📚 References

- **FFMpeg Documentation**: https://ffmpeg.org/documentation.html
- **PHP-FFMpeg Library**: https://github.com/PHP-FFMpeg/PHP-FFMpeg
- **H.264 Encoding Guide**: https://trac.ffmpeg.org/wiki/Encode/H.264
- **Browser Codec Support**: https://caniuse.com/mpeg4

---

## ✅ Benefits

1. **Universal Browser Support**: H.264 + AAC works in all modern browsers
2. **Automatic Processing**: No manual intervention needed
3. **Storage Savings**: Re-encoded videos often smaller than originals
4. **Better Streaming**: Fast start optimization for web playback
5. **No More Audio Errors**: Fixes AUDIO_RENDERER_ERROR issues

---

## 🎓 Next Steps

1. ✅ Test video upload with current file
2. ✅ Verify re-encoding works
3. ⚠️ Monitor server CPU usage during encoding
4. 📝 Create artisan command for batch re-encoding
5. 📝 Add progress tracking for long encodes
6. 📝 Implement queue-based encoding for production

---

## 🔒 Production Considerations

### Use Queue Workers

For production, move encoding to background queue:

```php
// Dispatch job after upload
ReencodeVideoJob::dispatch($video);

// Process in background
php artisan queue:work
```

### Monitor Disk Space

Re-encoding requires temporary storage (2x video size):
- Monitor available disk space
- Clean up failed encodes
- Set up alerts for low disk space

### Scale Encoding

For high-volume platforms:
- Use dedicated encoding servers
- Implement AWS MediaConvert or similar
- Consider CDN for video delivery

---

**Need Help?** Check Laravel logs: `storage/logs/laravel.log`

