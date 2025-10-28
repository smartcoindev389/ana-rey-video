<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Serve images from data_section folder
Route::get('/data_section/image/{filename}', function ($filename) {
    $path = storage_path('../data_section/image/' . $filename);
    
    if (!file_exists($path)) {
        abort(404);
    }
    
    $file = file_get_contents($path);
    $mimeType = mime_content_type($path);
    
    return response($file)
        ->header('Content-Type', $mimeType)
        ->header('Cache-Control', 'public, max-age=31536000');
})->where('filename', '.*');

// Serve videos from data_section folder
Route::get('/data_section/movie/{filename}', function ($filename) {
    $path = storage_path('../data_section/movie/' . $filename);
    
    if (!file_exists($path)) {
        abort(404);
    }
    
    $file = file_get_contents($path);
    $mimeType = mime_content_type($path);
    
    return response($file)
        ->header('Content-Type', $mimeType)
        ->header('Cache-Control', 'public, max-age=31536000');
})->where('filename', '.*');
