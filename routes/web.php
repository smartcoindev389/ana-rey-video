<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

Route::get('/', function () {
    return view('welcome');
});

// Serve images from data_section folder (from storage/app/public)
Route::get('/data_section/image/{filename}', function ($filename) {
    // Try storage/app/public first (where files are actually saved)
    $storagePath = storage_path('app/public/data_section/image/' . $filename);
    
    \Log::info('Serving image', [
        'filename' => $filename,
        'storage_path' => $storagePath,
        'exists' => file_exists($storagePath)
    ]);
    
    if (file_exists($storagePath)) {
        $file = file_get_contents($storagePath);
        $mimeType = mime_content_type($storagePath);
        
        return response($file)
            ->header('Content-Type', $mimeType)
            ->header('Cache-Control', 'public, max-age=31536000');
    }
    
    // Fallback to legacy location (outside storage, for backward compatibility)
    $legacyPath = storage_path('../data_section/image/' . $filename);
    
    \Log::info('Trying legacy path', [
        'filename' => $filename,
        'legacy_path' => $legacyPath,
        'exists' => file_exists($legacyPath)
    ]);
    
    if (file_exists($legacyPath)) {
        $file = file_get_contents($legacyPath);
        $mimeType = mime_content_type($legacyPath);
        
        return response($file)
            ->header('Content-Type', $mimeType)
            ->header('Cache-Control', 'public, max-age=31536000');
    }
    
    \Log::warning('Image not found', [
        'filename' => $filename,
        'storage_path' => $storagePath,
        'legacy_path' => $legacyPath
    ]);
    
    abort(404);
})->where('filename', '.*');

// Serve videos from data_section folder (from storage/app/public)
Route::get('/data_section/movie/{filename}', function ($filename) {
    // Try storage/app/public first (where files are actually saved)
    $storagePath = storage_path('app/public/data_section/movie/' . $filename);
    
    if (file_exists($storagePath)) {
        $file = file_get_contents($storagePath);
        $mimeType = mime_content_type($storagePath);
        
        return response($file)
            ->header('Content-Type', $mimeType)
            ->header('Cache-Control', 'public, max-age=31536000');
    }
    
    // Fallback to legacy location (outside storage, for backward compatibility)
    $legacyPath = storage_path('../data_section/movie/' . $filename);
    
    if (file_exists($legacyPath)) {
        $file = file_get_contents($legacyPath);
        $mimeType = mime_content_type($legacyPath);
        
        return response($file)
            ->header('Content-Type', $mimeType)
            ->header('Cache-Control', 'public, max-age=31536000');
    }
    
    abort(404);
})->where('filename', '.*');
