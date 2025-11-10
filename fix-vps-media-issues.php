<?php
/**
 * VPS Media Issues Diagnostic and Fix Script
 * 
 * This script helps diagnose and fix image/video loading issues on VPS
 * 
 * Usage: php fix-vps-media-issues.php
 */

echo "========================================\n";
echo "VPS Media Issues Diagnostic Tool\n";
echo "========================================\n\n";

// Check if we're in Laravel root
if (!file_exists('artisan')) {
    echo "❌ ERROR: This script must be run from Laravel root directory\n";
    exit(1);
}

$issues = [];
$fixes = [];

// 1. Check APP_URL in .env
echo "1. Checking APP_URL configuration...\n";
if (file_exists('.env')) {
    $envContent = file_get_contents('.env');
    if (preg_match('/APP_URL=(.+)/', $envContent, $matches)) {
        $appUrl = trim($matches[1]);
        echo "   APP_URL: $appUrl\n";
        
        if (strpos($appUrl, 'localhost') !== false || strpos($appUrl, '127.0.0.1') !== false) {
            $issues[] = "APP_URL is set to localhost. Should be your VPS domain.";
            $fixes[] = "Update APP_URL in .env to your VPS domain (e.g., https://yourdomain.com)";
        }
    } else {
        $issues[] = "APP_URL not found in .env";
        $fixes[] = "Add APP_URL=https://yourdomain.com to .env";
    }
} else {
    $issues[] = ".env file not found";
    $fixes[] = "Create .env file from .env.example";
}

// 2. Check storage link
echo "\n2. Checking storage symbolic link...\n";
$storageLink = 'public/storage';
if (is_link($storageLink)) {
    $target = readlink($storageLink);
    echo "   Storage link exists: $storageLink -> $target\n";
    
    if (!file_exists($target)) {
        $issues[] = "Storage link target does not exist: $target";
        $fixes[] = "Run: php artisan storage:link";
    }
} else {
    $issues[] = "Storage symbolic link not found";
    $fixes[] = "Run: php artisan storage:link";
}

// 3. Check storage directory structure
echo "\n3. Checking storage directory structure...\n";
$storageDirs = [
    'storage/app/public',
    'storage/app/public/data_section',
    'storage/app/public/data_section/image',
    'storage/app/public/data_section/movie',
];

foreach ($storageDirs as $dir) {
    if (is_dir($dir)) {
        $fileCount = count(glob($dir . '/*'));
        echo "   ✓ $dir exists ($fileCount files)\n";
    } else {
        echo "   ⚠ $dir does not exist\n";
        $issues[] = "Storage directory missing: $dir";
        $fixes[] = "Create directory: mkdir -p $dir";
    }
}

// 4. Check file permissions
echo "\n4. Checking file permissions...\n";
$storagePath = 'storage/app/public';
if (is_dir($storagePath)) {
    $perms = substr(sprintf('%o', fileperms($storagePath)), -4);
    echo "   Storage permissions: $perms\n";
    
    if ($perms !== '0755' && $perms !== '0775' && $perms !== '0777') {
        $issues[] = "Storage directory permissions may be too restrictive: $perms";
        $fixes[] = "Fix permissions: chmod -R 755 storage";
    }
}

// 5. Check if files are accessible
echo "\n5. Checking file accessibility...\n";
$testFiles = [
    'storage/app/public/data_section/image/cover1.webp',
    'storage/app/public/data_section/image/cover2.webp',
];

$foundFiles = 0;
foreach ($testFiles as $file) {
    if (file_exists($file)) {
        $foundFiles++;
        echo "   ✓ $file exists\n";
    } else {
        echo "   ⚠ $file not found\n";
    }
}

if ($foundFiles === 0) {
    $issues[] = "No test image files found in storage";
    $fixes[] = "Upload images to storage/app/public/data_section/image/";
}

// 6. Check frontend .env
echo "\n6. Checking frontend environment...\n";
$frontendEnv = 'frontend/.env';
if (file_exists($frontendEnv)) {
    $envContent = file_get_contents($frontendEnv);
    if (preg_match('/VITE_API_BASE_URL=(.+)/', $envContent, $matches)) {
        $apiUrl = trim($matches[1]);
        echo "   VITE_API_BASE_URL: $apiUrl\n";
        
        if (strpos($apiUrl, 'localhost') !== false || strpos($apiUrl, '127.0.0.1') !== false) {
            $issues[] = "VITE_API_BASE_URL is set to localhost in frontend/.env";
            $fixes[] = "Update VITE_API_BASE_URL in frontend/.env to your VPS API URL";
        }
    } else {
        $issues[] = "VITE_API_BASE_URL not found in frontend/.env";
        $fixes[] = "Add VITE_API_BASE_URL=https://yourdomain.com/api to frontend/.env";
    }
} else {
    echo "   ⚠ frontend/.env not found\n";
    $issues[] = "frontend/.env file not found";
    $fixes[] = "Create frontend/.env with VITE_API_BASE_URL";
}

// 7. Check config cache
echo "\n7. Checking configuration cache...\n";
if (file_exists('bootstrap/cache/config.php')) {
    echo "   ⚠ Configuration is cached\n";
    $issues[] = "Configuration cache exists - changes to .env won't take effect";
    $fixes[] = "Clear config cache: php artisan config:clear";
}

// Summary
echo "\n========================================\n";
echo "SUMMARY\n";
echo "========================================\n\n";

if (empty($issues)) {
    echo "✅ No issues found! Your configuration looks good.\n\n";
} else {
    echo "❌ Found " . count($issues) . " issue(s):\n\n";
    foreach ($issues as $i => $issue) {
        echo "   " . ($i + 1) . ". $issue\n";
    }
    
    echo "\n========================================\n";
    echo "RECOMMENDED FIXES\n";
    echo "========================================\n\n";
    foreach ($fixes as $i => $fix) {
        echo "   " . ($i + 1) . ". $fix\n";
    }
}

echo "\n========================================\n";
echo "QUICK FIX COMMANDS\n";
echo "========================================\n\n";
echo "1. Create storage link:\n";
echo "   php artisan storage:link\n\n";
echo "2. Clear config cache:\n";
echo "   php artisan config:clear\n";
echo "   php artisan cache:clear\n\n";
echo "3. Fix permissions:\n";
echo "   chmod -R 755 storage\n";
echo "   chmod -R 755 public/storage\n\n";
echo "4. Rebuild frontend (after updating .env):\n";
echo "   cd frontend\n";
echo "   npm run build\n\n";

echo "========================================\n";
echo "Done!\n";
echo "========================================\n";

