<?php

return [
    /*
    |--------------------------------------------------------------------------
    | FFMpeg Binary Paths
    |--------------------------------------------------------------------------
    |
    | Path to ffmpeg and ffprobe binaries. By default, the system will try
    | to find them in your PATH. If they're installed in a custom location,
    | specify the full path here.
    |
    */

    'ffmpeg_binary' => env('FFMPEG_BINARY', 'ffmpeg'),
    'ffprobe_binary' => env('FFPROBE_BINARY', 'ffprobe'),

    /*
    |--------------------------------------------------------------------------
    | FFMpeg Timeout
    |--------------------------------------------------------------------------
    |
    | Maximum time in seconds that FFMpeg is allowed to run.
    | For large video files, you may need to increase this value.
    |
    */

    'timeout' => env('FFMPEG_TIMEOUT', 3600), // 1 hour

    /*
    |--------------------------------------------------------------------------
    | FFMpeg Threads
    |--------------------------------------------------------------------------
    |
    | Number of threads to use for encoding. Higher values will use more CPU
    | but encode faster. Set to 0 to use all available CPU cores.
    |
    */

    'threads' => env('FFMPEG_THREADS', 12),

    /*
    |--------------------------------------------------------------------------
    | Video Encoding Defaults
    |--------------------------------------------------------------------------
    |
    | Default settings for video re-encoding.
    |
    */

    'encoding' => [
        // Audio bitrate in kilobits per second (128 = good quality)
        'audio_bitrate' => env('FFMPEG_AUDIO_BITRATE', 128),

        // Video quality (CRF: 18-28, lower = better quality, 23 = recommended)
        'video_quality' => env('FFMPEG_VIDEO_QUALITY', 23),

        // Encoding preset (ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)
        // Faster = quicker encoding but larger file size
        'preset' => env('FFMPEG_PRESET', 'faster'),

        // Whether to delete original video after successful re-encoding
        'delete_original' => env('FFMPEG_DELETE_ORIGINAL', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Auto Re-encode on Upload
    |--------------------------------------------------------------------------
    |
    | Automatically re-encode videos with web-compatible codecs when uploaded.
    | This fixes audio codec issues (AC3, DTS, etc.) that prevent playback
    | in web browsers.
    |
    */

    'auto_reencode' => env('FFMPEG_AUTO_REENCODE', true),
];

