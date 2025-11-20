# Stripe Integration Setup Guide

## Current Status

Run this command to check your Stripe setup:
```bash
php check_stripe_setup.php
```

## Problem

Your subscription plans don't have Stripe Price IDs configured. This is why Stripe checkout isn't working.

## Solution: Configure Stripe Price IDs

### Step 1: Create Products in Stripe Dashboard

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Click **"+ Add product"**
3. Create products for each paid plan:
   - **Basic Plan** - $9.99/month
   - **Premium Plan** - $19.99/month

### Step 2: Create Recurring Prices

For each product:
1. Click on the product
2. Click **"+ Add another price"**
3. Set:
   - **Price**: Match your plan price (e.g., $9.99 for Basic)
   - **Billing period**: Monthly (recurring)
   - **Currency**: USD (or your currency)
4. Click **"Save price"**
5. **Copy the Price ID** (starts with `price_`)

### Step 3: Set Stripe Price IDs

You have 2 options (choose one):

#### Option A: Using Environment Variables (Easiest - No Database Changes)
Add these to your `.env` file:
```env
STRIPE_PRICE_ID_BASIC=price_xxxxx
STRIPE_PRICE_ID_PREMIUM=price_xxxxx
```

Then clear config cache:
```bash
php artisan config:clear
```

**Note**: The system will automatically use env variables if database values are NULL. Database values take priority.

#### Option B: Update Database

You have 3 options:

##### Option B1: Using Artisan Command (Recommended)
```bash
php artisan stripe:set-price-id basic price_xxxxx
php artisan stripe:set-price-id premium price_xxxxx
```

##### Option B2: Using Laravel Tinker
```bash
php artisan tinker
```
Then:
```php
$basic = App\Models\SubscriptionPlan::where('name', 'basic')->first();
$basic->update(['stripe_price_id' => 'price_xxxxx']);

$premium = App\Models\SubscriptionPlan::where('name', 'premium')->first();
$premium->update(['stripe_price_id' => 'price_xxxxx']);
```

##### Option B3: Direct SQL
```sql
UPDATE subscription_plans SET stripe_price_id = 'price_xxxxx' WHERE name = 'basic';
UPDATE subscription_plans SET stripe_price_id = 'price_xxxxx' WHERE name = 'premium';
```

### Step 4: Verify Setup

Run the check script again:
```bash
php check_stripe_setup.php
```

You should see:
```
✅ Plan: Basic (ID: 2, Name: basic, Price: $9.99)
   Stripe Price ID: price_xxxxx
✅ Plan: Premium (ID: 3, Name: premium, Price: $19.99)
   Stripe Price ID: price_xxxxx
```

## Test Mode vs Live Mode

- **Test Mode**: Use test Price IDs when `STRIPE_SECRET` starts with `sk_test_`
- **Live Mode**: Use live Price IDs when `STRIPE_SECRET` starts with `sk_live_`

Make sure your Price IDs match your Stripe secret key mode!

## How It Works

1. **User Registration Flow**:
   - User selects a paid plan during signup
   - User is registered as 'freemium' first
   - Stripe checkout is triggered automatically
   - User enters payment details on Stripe's secure page
   - After payment, webhook updates subscription

2. **Existing User Upgrade**:
   - User selects a paid plan
   - Stripe checkout is triggered
   - User enters payment details
   - Subscription is updated after payment

## Frontend Indicators

The subscription page now shows:
- ⚠️ Warning message if a plan doesn't have Stripe configured
- Disabled button if payment isn't available
- Clear error messages in console

## Troubleshooting

### "Plan is not configured for Stripe billing"
- **Fix**: Set `stripe_price_id` for the plan (see Step 3 above)

### "Stripe is not configured. Missing STRIPE_SECRET"
- **Fix**: Add `STRIPE_SECRET=sk_test_xxxxx` to your `.env` file

### Checkout page doesn't appear
- Check browser console for errors
- Verify `stripe_price_id` is set correctly
- Ensure `STRIPE_SECRET` is valid

### Webhook not working
- Set `STRIPE_WEBHOOK_SECRET` in `.env`
- Configure webhook endpoint in Stripe Dashboard:
  - URL: `https://yourdomain.com/api/payments/stripe/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.*`

## Next Steps

After setting up Price IDs:
1. Test the registration flow with a paid plan
2. Verify Stripe checkout page appears
3. Use Stripe test cards: `4242 4242 4242 4242`
4. Check webhook events in Stripe Dashboard

