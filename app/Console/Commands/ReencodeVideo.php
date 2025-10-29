<?php

namespace App\Console\Commands;

use App\Models\Video;
use App\Services\VideoTranscodingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ReencodeVideo extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'video:reencode 
                            {video? : The ID of the video to re-encode}
                            {--all : Re-encode all videos}
                            {--check : Only check which videos need re-encoding}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Re-encode videos with web-compatible codecs (H.264 + AAC)';

    protected $transcodingService;

    public function __construct(VideoTranscodingService $transcodingService)
    {
        parent::__construct();
        $this->transcodingService = $transcodingService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if ($this->option('check')) {
            return $this->checkVideos();
        }

        if ($this->option('all')) {
            return $this->reencodeAll();
        }

        $videoId = $this->argument('video');
        if (!$videoId) {
            $this->error('Please provide a video ID or use --all flag');
            return 1;
        }

        return $this->reencodeVideo($videoId);
    }

    protected function reencodeVideo($videoId)
    {
        $video = Video::find($videoId);

        if (!$video) {
            $this->error("Video with ID {$videoId} not found");
            return 1;
        }

        if (!$video->video_file_path) {
            $this->error("Video {$videoId} has no video file path");
            return 1;
        }

        $this->info("Re-encoding video: {$video->title} (ID: {$video->id})");

        $fullPath = storage_path('app/public/' . $video->video_file_path);
        
        if (!file_exists($fullPath)) {
            $this->error("Video file not found: {$fullPath}");
            return 1;
        }

        $this->info("Input file: {$video->video_file_path}");

        try {
            $result = $this->transcodingService->reencodeStorageVideo(
                $video->video_file_path,
                [
                    'audio_bitrate' => 128,
                    'video_quality' => 23,
                    'preset' => 'medium',
                    'delete_original' => true,
                ]
            );

            if ($result['success']) {
                $video->video_file_path = $result['relative_path'];
                $video->file_size = $result['new_size'];
                $video->save();

                $this->info("✅ Video re-encoded successfully!");
                $this->info("New file: {$result['relative_path']}");
                $this->info("Original size: " . $this->formatBytes($result['original_size']));
                $this->info("New size: " . $this->formatBytes($result['new_size']));
                
                return 0;
            } else {
                $this->error("❌ Re-encoding failed: {$result['message']}");
                return 1;
            }
        } catch (\Exception $e) {
            $this->error("❌ Error: {$e->getMessage()}");
            Log::error('Video re-encoding failed', [
                'video_id' => $videoId,
                'error' => $e->getMessage(),
            ]);
            return 1;
        }
    }

    protected function reencodeAll()
    {
        $videos = Video::whereNotNull('video_file_path')->get();
        
        $this->info("Found {$videos->count()} videos to check");
        $this->newLine();

        $reencoded = 0;
        $failed = 0;
        $skipped = 0;

        $bar = $this->output->createProgressBar($videos->count());
        $bar->start();

        foreach ($videos as $video) {
            $fullPath = storage_path('app/public/' . $video->video_file_path);
            
            if (!file_exists($fullPath)) {
                $skipped++;
                $bar->advance();
                continue;
            }

            try {
                $result = $this->transcodingService->reencodeStorageVideo(
                    $video->video_file_path,
                    [
                        'audio_bitrate' => 128,
                        'video_quality' => 23,
                        'preset' => 'medium',
                        'delete_original' => true,
                    ]
                );

                if ($result['success']) {
                    $video->video_file_path = $result['relative_path'];
                    $video->file_size = $result['new_size'];
                    $video->save();
                    $reencoded++;
                } else {
                    $failed++;
                }
            } catch (\Exception $e) {
                $failed++;
                Log::error('Video re-encoding failed', [
                    'video_id' => $video->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("✅ Re-encoded: {$reencoded}");
        $this->warn("⚠️  Failed: {$failed}");
        $this->info("⏭️  Skipped: {$skipped}");

        return 0;
    }

    protected function checkVideos()
    {
        $videos = Video::whereNotNull('video_file_path')->get();
        
        $this->info("Checking {$videos->count()} videos for re-encoding needs...");
        $this->newLine();

        $needsReencode = [];
        $compatible = [];
        $missing = [];

        foreach ($videos as $video) {
            $fullPath = storage_path('app/public/' . $video->video_file_path);
            
            if (!file_exists($fullPath)) {
                $missing[] = $video;
                continue;
            }

            try {
                if ($this->transcodingService->needsReencoding($fullPath)) {
                    $info = $this->transcodingService->getVideoInfo($fullPath);
                    $needsReencode[] = [
                        'video' => $video,
                        'codec' => $info['audio_codec'] ?? 'unknown',
                    ];
                } else {
                    $compatible[] = $video;
                }
            } catch (\Exception $e) {
                $needsReencode[] = [
                    'video' => $video,
                    'codec' => 'check failed',
                ];
            }
        }

        $this->table(
            ['ID', 'Title', 'Audio Codec', 'Status'],
            array_map(function ($item) {
                return [
                    $item['video']->id,
                    substr($item['video']->title, 0, 40),
                    $item['codec'],
                    '⚠️  Needs re-encoding',
                ];
            }, $needsReencode)
        );

        if (count($needsReencode) > 0) {
            $this->newLine();
            $this->info("Found " . count($needsReencode) . " videos that need re-encoding");
            $this->info("Run: php artisan video:reencode --all");
        }

        if (count($compatible) > 0) {
            $this->info("✅ " . count($compatible) . " videos are already compatible");
        }

        if (count($missing) > 0) {
            $this->warn("⚠️  " . count($missing) . " videos have missing files");
        }

        return 0;
    }

    protected function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
}

