<?php

namespace App\Services;

use FFMpeg\FFMpeg;
use FFMpeg\Format\Video\X264;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VideoTranscodingService
{
    protected $ffmpeg;

    public function __construct()
    {
        try {
            // Create FFMpeg instance with custom configuration
            $this->ffmpeg = FFMpeg::create([
                'ffmpeg.binaries'  => env('FFMPEG_BINARY', 'ffmpeg'),
                'ffprobe.binaries' => env('FFPROBE_BINARY', 'ffprobe'),
                'timeout'          => 3600, // 1 hour timeout
                'ffmpeg.threads'   => 12,   // Number of threads to use
            ]);
        } catch (\Exception $e) {
            Log::error('FFMpeg initialization failed: ' . $e->getMessage());
            // Do not throw here; allow app to function without transcoding
            $this->ffmpeg = null;
        }
    }

    /**
     * Re-encode video with web-compatible codecs (H.264 + AAC)
     * 
     * @param string $inputPath Full path to input video file
     * @param string|null $outputPath Optional output path, will auto-generate if null
     * @param array $options Encoding options
     * @return array ['success' => bool, 'path' => string, 'message' => string]
     */
    public function reencodeForWeb(string $inputPath, ?string $outputPath = null, array $options = []): array
    {
        try {
            // Prevent PHP max execution time from interrupting long encodes
            @set_time_limit(0);
            // Validate input file exists
            if (!file_exists($inputPath)) {
                throw new \Exception("Input file not found: {$inputPath}");
            }

            // Generate output path if not provided
            if (!$outputPath) {
                $directory = dirname($inputPath);
                $filename = pathinfo($inputPath, PATHINFO_FILENAME);
                $extension = pathinfo($inputPath, PATHINFO_EXTENSION);
                $outputPath = $directory . '/' . $filename . '_web.' . $extension;
            }

            Log::info('Starting video re-encoding', [
                'input' => $inputPath,
                'output' => $outputPath,
                'input_size' => filesize($inputPath),
            ]);

            // If ffmpeg is unavailable, skip transcoding gracefully
            if ($this->ffmpeg === null) {
                return [
                    'success' => false,
                    'path' => null,
                    'message' => 'FFMpeg is not available on this system.',
                ];
            }

            // Open video file
            $video = $this->ffmpeg->open($inputPath);

            // Create format with H.264 video + AAC audio
            // AAC audio codec (universally supported)
            // libx264 video codec (universally supported)
            $format = new X264('aac', 'libx264');
            
            // Set audio bitrate (default: 128k, good quality)
            $audioBitrate = $options['audio_bitrate'] ?? 128;
            $format->setAudioKiloBitrate($audioBitrate);

            // Set video quality (CRF: 18-28, lower = better quality, default: 23)
            $videoQuality = $options['video_quality'] ?? 23;
            $format->setAdditionalParameters(['-crf', $videoQuality]);

            // Enable fast start for web streaming (moves metadata to beginning of file)
            $format->setAdditionalParameters(['-movflags', '+faststart']);

            // Set preset (ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)
            // Faster preset = faster encoding but larger file size
            $preset = $options['preset'] ?? 'medium';
            $format->setAdditionalParameters(['-preset', $preset]);

            // Save re-encoded video
            $video->save($format, $outputPath);

            Log::info('Video re-encoding completed successfully', [
                'output' => $outputPath,
                'output_size' => filesize($outputPath),
                'size_reduction' => filesize($inputPath) - filesize($outputPath),
            ]);

            return [
                'success' => true,
                'path' => $outputPath,
                'original_size' => filesize($inputPath),
                'new_size' => filesize($outputPath),
                'message' => 'Video re-encoded successfully with web-compatible codecs',
            ];

        } catch (\Exception $e) {
            Log::error('Video re-encoding failed', [
                'input' => $inputPath,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'path' => null,
                'message' => 'Re-encoding failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Re-encode video with relative path (from storage/app/public/)
     * 
     * @param string $relativePath Relative path from storage/app/public/
     * @param array $options Encoding options
     * @return array ['success' => bool, 'relative_path' => string, 'message' => string]
     */
    public function reencodeStorageVideo(string $relativePath, array $options = []): array
    {
        $inputPath = storage_path('app/public/' . $relativePath);
        
        // Generate output relative path
        $directory = dirname($relativePath);
        $filename = pathinfo($relativePath, PATHINFO_FILENAME);
        $extension = pathinfo($relativePath, PATHINFO_EXTENSION);
        $outputRelativePath = $directory . '/' . $filename . '_web.' . $extension;
        $outputPath = storage_path('app/public/' . $outputRelativePath);

        $result = $this->reencodeForWeb($inputPath, $outputPath, $options);

        if ($result['success']) {
            // Delete original file to save space (optional)
            if ($options['delete_original'] ?? false) {
                @unlink($inputPath);
                Log::info('Original video file deleted', ['path' => $inputPath]);
            }

            return [
                'success' => true,
                'relative_path' => $outputRelativePath,
                'original_size' => $result['original_size'],
                'new_size' => $result['new_size'],
                'message' => $result['message'],
            ];
        }

        return $result;
    }

    /**
     * Check if a video needs re-encoding (checks audio codec)
     * 
     * @param string $path Full path to video file
     * @return bool True if re-encoding is needed
     */
    public function needsReencoding(string $path): bool
    {
        try {
            $video = $this->ffmpeg->open($path);
            $format = $video->getStreams()->audios()->first();
            
            if (!$format) {
                // No audio stream, might need re-encoding
                return false;
            }

            $audioCodec = $format->get('codec_name');
            
            // Check if audio codec is web-compatible (AAC, MP3, Opus, Vorbis)
            $compatibleCodecs = ['aac', 'mp3', 'opus', 'vorbis'];
            
            return !in_array(strtolower($audioCodec), $compatibleCodecs);

        } catch (\Exception $e) {
            Log::warning('Failed to check video codec', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
            // If we can't check, assume it needs re-encoding
            return true;
        }
    }

    /**
     * Get video information (duration, codecs, resolution, etc.)
     * 
     * @param string $path Full path to video file
     * @return array Video information
     */
    public function getVideoInfo(string $path): array
    {
        try {
            $video = $this->ffmpeg->open($path);
            $streams = $video->getStreams();

            $videoStream = $streams->videos()->first();
            $audioStream = $streams->audios()->first();

            $info = [
                'duration' => (int) $streams->first()->get('duration'),
                'format' => pathinfo($path, PATHINFO_EXTENSION),
                'file_size' => filesize($path),
            ];

            if ($videoStream) {
                $info['video_codec'] = $videoStream->get('codec_name');
                $info['width'] = $videoStream->get('width');
                $info['height'] = $videoStream->get('height');
                $info['fps'] = $videoStream->get('r_frame_rate');
            }

            if ($audioStream) {
                $info['audio_codec'] = $audioStream->get('codec_name');
                $info['audio_channels'] = $audioStream->get('channels');
                $info['audio_sample_rate'] = $audioStream->get('sample_rate');
            }

            return $info;

        } catch (\Exception $e) {
            Log::error('Failed to get video info', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            return [
                'error' => $e->getMessage(),
            ];
        }
    }
}

