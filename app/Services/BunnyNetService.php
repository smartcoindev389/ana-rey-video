<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;

class BunnyNetService
{
    protected $apiKey;
    protected $libraryId;
    protected $cdnUrl;
    protected $streamUrl;

    public function __construct()
    {
        $this->apiKey = config('services.bunny.api_key');
        $this->libraryId = config('services.bunny.library_id');
        $this->cdnUrl = config('services.bunny.cdn_url');
        $this->streamUrl = config('services.bunny.stream_url');
    }

    /**
     * Upload a video file to Bunny.net
     * 
     * @param UploadedFile $file The video file to upload
     * @param string|null $title Optional title for the video
     * @return array ['success' => bool, 'video_id' => string|null, 'video_url' => string|null, 'message' => string]
     */
    public function uploadVideo(UploadedFile $file, ?string $title = null): array
    {
        try {
            // Create video in Bunny.net library
            $createResponse = $this->createVideo($title ?: $file->getClientOriginalName());
            
            if (!$createResponse['success']) {
                return $createResponse;
            }

            $videoId = $createResponse['video_id'];

            // Upload the video file using PUT request to the upload URL
            // Bunny.net uses a specific upload endpoint format
            $uploadUrl = "https://video.bunnycdn.com/library/{$this->libraryId}/videos/{$videoId}";
            
            $fileContent = file_get_contents($file->getRealPath());
            $fileSize = filesize($file->getRealPath());

            // Bunny.net requires the file to be uploaded as raw binary data
            $uploadResponse = Http::timeout(3600) // 1 hour timeout for large files
                ->withHeaders([
                    'AccessKey' => $this->apiKey,
                ])
                ->withBody($fileContent, 'application/octet-stream')
                ->put($uploadUrl);

            if (!$uploadResponse->successful()) {
                Log::error('Bunny.net upload failed', [
                    'video_id' => $videoId,
                    'status' => $uploadResponse->status(),
                    'response' => $uploadResponse->body(),
                ]);

                // Try to delete the created video
                $this->deleteVideo($videoId);

                return [
                    'success' => false,
                    'video_id' => null,
                    'video_url' => null,
                    'message' => 'Failed to upload video to Bunny.net: ' . $uploadResponse->body(),
                ];
            }

            // Wait a bit for processing, then get video details
            sleep(2);
            $videoDetails = $this->getVideo($videoId);

            return [
                'success' => true,
                'video_id' => $videoId,
                'video_url' => $this->getVideoUrl($videoId),
                'embed_url' => $this->getEmbedUrl($videoId),
                'thumbnail_url' => $videoDetails['thumbnail_url'] ?? null,
                'duration' => $videoDetails['duration'] ?? null,
                'file_size' => $videoDetails['file_size'] ?? $fileSize,
                'message' => 'Video uploaded successfully to Bunny.net',
            ];

        } catch (\Exception $e) {
            Log::error('Bunny.net upload exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'video_id' => null,
                'video_url' => null,
                'message' => 'Exception during Bunny.net upload: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Create a video in Bunny.net library
     * 
     * @param string $title Video title
     * @return array
     */
    public function createVideo(string $title): array
    {
        try {
            $response = Http::withHeaders([
                'AccessKey' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post("https://video.bunnycdn.com/library/{$this->libraryId}/videos", [
                'title' => $title,
            ]);

            if (!$response->successful()) {
                Log::error('Bunny.net create video failed', [
                    'status' => $response->status(),
                    'response' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'video_id' => null,
                    'upload_url' => null,
                    'message' => 'Failed to create video in Bunny.net: ' . $response->body(),
                ];
            }

            $data = $response->json();
            $videoId = $data['guid'] ?? $data['videoId'] ?? null;

            return [
                'success' => true,
                'video_id' => $videoId,
                'upload_url' => $videoId 
                    ? "https://video.bunnycdn.com/library/{$this->libraryId}/videos/{$videoId}" 
                    : null,
                'message' => 'Video created successfully in Bunny.net',
            ];

        } catch (\Exception $e) {
            Log::error('Bunny.net create video exception', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'video_id' => null,
                'upload_url' => null,
                'message' => 'Exception during video creation: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get video details from Bunny.net
     * 
     * @param string $videoId Bunny.net video ID
     * @return array
     */
    public function getVideo(string $videoId): array
    {
        try {
            $response = Http::withHeaders([
                'AccessKey' => $this->apiKey,
            ])->get("https://video.bunnycdn.com/library/{$this->libraryId}/videos/{$videoId}");

            if (!$response->successful()) {
                return [
                    'success' => false,
                    'data' => null,
                ];
            }

            $data = $response->json();
            
            return [
                'success' => true,
                'data' => $data,
                'duration' => $data['length'] ?? $data['duration'] ?? null,
                'file_size' => $data['storageSize'] ?? $data['size'] ?? null,
                'thumbnail_url' => isset($data['thumbnailFileName']) && $data['thumbnailFileName']
                    ? "https://{$this->cdnUrl}/{$videoId}/{$data['thumbnailFileName']}"
                    : null,
            ];

        } catch (\Exception $e) {
            Log::error('Bunny.net get video exception', [
                'video_id' => $videoId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'data' => null,
            ];
        }
    }

    /**
     * Delete a video from Bunny.net
     * 
     * @param string $videoId Bunny.net video ID
     * @return bool
     */
    public function deleteVideo(string $videoId): bool
    {
        try {
            $response = Http::withHeaders([
                'AccessKey' => $this->apiKey,
            ])->delete("https://video.bunnycdn.com/library/{$this->libraryId}/videos/{$videoId}");

            return $response->successful();

        } catch (\Exception $e) {
            Log::error('Bunny.net delete video exception', [
                'video_id' => $videoId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Get the streaming URL for a video
     * 
     * @param string $videoId Bunny.net video ID
     * @return string
     */
    public function getVideoUrl(string $videoId): string
    {
        return "https://{$this->streamUrl}/{$videoId}/play_720p.mp4";
    }

    /**
     * Get the embed URL for Bunny.net player
     * 
     * @param string $videoId Bunny.net video ID
     * @return string
     */
    public function getEmbedUrl(string $videoId): string
    {
        return "https://iframe.mediadelivery.net/embed/{$this->libraryId}/{$videoId}";
    }

    /**
     * Get the HLS streaming URL
     * 
     * @param string $videoId Bunny.net video ID
     * @return string
     */
    public function getHlsUrl(string $videoId): string
    {
        return "https://{$this->streamUrl}/{$videoId}/playlist.m3u8";
    }

    /**
     * Get the DASH streaming URL
     * 
     * @param string $videoId Bunny.net video ID
     * @return string
     */
    public function getDashUrl(string $videoId): string
    {
        return "https://{$this->streamUrl}/{$videoId}/play_720p.mpd";
    }

    /**
     * Update video metadata in Bunny.net
     * 
     * @param string $videoId Bunny.net video ID
     * @param array $data Metadata to update
     * @return bool
     */
    public function updateVideo(string $videoId, array $data): bool
    {
        try {
            $response = Http::withHeaders([
                'AccessKey' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post("https://video.bunnycdn.com/library/{$this->libraryId}/videos/{$videoId}", $data);

            return $response->successful();

        } catch (\Exception $e) {
            Log::error('Bunny.net update video exception', [
                'video_id' => $videoId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}

