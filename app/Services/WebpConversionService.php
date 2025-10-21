<?php

namespace App\Services;

use WebPConvert\WebPConvert;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class WebpConversionService
{
    /**
     * Convert an uploaded file to WebP format
     *
     * @param UploadedFile $file
     * @param string $directory
     * @param string|null $filename
     * @return array
     */
    public function convertToWebP(UploadedFile $file, string $directory = 'images', ?string $filename = null): array
    {
        // Validate file type
        if (!in_array($file->getMimeType(), ['image/jpeg', 'image/png', 'image/webp'])) {
            throw new \InvalidArgumentException('Only JPEG, PNG, and WebP images are supported.');
        }

        // Generate filename if not provided
        if (!$filename) {
            $filename = Str::uuid() . '.webp';
        } elseif (!str_ends_with($filename, '.webp')) {
            $filename = pathinfo($filename, PATHINFO_FILENAME) . '.webp';
        }

        // Create directory if it doesn't exist
        $fullPath = $directory . '/' . $filename;
        $storagePath = storage_path('app/public/' . $fullPath);
        $storageDir = dirname($storagePath);
        
        if (!is_dir($storageDir)) {
            mkdir($storageDir, 0755, true);
        }

        // If file is already WebP, just move it
        if ($file->getMimeType() === 'image/webp') {
            $file->storeAs('public/' . $directory, $filename);
            return [
                'success' => true,
                'path' => $fullPath,
                'url' => Storage::url($fullPath),
                'filename' => $filename,
                'size' => $file->getSize(),
                'mime_type' => 'image/webp'
            ];
        }

        // Convert to WebP
        try {
            $tempPath = $file->store('temp');
            $tempFullPath = storage_path('app/' . $tempPath);

            // Convert using WebPConvert
            WebPConvert::convert($tempFullPath, $storagePath, [
                'quality' => 85,
                'max-width' => 1920,
                'max-height' => 1080,
                'auto-filter' => true,
                'metadata' => 'none'
            ]);

            // Clean up temp file
            unlink($tempFullPath);

            return [
                'success' => true,
                'path' => $fullPath,
                'url' => Storage::url($fullPath),
                'filename' => $filename,
                'size' => filesize($storagePath),
                'mime_type' => 'image/webp'
            ];

        } catch (\Exception $e) {
            // Clean up temp file if it exists
            if (isset($tempPath)) {
                $tempFullPath = storage_path('app/' . $tempPath);
                if (file_exists($tempFullPath)) {
                    unlink($tempFullPath);
                }
            }

            throw new \Exception('Failed to convert image to WebP: ' . $e->getMessage());
        }
    }

    /**
     * Convert multiple files to WebP
     *
     * @param array $files
     * @param string $directory
     * @return array
     */
    public function convertMultipleToWebP(array $files, string $directory = 'images'): array
    {
        $results = [];
        
        foreach ($files as $file) {
            try {
                $results[] = $this->convertToWebP($file, $directory);
            } catch (\Exception $e) {
                $results[] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                    'filename' => $file->getClientOriginalName()
                ];
            }
        }

        return $results;
    }

    /**
     * Save video file to data_section/movie/
     *
     * @param UploadedFile $file
     * @param string|null $filename
     * @return array
     */
    public function saveVideo(UploadedFile $file, ?string $filename = null): array
    {
        // Validate file type
        $allowedMimes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            throw new \InvalidArgumentException('Only MP4, MOV, and AVI videos are supported.');
        }

        // Generate filename if not provided
        if (!$filename) {
            $extension = $file->getClientOriginalExtension();
            $filename = Str::uuid() . '.' . $extension;
        }

        // Save to data_section/movie/
        $directory = 'data_section/movie';
        $fullPath = $directory . '/' . $filename;
        $storagePath = storage_path('app/public/' . $fullPath);
        $storageDir = dirname($storagePath);
        
        if (!is_dir($storageDir)) {
            mkdir($storageDir, 0755, true);
        }

        $file->storeAs('public/' . $directory, $filename);

        return [
            'success' => true,
            'path' => $fullPath,
            'url' => Storage::url($fullPath),
            'filename' => $filename,
            'size' => $file->getSize(),
            'mime_type' => $file->getMimeType()
        ];
    }

    /**
     * Get list of uploaded images
     *
     * @param string $directory
     * @return array
     */
    public function getUploadedImages(string $directory = 'data_section/image'): array
    {
        $images = [];
        $path = storage_path('app/public/' . $directory);
        
        if (is_dir($path)) {
            $files = glob($path . '/*.{webp,jpg,jpeg,png}', GLOB_BRACE);
            
            foreach ($files as $file) {
                $images[] = [
                    'filename' => basename($file),
                    'path' => $directory . '/' . basename($file),
                    'url' => Storage::url($directory . '/' . basename($file)),
                    'size' => filesize($file),
                    'modified' => filemtime($file)
                ];
            }
        }

        return $images;
    }

    /**
     * Get list of uploaded videos
     *
     * @param string $directory
     * @return array
     */
    public function getUploadedVideos(string $directory = 'data_section/movie'): array
    {
        $videos = [];
        $path = storage_path('app/public/' . $directory);
        
        if (is_dir($path)) {
            $files = glob($path . '/*.{mp4,mov,avi}', GLOB_BRACE);
            
            foreach ($files as $file) {
                $videos[] = [
                    'filename' => basename($file),
                    'path' => $directory . '/' . basename($file),
                    'url' => Storage::url($directory . '/' . basename($file)),
                    'size' => filesize($file),
                    'modified' => filemtime($file)
                ];
            }
        }

        return $videos;
    }

    /**
     * Delete a file
     *
     * @param string $path
     * @return bool
     */
    public function deleteFile(string $path): bool
    {
        $fullPath = storage_path('app/public/' . $path);
        
        if (file_exists($fullPath)) {
            return unlink($fullPath);
        }

        return false;
    }
}
