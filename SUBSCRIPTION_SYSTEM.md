# Subscription System Documentation

## Overview
This document describes the comprehensive subscription system implemented for the SACRART online education platform, including subscription management, payment tracking, and admin functionality.

## Database Structure

### Tables Created

#### 1. `users` table (updated)
Enhanced with subscription and admin role support:
- `subscription_type`: ENUM('freemium', 'basic', 'premium', 'admin')
- `subscription_started_at`: TIMESTAMP
- `subscription_expires_at`: TIMESTAMP
- `role`: VARCHAR (user, admin)

#### 2. `subscription_plans` table
Stores available subscription plans with their features:

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| name | string | Plan identifier (freemium, basic, premium, admin) |
| display_name | string | Display name |
| description | text | Plan description |
| price | decimal(8,2) | Monthly price |
| duration_days | integer | Subscription duration |
| features | json | Array of features |
| max_devices | integer | Maximum devices allowed |
| video_quality | string | SD, HD, 4K |
| downloadable_content | boolean | Allow downloads |
| certificates | boolean | Issue certificates |
| priority_support | boolean | Priority customer support |
| ad_free | boolean | Ad-free experience |
| is_active | boolean | Plan is active |
| sort_order | integer | Display order |

#### 3. `subscriptions` table
Tracks user subscription history and current subscriptions:

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| user_id | bigint | Foreign key to users |
| subscription_plan_id | bigint | Foreign key to subscription_plans |
| status | enum | active, cancelled, expired, paused, pending |
| started_at | timestamp | Subscription start date |
| expires_at | timestamp | Expiration date |
| cancelled_at | timestamp | Cancellation date |
| cancellation_reason | string | Reason for cancellation |
| amount | decimal(8,2) | Amount paid |
| billing_cycle | string | monthly, yearly |
| auto_renew | boolean | Auto-renewal enabled |
| notes | text | Additional notes |

#### 4. `payment_transactions` table
Records all payment transactions:

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| user_id | bigint | Foreign key to users |
| subscription_id | bigint | Foreign key to subscriptions |
| transaction_id | string | Payment gateway transaction ID |
| payment_gateway | string | stripe, paypal, etc. |
| amount | decimal(10,2) | Transaction amount |
| currency | string(3) | Currency code (USD, EUR, etc.) |
| status | enum | pending, completed, failed, refunded, cancelled |
| type | enum | subscription, renewal, upgrade, downgrade, refund |
| payment_method | string | card, bank_transfer, etc. |
| card_last_four | string | Last 4 digits of card |
| payment_details | text | Additional payment info (JSON) |
| gateway_response | text | Payment gateway response |
| paid_at | timestamp | Payment completion date |
| notes | text | Additional notes |

## Models

### User Model
Enhanced with subscription relationships and admin functionality:

**New Methods:**
- `subscriptions()`: Get all user subscriptions
- `activeSubscription()`: Get current active subscription
- `transactions()`: Get all payment transactions
- `isAdmin()`: Check if user is admin
- `isUser()`: Check if user is regular user
- `totalSpent()`: Get total amount spent
- `hasActiveSubscription()`: Check for active subscription

### SubscriptionPlan Model
Manages subscription plan data:

**Methods:**
- `subscriptions()`: Get all subscriptions using this plan
- `isFree()`: Check if plan is free
- `scopeActive()`: Query scope for active plans
- `scopeOrdered()`: Query scope ordered by sort_order

### Subscription Model
Manages user subscriptions:

**Methods:**
- `user()`: Get subscription owner
- `plan()`: Get subscription plan
- `transactions()`: Get payment transactions
- `isActive()`: Check if subscription is active
- `isExpired()`: Check if subscription is expired
- `isCancelled()`: Check if subscription is cancelled
- `cancel($reason)`: Cancel subscription
- `daysRemaining()`: Get days until expiration
- `scopeActive()`: Query scope for active subscriptions
- `scopeExpired()`: Query scope for expired subscriptions

### PaymentTransaction Model
Manages payment records:

**Methods:**
- `user()`: Get transaction owner
- `subscription()`: Get related subscription
- `isCompleted()`: Check if transaction completed
- `isPending()`: Check if transaction pending
- `isFailed()`: Check if transaction failed
- `markAsCompleted()`: Mark transaction as completed
- `markAsFailed()`: Mark transaction as failed
- `scopeCompleted()`: Query scope for completed transactions
- `scopePending()`: Query scope for pending transactions

## Subscription Plans

### Freemium (Free)
- **Price**: $0.00
- **Features**:
  - Access to limited content
  - Basic video quality (SD)
  - Watch on 1 device
  - Community support
- **Duration**: Never expires

### Basic ($9.99/month)
- **Price**: $9.99
- **Features**:
  - Access to intermediate level content
  - HD streaming quality
  - Watch on 2 devices
  - Email support
  - Progress tracking
  - Ad-free experience
- **Duration**: 30 days

### Premium ($19.99/month)
- **Price**: $19.99
- **Features**:
  - Access to all content
  - 4K streaming quality
  - Watch on 3 devices
  - Priority support
  - Downloadable content
  - Certificates of completion
  - Ad-free experience
- **Duration**: 30 days

### Admin (Site Administrator)
- **Price**: $0.00
- **Features**:
  - Full platform access
  - Content management
  - User management
  - Analytics dashboard
  - All premium features
- **Access**: Unlimited devices, never expires

## API Endpoints

### Authentication with Admin Support

#### Register (with admin option)
```http
POST /api/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "password123",
  "subscription_type": "admin",
  "role": "admin"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "subscription_type": "admin",
    "role": "admin",
    "is_admin": true,
    "subscription_started_at": "2024-10-10T12:00:00.000000Z",
    "subscription_expires_at": null
  },
  "token": "1|abc123...",
  "message": "Registration successful"
}
```

### Admin Middleware

To protect admin-only routes, use the `admin` middleware:

```php
// In routes/api.php
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::get('/admin/subscriptions', [AdminController::class, 'subscriptions']);
    Route::get('/admin/analytics', [AdminController::class, 'analytics']);
});
```

## Using the Subscription System

### Creating a New Subscription
```php
use App\Models\Subscription;
use App\Models\SubscriptionPlan;

$user = auth()->user();
$plan = SubscriptionPlan::where('name', 'premium')->first();

$subscription = Subscription::create([
    'user_id' => $user->id,
    'subscription_plan_id' => $plan->id,
    'status' => 'active',
    'started_at' => now(),
    'expires_at' => now()->addDays($plan->duration_days),
    'amount' => $plan->price,
    'billing_cycle' => 'monthly',
    'auto_renew' => true,
]);
```

### Recording a Payment Transaction
```php
use App\Models\PaymentTransaction;

$transaction = PaymentTransaction::create([
    'user_id' => $user->id,
    'subscription_id' => $subscription->id,
    'transaction_id' => 'txn_' . uniqid(),
    'payment_gateway' => 'stripe',
    'amount' => 19.99,
    'currency' => 'USD',
    'status' => 'completed',
    'type' => 'subscription',
    'payment_method' => 'card',
    'card_last_four' => '4242',
    'paid_at' => now(),
]);
```

### Checking User Permissions
```php
// Check if user is admin
if ($user->isAdmin()) {
    // Allow admin actions
}

// Check if user has premium access
if ($user->isPremium()) {
    // Show premium content
}

// Check if subscription is active
if ($user->isSubscriptionActive()) {
    // Allow access
}

// Get active subscription details
$subscription = $user->activeSubscription();
if ($subscription) {
    $daysRemaining = $subscription->daysRemaining();
}
```

### Cancelling a Subscription
```php
$subscription = $user->activeSubscription();
if ($subscription) {
    $subscription->cancel('User requested cancellation');
}
```

## Frontend Integration

### Updated User Type
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  subscription_type: 'freemium' | 'basic' | 'premium' | 'admin';
  role: 'user' | 'admin';
  is_admin: boolean;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  is_subscription_active?: boolean;
}
```

### Checking Admin Status
```typescript
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { user } = useAuth();
  
  if (user?.is_admin) {
    // Show admin features
  }
  
  return <div>...</div>;
};
```

## Migration Commands

### Running Migrations
```bash
# Run all migrations
php artisan migrate

# Fresh migration (drops all tables and re-migrates)
php artisan migrate:fresh

# Fresh migration with seeders
php artisan migrate:fresh --seed
```

### Seeding Subscription Plans
```bash
# Seed subscription plans only
php artisan db:seed --class=SubscriptionPlanSeeder
```

## Testing

### Create Test Admin User
```bash
php artisan tinker
```

```php
use App\Models\User;
use Illuminate\Support\Facades\Hash;

User::create([
    'name' => 'Admin User',
    'email' => 'admin@example.com',
    'password' => Hash::make('password'),
    'subscription_type' => 'admin',
    'role' => 'admin',
    'subscription_started_at' => now(),
]);
```

### Create Test Subscription
```php
use App\Models\Subscription;
use App\Models\SubscriptionPlan;

$user = User::first();
$plan = SubscriptionPlan::where('name', 'premium')->first();

Subscription::create([
    'user_id' => $user->id,
    'subscription_plan_id' => $plan->id,
    'status' => 'active',
    'started_at' => now(),
    'expires_at' => now()->addDays(30),
    'amount' => $plan->price,
    'billing_cycle' => 'monthly',
    'auto_renew' => true,
]);
```

## Best Practices

1. **Always use transactions when creating subscriptions with payments**
   ```php
   DB::transaction(function () use ($user, $plan) {
       $subscription = Subscription::create([...]);
       $transaction = PaymentTransaction::create([...]);
   });
   ```

2. **Check subscription expiration regularly**
   - Create a scheduled task to check and expire subscriptions
   - Send notifications before expiration

3. **Log all payment transactions**
   - Store gateway responses
   - Keep audit trail

4. **Protect admin routes**
   - Always use `admin` middleware
   - Verify admin status in controllers

5. **Handle subscription upgrades/downgrades properly**
   - Calculate prorated amounts
   - Create proper transaction records

## Future Enhancements

- [ ] Automated subscription renewal
- [ ] Proration for upgrades/downgrades
- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Email notifications for subscription events
- [ ] Admin dashboard for managing subscriptions
- [ ] Subscription analytics and reporting
- [ ] Trial period management
- [ ] Coupon/discount system
- [ ] Subscription pause/resume functionality
- [ ] Invoice generation

## Support

For questions or issues related to the subscription system:
1. Check the Laravel logs in `storage/logs/laravel.log`
2. Verify database structure with `php artisan migrate:status`
3. Check subscription plan data: `SELECT * FROM subscription_plans`
4. Review user subscriptions: `SELECT * FROM subscriptions WHERE user_id = ?`

