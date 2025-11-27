# Bunny.net Video Migration Guide

This document describes the migration from self-hosted video storage to Bunny.net video hosting.

## Overview

All videos are now stored and served through Bunny.net instead of local storage. This provides:
- Better performance and global CDN delivery
- Automatic video transcoding and optimization
- Reduced server storage and bandwidth costs
- Professional video player with built-in controls

## Configuration

Add the following environment variables to your `.env` file:

```env
BUNNY_API_KEY=your_bunny_api_key
BUNNY_LIBRARY_ID=your_library_id
BUNNY_CDN_URL=your_cdn_url.b-cdn.net
BUNNY_STREAM_URL=your_stream_url.b-cdn.net
```

### Getting Your Bunny.net Credentials

1. **API Key**: 
   - Log into your Bunny.net account
   - Go to Account → API Keys
   - Copy your API key

2. **Library ID**:
   - Go to Video Library
   - Select your library
   - The Library ID is in the URL or library settings

3. **CDN URL**:
   - Found in your Video Library settings
   - Format: `xxxxx.b-cdn.net`

4. **Stream URL**:
   - Found in your Video Library settings
   - Format: `xxxxx.b-cdn.net` (usually same as CDN URL)

## Database Migration

Run the migration to add Bunny.net fields to the videos table:

```bash
php artisan migrate
```

This adds the following fields:
- `bunny_video_id` - Bunny.net video identifier
- `bunny_video_url` - Direct video streaming URL
- `bunny_embed_url` - Embed URL for Bunny.net player
- `bunny_thumbnail_url` - Thumbnail image URL

## Video Upload Process

When uploading a video through the admin panel:

1. The video file is uploaded directly to Bunny.net
2. Bunny.net processes and transcodes the video
3. The system stores the Bunny.net video ID and URLs
4. Videos are served through Bunny.net's CDN

## Video Playback

Videos are now played using Bunny.net's embedded player (iframe) instead of HTML5 video element. This provides:
- Better compatibility across devices
- Automatic quality adjustment
- Built-in analytics
- Professional player controls

## Backward Compatibility

The system maintains backward compatibility with:
- Existing videos with `video_file_path` (local storage)
- Direct `video_url` links
- Legacy video streaming endpoint

New videos will use Bunny.net, while old videos continue to work until migrated.

## Migrating Existing Videos

To migrate existing videos to Bunny.net:

1. Export videos from local storage
2. Re-upload them through the admin panel
3. The system will automatically upload to Bunny.net

Or create a migration script to:
1. Read existing video files
2. Upload to Bunny.net using `BunnyNetService`
3. Update video records with Bunny.net IDs

## API Changes

### Video Model

The `Video` model now includes:
- `bunny_video_id` - Bunny.net video ID
- `bunny_video_url` - Direct streaming URL
- `bunny_embed_url` - Player embed URL
- `bunny_player_url` - Alias for embed URL (for frontend)

### VideoController

- `store()` - Uploads videos to Bunny.net
- `update()` - Updates videos in Bunny.net
- `destroy()` - Deletes videos from Bunny.net
- `stream()` - Redirects to Bunny.net URLs

### BunnyNetService

Service methods:
- `uploadVideo()` - Upload video file to Bunny.net
- `createVideo()` - Create video entry in Bunny.net
- `getVideo()` - Get video details from Bunny.net
- `deleteVideo()` - Delete video from Bunny.net
- `getVideoUrl()` - Get streaming URL
- `getEmbedUrl()` - Get embed URL for player

## Frontend Changes

The `VideoPlayer` component now:
- Uses Bunny.net iframe player when `bunny_embed_url` is available
- Falls back to HTML5 video for legacy videos
- Automatically handles video progress tracking

## Troubleshooting

### Upload Failures

- Check API key and library ID are correct
- Verify file size limits (Bunny.net has upload limits)
- Check network connectivity to Bunny.net
- Review Laravel logs for detailed error messages

### Playback Issues

- Ensure Bunny.net video is fully processed (check processing status)
- Verify CDN URL is correct
- Check browser console for iframe loading errors
- Ensure CORS settings allow embedding

### Migration Issues

- Old videos with local paths will continue to work
- Gradually migrate videos as needed
- Keep local storage until all videos are migrated

## Support

For Bunny.net specific issues:
- Bunny.net Documentation: https://docs.bunny.net/
- Bunny.net Support: https://bunny.net/support/

For application issues:
- Check Laravel logs: `storage/logs/laravel.log`
- Review video processing status in database
- Verify environment configuration
