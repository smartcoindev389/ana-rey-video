# Series API Fix - Update & Delete Operations

## Problem
The Series model was using slug-based route binding (`getRouteKeyName()` returns 'slug'), but the admin panel was sending numeric IDs (e.g., `8`) instead of slugs. This caused Laravel to look for a series with `slug='8'` instead of `id=8`, resulting in the error:
```
Failed to delete series: No query results for model [App\Models\Series] 8
```

## Solution
Changed admin CRUD routes to explicitly use ID-based routing while keeping slug-based routing for public access.

## Changes Made

### 1. Routes Updated (routes/api.php)
**Before:**
```php
Route::post('/series', [SeriesController::class, 'store']);
Route::put('/series/{series}', [SeriesController::class, 'update']);
Route::delete('/series/{series}', [SeriesController::class, 'destroy']);
```

**After:**
```php
Route::post('/admin/series', [SeriesController::class, 'store']);
Route::put('/admin/series/{id}', [SeriesController::class, 'update']);
Route::delete('/admin/series/{id}', [SeriesController::class, 'destroy']);
```

### 2. SeriesController Updated
**Update Method:**
```php
public function update(Request $request, $id): JsonResponse
{
    // Find series by ID instead of slug
    $series = Series::findOrFail($id);
    // ... rest of the code
}
```

**Destroy Method:**
```php
public function destroy($id): JsonResponse
{
    // Find series by ID instead of slug
    $series = Series::findOrFail($id);
    // ... rest of the code
}
```

### 3. Same Changes Applied to Categories and Videos
- CategoryController: update() and destroy() methods
- VideoController: update() and destroy() methods

## API Endpoints

### Admin Endpoints (Require Authentication + Admin Role)

#### Create Series
```
POST /api/admin/series
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "New Series",
  "description": "Series description",
  "visibility": "freemium",
  "category_id": 1
}
```

#### Update Series (Using ID)
```
PUT /api/admin/series/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Series Title",
  "description": "Updated description",
  "visibility": "premium"
}
```

#### Delete Series (Using ID)
```
DELETE /api/admin/series/{id}
Authorization: Bearer {token}
```

#### Get Series List (Admin View - All Series)
```
GET /api/admin/series
Authorization: Bearer {token}
```

### Public Endpoints (Use Slug-Based Routing)

#### Get Single Series (Using Slug)
```
GET /api/series/{slug}
```

#### List All Series (Public View - Only Published)
```
GET /api/series
```

## Testing the Fix

### Using curl (Windows PowerShell):

1. **Login as Admin:**
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/login" -Method POST -Body (@{email="admin@example.com"; password="password"} | ConvertTo-Json) -ContentType "application/json"
$token = $response.token
```

2. **Update Series by ID:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/admin/series/8" -Method PUT -Headers @{Authorization="Bearer $token"} -Body (@{title="Updated Title"; description="Updated description"; visibility="premium"; category_id=1} | ConvertTo-Json) -ContentType "application/json"
```

3. **Delete Series by ID:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/admin/series/8" -Method DELETE -Headers @{Authorization="Bearer $token"}
```

## Summary of Route Structure

| Method | Path | Usage | Binding |
|--------|------|-------|---------|
| GET | `/api/series` | Public list | - |
| GET | `/api/series/{series}` | Public view | Slug |
| GET | `/api/admin/series` | Admin list | - |
| POST | `/api/admin/series` | Create | - |
| PUT | `/api/admin/series/{id}` | Update | ID |
| DELETE | `/api/admin/series/{id}` | Delete | ID |

## Why This Approach?

1. **Public URLs remain SEO-friendly**: Users access series via slugs (e.g., `/series/introduction-to-laravel`)
2. **Admin operations use IDs**: Simplifies admin panel development and avoids slug conflicts
3. **Backward compatible**: Public API endpoints remain unchanged
4. **Clear separation**: `/api/admin/*` routes are clearly for admin operations

## Additional Notes

- The Series model still uses `getRouteKeyName()` returning 'slug' for public routes
- Admin routes manually resolve models by ID using `findOrFail($id)`
- The same pattern is applied to Categories and Videos for consistency
- Route cache has been cleared to apply changes
