# Admin API Endpoints - Quick Reference

## Important: URL Change for Update & Delete Operations

**Your admin panel must now use these endpoints:**

### Series Management

| Operation | Method | Old Endpoint ❌ | New Endpoint ✅ |
|-----------|--------|----------------|-----------------|
| List All | GET | `/api/admin/series` | `/api/admin/series` (No change) |
| Create | POST | `/api/series` | `/api/admin/series` |
| View One | GET | `/api/admin/series/{id}` | `/api/admin/series/{slug}` |
| Update | PUT | `/api/series/{id}` | `/api/admin/series/{id}` |
| Delete | DELETE | `/api/series/{id}` | `/api/admin/series/{id}` |

### Category Management

| Operation | Method | Old Endpoint ❌ | New Endpoint ✅ |
|-----------|--------|----------------|-----------------|
| List All | GET | `/api/admin/categories` | `/api/admin/categories` (No change) |
| Create | POST | `/api/categories` | `/api/admin/categories` |
| Update | PUT | `/api/categories/{id}` | `/api/admin/categories/{id}` |
| Delete | DELETE | `/api/categories/{id}` | `/api/admin/categories/{id}` |

### Video Management

| Operation | Method | Old Endpoint ❌ | New Endpoint ✅ |
|-----------|--------|----------------|-----------------|
| List All | GET | `/api/admin/videos` | `/api/admin/videos` (No change) |
| Create | POST | `/api/videos` | `/api/admin/videos` |
| Update | PUT | `/api/videos/{id}` | `/api/admin/videos/{id}` |
| Delete | DELETE | `/api/videos/{id}` | `/api/admin/videos/{id}` |

## Key Points

1. **All admin CRUD operations now use `/api/admin/` prefix**
2. **Update and Delete operations use numeric IDs** (not slugs)
3. **Create operations also moved to `/api/admin/` namespace**
4. **Authorization required**: All requests must include `Authorization: Bearer {token}` header
5. **Admin role required**: User must have admin privileges

## Example API Calls

### 1. Update Series (JavaScript/Fetch)
```javascript
const updateSeries = async (seriesId, data) => {
  const response = await fetch(`/api/admin/series/${seriesId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

// Usage
await updateSeries(8, {
  title: "Updated Series",
  description: "New description",
  visibility: "premium",
  category_id: 1
});
```

### 2. Delete Series (JavaScript/Fetch)
```javascript
const deleteSeries = async (seriesId) => {
  const response = await fetch(`/api/admin/series/${seriesId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Usage
await deleteSeries(8);
```

### 3. Update Series (Axios)
```javascript
const updateSeries = (seriesId, data) => {
  return axios.put(`/api/admin/series/${seriesId}`, data, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Usage
await updateSeries(8, {
  title: "Updated Series",
  description: "New description",
  visibility: "premium",
  category_id: 1
});
```

### 4. Delete Series (Axios)
```javascript
const deleteSeries = (seriesId) => {
  return axios.delete(`/api/admin/series/${seriesId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Usage
await deleteSeries(8);
```

## Testing with Postman/Insomnia

1. **Set Base URL**: `http://localhost:8000/api/admin`
2. **Add Authorization Header**: 
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN_HERE`
3. **Update Series**:
   - Method: PUT
   - URL: `{{base_url}}/series/8`
   - Body (JSON):
   ```json
   {
     "title": "Updated Title",
     "description": "Updated description",
     "visibility": "premium",
     "category_id": 1
   }
   ```
4. **Delete Series**:
   - Method: DELETE
   - URL: `{{base_url}}/series/8`

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Series updated successfully.",
  "data": {
    "id": 8,
    "title": "Updated Series",
    "slug": "updated-series",
    "description": "New description",
    "visibility": "premium",
    "category_id": 1,
    // ... other fields
  }
}
```

### Error Response (Not Found)
```json
{
  "success": false,
  "message": "No query results for model [App\\Models\\Series] 99"
}
```

### Error Response (Unauthorized)
```json
{
  "success": false,
  "message": "You do not have permission to edit this series."
}
```

## Frontend Framework Examples

### React/Next.js
```jsx
// api/series.js
export const updateSeries = async (id, data) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/admin/series/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update series');
  return response.json();
};

export const deleteSeries = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/admin/series/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to delete series');
  return response.json();
};
```

### Vue.js
```javascript
// services/seriesService.js
import axios from 'axios';

const API_URL = '/api/admin/series';

export default {
  update(id, data) {
    return axios.put(`${API_URL}/${id}`, data);
  },
  
  delete(id) {
    return axios.delete(`${API_URL}/${id}`);
  }
};

// Usage in component
methods: {
  async updateSeries(id, formData) {
    try {
      const response = await seriesService.update(id, formData);
      console.log('Updated:', response.data);
    } catch (error) {
      console.error('Error:', error.response.data);
    }
  },
  
  async deleteSeries(id) {
    try {
      await seriesService.delete(id);
      console.log('Deleted successfully');
    } catch (error) {
      console.error('Error:', error.response.data);
    }
  }
}
```

### Angular
```typescript
// series.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SeriesService {
  private apiUrl = '/api/admin/series';

  constructor(private http: HttpClient) {}

  updateSeries(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteSeries(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
```

## Migration Checklist for Frontend

- [ ] Update API endpoint URLs to use `/api/admin/` prefix
- [ ] Ensure you're passing numeric ID (not slug) for update/delete operations
- [ ] Test create operation with new endpoint
- [ ] Test update operation with ID
- [ ] Test delete operation with ID
- [ ] Update any API documentation
- [ ] Update environment variables if using base URL constants
- [ ] Test error handling for 404 (not found) responses
- [ ] Test authorization/permission error handling
