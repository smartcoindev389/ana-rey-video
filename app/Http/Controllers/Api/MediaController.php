<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WebpConversionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class MediaController extends Controller
{
    protected $webpService;

    public function __construct(WebpConversionService $webpService)
    {
        $this->webpService = $webpService;
    }

    /**
     * Upload and convert images to WebP
     */
    public function uploadImages(Request $request): JsonResponse
    {
        // Check if user is admin
        if (!Auth::user() || !Auth::user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Support both single image and array of images
        $files = [];
        if ($request->hasFile('image')) {
            // Single image upload
            $files = [$request->file('image')];
        } elseif ($request->hasFile('images')) {
            // Array of images
            $files = is_array($request->file('images')) 
                ? $request->file('images') 
                : [$request->file('images')];
        } elseif ($request->hasFile('images.*')) {
            // Array form data with images[]
            $files = $request->file('images');
        }

        if (empty($files)) {
            return response()->json([
                'success' => false,
                'message' => 'No image file provided. Please upload a file under "image" or "images".'
            ], 422);
        }

        // Validate each file
        foreach ($files as $file) {
            $validator = Validator::make(['file' => $file], [
                'file' => 'required|file|image|mimes:jpeg,png,jpg,webp|max:10240', // 10MB max per file
            ]);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }
        }

        try {
            $results = $this->webpService->convertMultipleToWebP($files, 'data_section/image');
            
            return response()->json([
                'success' => true,
                'message' => 'Images uploaded and converted to WebP successfully',
                'data' => $results
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload images: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload videos
     */
    public function uploadVideos(Request $request): JsonResponse
    {
        // Check if user is admin
        if (!Auth::user() || !Auth::user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'videos' => 'required|array|max:5',
            'videos.*' => 'required|file|mimes:mp4,mov,avi|max:512000', // 500MB max per file
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $results = [];
            foreach ($request->file('videos') as $video) {
                $results[] = $this->webpService->saveVideo($video);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Videos uploaded successfully',
                'data' => $results
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload videos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get uploaded images
     */
    public function getImages(): JsonResponse
    {
        try {
            $images = $this->webpService->getUploadedImages();
            
            return response()->json([
                'success' => true,
                'data' => $images
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get images: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get uploaded videos
     */
    public function getVideos(): JsonResponse
    {
        try {
            $videos = $this->webpService->getUploadedVideos();
            
            return response()->json([
                'success' => true,
                'data' => $videos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get videos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a media file
     */
    public function deleteFile(Request $request): JsonResponse
    {
        // Check if user is admin
        if (!Auth::user() || !Auth::user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'path' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $deleted = $this->webpService->deleteFile($request->path);
            
            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'File deleted successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found or could not be deleted'
                ], 404);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete file: ' . $e->getMessage()
            ], 500);
        }
    }
}
