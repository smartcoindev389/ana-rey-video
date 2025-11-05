<?php

namespace App\Services;

use WebPConvert\WebPConvert;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
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
        // Validate file type - support both 'image/jpeg' and 'image/jpg'
        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        $fileMimeType = $file->getMimeType();
        
        if (!in_array($fileMimeType, $allowedMimes)) {
            throw new \InvalidArgumentException("Unsupported image type: {$fileMimeType}. Only JPEG, JPG, PNG, GIF, and WebP images are supported.");
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
            // Use Storage facade with 'public' disk to save to storage/app/public
            \Storage::disk('public')->putFileAs($directory, $file, $filename);
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
        $tempPath = null;
        $tempFullPath = null;
        try {
            // Ensure temp directory exists
            $tempDir = storage_path('app/temp');
            if (!is_dir($tempDir)) {
                if (!mkdir($tempDir, 0777, true)) {
                    throw new \Exception('Failed to create temp directory: ' . $tempDir);
                }
            }
            
            // Make directory writable
            if (!is_writable($tempDir)) {
                @chmod($tempDir, 0777);
            }
            
            // Create temporary file directly
            $tempFilename = uniqid('upload_', true) . '.' . $file->getClientOriginalExtension();
            $tempFullPath = $tempDir . DIRECTORY_SEPARATOR . $tempFilename;
            
            // Copy uploaded file to temp location (preserve original for Laravel)
            try {
                $uploadedFilePath = $file->getRealPath();
                if (!$uploadedFilePath || !file_exists($uploadedFilePath)) {
                    throw new \Exception('Uploaded file path is invalid');
                }
                
                if (!copy($uploadedFilePath, $tempFullPath)) {
                    throw new \Exception('Failed to copy uploaded file to temporary directory');
                }
            } catch (\Exception $copyError) {
                throw new \Exception('Error copying file: ' . $copyError->getMessage());
            }

            // Check if temp file was created
            if (!file_exists($tempFullPath)) {
                throw new \Exception('Temporary file does not exist after copy: ' . $tempFullPath);
            }
            
            // Verify file size
            if (filesize($tempFullPath) === 0) {
                @unlink($tempFullPath);
                throw new \Exception('Temporary file is empty after copy');
            }

            // Ensure storage directory exists with proper permissions
            if (!file_exists($storageDir)) {
                mkdir($storageDir, 0755, true);
            }

            // Check if directory is writable
            if (!is_writable($storageDir)) {
                throw new \Exception("Storage directory is not writable: {$storageDir}");
            }

            // Convert using WebPConvert with better error handling
            try {
                WebPConvert::convert($tempFullPath, $storagePath, [
                    'quality' => 85,
                    'max-width' => 1920,
                    'max-height' => 1080,
                    'auto-filter' => true,
                    'metadata' => 'none',
                    'log-call-arguments' => false,
                    'converters' => ['cwebp', 'gd', 'imagick', 'gmagick'],
                ]);
            } catch (\Exception $convertError) {
                // If WebPConvert fails, try fallback with GD library
                if (extension_loaded('gd')) {
                    $this->convertWithGD($tempFullPath, $storagePath, $file->getMimeType());
                } else {
                    throw new \Exception('WebP conversion failed and GD extension is not available: ' . $convertError->getMessage());
                }
            }

            // Verify conversion was successful
            if (!file_exists($storagePath) || filesize($storagePath) === 0) {
                throw new \Exception('WebP conversion produced invalid file');
            }

            // Clean up temp file
            if (file_exists($tempFullPath)) {
                unlink($tempFullPath);
            }

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
            if ($tempFullPath && file_exists($tempFullPath)) {
                @unlink($tempFullPath);
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
        $allowedMimes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime', 'video/x-msvideo'];
        $fileMimeType = $file->getMimeType();
        
        if (!in_array($fileMimeType, $allowedMimes)) {
            throw new \InvalidArgumentException("Unsupported video type: {$fileMimeType}. Only MP4, MOV, and AVI videos are supported.");
        }

        // Generate filename if not provided
        if (!$filename) {
            $extension = $file->getClientOriginalExtension();
            $filename = Str::uuid() . '.' . $extension;
        }

        // Save to storage/app/public/data_section/movie/
        $directory = 'data_section/movie';
        $fullPath = $directory . '/' . $filename;
        $storagePath = storage_path('app/public/' . $fullPath);
        $storageDir = dirname($storagePath);
        
        // Ensure directory exists with proper permissions
        if (!is_dir($storageDir)) {
            if (!mkdir($storageDir, 0777, true)) {
                throw new \Exception('Failed to create video directory: ' . $storageDir);
            }
        }
        
        // Make directory writable
        if (!is_writable($storageDir)) {
            @chmod($storageDir, 0777);
        }

        try {
            // Prefer Laravel Storage which handles streams robustly
            $storedPath = \Storage::disk('public')->putFileAs($directory, $file, $filename);
            if (!$storedPath) {
                throw new \Exception('Storage putFileAs returned false');
            }

            // Verify file was saved
            if (!file_exists($storagePath)) {
                throw new \Exception('Video file does not exist after save');
            }
            
            // Verify file size
            if (filesize($storagePath) === 0) {
                @unlink($storagePath);
                throw new \Exception('Video file is empty after save');
            }
            
        } catch (\Exception $e) {
            throw new \Exception('Failed to save video file: ' . $e->getMessage());
        }

        return [
            'success' => true,
            'path' => $fullPath,
            'url' => url('storage/' . $fullPath),
            'filename' => $filename,
            'size' => filesize($storagePath),
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
     * Copy a video file to a new location (for duplicating videos)
     *
     * @param string $sourcePath Relative path from storage/app/public/
     * @param string|null $newFilename Optional new filename, otherwise generates UUID
     * @return array
     */
    public function copyVideoFile(string $sourcePath, ?string $newFilename = null): array
    {
        $sourceFullPath = storage_path('app/public/' . $sourcePath);
        
        if (!file_exists($sourceFullPath)) {
            throw new \Exception('Source video file does not exist: ' . $sourcePath);
        }

        // Generate new filename if not provided
        if (!$newFilename) {
            $extension = pathinfo($sourcePath, PATHINFO_EXTENSION);
            $newFilename = Str::uuid() . '.' . $extension;
        }

        // Save to same directory
        $directory = dirname($sourcePath);
        if ($directory === '.') {
            $directory = 'data_section/movie';
        }
        
        $newPath = $directory . '/' . $newFilename;
        $destinationFullPath = storage_path('app/public/' . $newPath);
        $destinationDir = dirname($destinationFullPath);

        // Ensure directory exists
        if (!is_dir($destinationDir)) {
            if (!mkdir($destinationDir, 0777, true)) {
                throw new \Exception('Failed to create video directory: ' . $destinationDir);
            }
        }

        // Copy the file
        if (!copy($sourceFullPath, $destinationFullPath)) {
            throw new \Exception('Failed to copy video file');
        }

        return [
            'success' => true,
            'path' => $newPath,
            'url' => url('storage/' . $newPath),
            'filename' => $newFilename,
            'size' => filesize($destinationFullPath),
        ];
    }

    /**
     * Delete a file
     *
     * @param string $path
     * @return bool
     */
    public function deleteFile(string $path): bool
    {
        if (empty($path) || !is_string($path)) {
            Log::warning('deleteFile: Invalid path provided', ['path' => $path]);
            return false;
        }

        // Normalize to relative path under storage/app/public
        $normalized = trim($path);

        // If full URL, extract path component
        if (str_starts_with($normalized, 'http://') || str_starts_with($normalized, 'https://')) {
            $parsed = parse_url($normalized, PHP_URL_PATH) ?: '';
            $normalized = ltrim($parsed, '/');
        }

        // If it starts with storage/, strip it (Storage::url adds this prefix)
        if (str_starts_with($normalized, 'storage/')) {
            $normalized = substr($normalized, strlen('storage/'));
        }

        // Ensure we have a relative path like data_section/image/...
        $normalized = ltrim($normalized, '/');

        if (empty($normalized)) {
            Log::warning('deleteFile: Empty normalized path', ['original_path' => $path]);
            return false;
        }

        // Primary location: storage/app/public/
        $storageFullPath = storage_path('app/public/' . $normalized);
        if (file_exists($storageFullPath)) {
            if (is_file($storageFullPath)) {
                $deleted = @unlink($storageFullPath);
                if ($deleted) {
                    Log::info('deleteFile: Successfully deleted file', [
                        'path' => $normalized,
                        'full_path' => $storageFullPath
                    ]);
                    return true;
                } else {
                    Log::error('deleteFile: Failed to delete file (unlink returned false)', [
                        'path' => $normalized,
                        'full_path' => $storageFullPath,
                        'permissions' => substr(sprintf('%o', fileperms($storageFullPath)), -4),
                        'is_writable' => is_writable($storageFullPath)
                    ]);
                    return false;
                }
            } else {
                Log::warning('deleteFile: Path exists but is not a file', [
                    'path' => $normalized,
                    'full_path' => $storageFullPath
                ]);
            }
        }

        // Fallback: public/ (in case legacy files were placed directly under public)
        $publicFullPath = public_path($normalized);
        if (file_exists($publicFullPath)) {
            if (is_file($publicFullPath)) {
                $deleted = @unlink($publicFullPath);
                if ($deleted) {
                    Log::info('deleteFile: Successfully deleted file from public directory', [
                        'path' => $normalized,
                        'full_path' => $publicFullPath
                    ]);
                    return true;
                } else {
                    Log::error('deleteFile: Failed to delete file from public directory', [
                        'path' => $normalized,
                        'full_path' => $publicFullPath,
                        'permissions' => substr(sprintf('%o', fileperms($publicFullPath)), -4),
                        'is_writable' => is_writable($publicFullPath)
                    ]);
                    return false;
                }
            } else {
                Log::warning('deleteFile: Path exists in public but is not a file', [
                    'path' => $normalized,
                    'full_path' => $publicFullPath
                ]);
            }
        }

        // Try with /storage prefix removed if it's in the path
        if (str_contains($normalized, 'storage/')) {
            $withoutStorage = str_replace('storage/', '', $normalized);
            $altStoragePath = storage_path('app/public/' . $withoutStorage);
            if (file_exists($altStoragePath) && is_file($altStoragePath)) {
                $deleted = @unlink($altStoragePath);
                if ($deleted) {
                    Log::info('deleteFile: Successfully deleted file (alternative path)', [
                        'path' => $withoutStorage,
                        'full_path' => $altStoragePath
                    ]);
                    return true;
                }
            }
        }

        Log::warning('deleteFile: File not found', [
            'original_path' => $path,
            'normalized_path' => $normalized,
            'storage_path' => $storageFullPath,
            'public_path' => $publicFullPath,
            'storage_exists' => file_exists($storageFullPath),
            'public_exists' => file_exists($publicFullPath)
        ]);

        return false;
    }

    /**
     * Fallback conversion using GD library
     *
     * @param string $sourcePath
     * @param string $destinationPath
     * @param string $mimeType
     * @return void
     */
    private function convertWithGD(string $sourcePath, string $destinationPath, string $mimeType): void
    {
        // Load image based on type
        switch ($mimeType) {
            case 'image/jpeg':
            case 'image/jpg':
                $image = @imagecreatefromjpeg($sourcePath);
                break;
            case 'image/png':
                $image = @imagecreatefrompng($sourcePath);
                break;
            case 'image/gif':
                $image = @imagecreatefromgif($sourcePath);
                break;
            default:
                throw new \Exception("Unsupported image type for GD conversion: {$mimeType}");
        }

        if ($image === false) {
            throw new \Exception('Failed to load image with GD library');
        }

        // Convert to WebP
        $result = @imagewebp($image, $destinationPath, 85);
        imagedestroy($image);

        if (!$result) {
            throw new \Exception('GD library failed to convert image to WebP');
        }
    }
}
