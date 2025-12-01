<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Stripe\StripeClient;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

class StripeController extends Controller
{
    /**
     * Create a Stripe Checkout Session for a subscription plan.
     */
    public function createCheckoutSession(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => 'required|integer|exists:subscription_plans,id',
            'success_url' => 'nullable|string',
            'cancel_url' => 'nullable|string',
        ]);

        $user = $request->user();
        $plan = SubscriptionPlan::findOrFail($validated['plan_id']);

        if (!$plan->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Selected plan is not active.',
            ], 422);
        }

        if (empty($plan->stripe_price_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Plan is not configured for Stripe billing. Please set stripe_price_id.',
            ], 422);
        }

        $secret = Config::get('stripe.secret');
        if (!$secret) {
            return response()->json([
                'success' => false,
                'message' => 'Stripe is not configured. Missing STRIPE_SECRET.',
            ], 500);
        }

        // Get URLs from request or config fallback
        $successUrl = $validated['success_url'] ?? Config::get('stripe.success_url');
        $cancelUrl = $validated['cancel_url'] ?? Config::get('stripe.cancel_url');

        // Validate URLs (handle Stripe placeholder - just check basic URL structure)
        if ($successUrl) {
            // Replace placeholder with dummy value for validation
            $successUrlForValidation = str_replace('{CHECKOUT_SESSION_ID}', 'test_session_id', $successUrl);
            
            // Basic URL structure check
            if (!preg_match('/^https?:\/\//', $successUrlForValidation)) {
                return response()->json([
                    'success' => false,
                    'message' => 'The success url field must be a valid URL.',
                    'errors' => ['success_url' => ['The success url field must be a valid URL.']],
                ], 422);
            }
        }

        if ($cancelUrl) {
            // Replace placeholder with dummy value for validation
            $cancelUrlForValidation = str_replace('{CHECKOUT_SESSION_ID}', 'test_session_id', $cancelUrl);
            
            // Basic URL structure check
            if (!preg_match('/^https?:\/\//', $cancelUrlForValidation)) {
                return response()->json([
                    'success' => false,
                    'message' => 'The cancel url field must be a valid URL.',
                    'errors' => ['cancel_url' => ['The cancel url field must be a valid URL.']],
                ], 422);
            }
        }

        // Initialize Stripe client with API key
        $client = new StripeClient($secret);

        // Ensure Stripe customer exists
        $customerId = $user->stripe_customer_id;
        if (!$customerId) {
            $customer = $client->customers->create([
                'email' => $user->email,
                'name' => $user->name,
                'metadata' => [
                    'user_id' => (string) $user->id,
                ],
            ]);
            $customerId = $customer->id;
            $user->update(['stripe_customer_id' => $customerId]);
        }

        // If success_url doesn't already have the placeholder, add it
        $finalSuccessUrl = $successUrl;
        if (!str_contains($successUrl, '{CHECKOUT_SESSION_ID}')) {
            $separator = str_contains($successUrl, '?') ? '&' : '?';
            $finalSuccessUrl = $successUrl . $separator . 'session_id={CHECKOUT_SESSION_ID}';
        }

        $session = $client->checkout->sessions->create([
            'mode' => 'subscription',
            'customer' => $customerId,
            'line_items' => [[
                'price' => $plan->stripe_price_id,
                'quantity' => 1,
            ]],
            'success_url' => $finalSuccessUrl,
            'cancel_url' => $cancelUrl,
            'client_reference_id' => (string) $user->id,
            'metadata' => [
                'user_id' => (string) $user->id,
                'plan_id' => (string) $plan->id,
            ],
        ]);

        // Create or update subscription record before redirecting to Stripe
        DB::transaction(function () use ($user, $plan, $session) {
            // Check if subscription already exists
            $subscription = Subscription::where('user_id', $user->id)
                ->where('subscription_plan_id', $plan->id)
                ->latest('id')
                ->first();

            if (!$subscription) {
                // Create pending subscription
                $subscription = Subscription::create([
                    'user_id' => $user->id,
                    'subscription_plan_id' => $plan->id,
                    'status' => 'pending',
                    'started_at' => now(),
                    'expires_at' => null, // Will be set when webhook confirms payment
                    'amount' => $plan->price,
                    'billing_cycle' => 'monthly',
                    'auto_renew' => true,
                    'notes' => 'Created before Stripe checkout - pending payment confirmation',
                ]);
            } else {
                // Update existing subscription to pending
                $subscription->update([
                    'status' => 'pending',
                    'subscription_plan_id' => $plan->id,
                    'notes' => 'Updated before Stripe checkout - pending payment confirmation',
                ]);
            }

            // Create pending payment transaction
            $existingTransaction = PaymentTransaction::where('transaction_id', $session->id)->first();
            if (!$existingTransaction) {
                PaymentTransaction::create([
                    'user_id' => $user->id,
                    'subscription_id' => $subscription->id,
                    'transaction_id' => $session->id,
                    'payment_gateway' => 'stripe',
                    'amount' => $plan->price,
                    'currency' => strtoupper(Config::get('stripe.currency', 'usd')),
                    'status' => 'pending',
                    'type' => 'subscription',
                    'payment_method' => 'card',
                    'payment_details' => json_encode(['checkout_session_id' => $session->id]),
                    'gateway_response' => json_encode($session),
                    'notes' => 'Created before Stripe checkout - pending payment confirmation',
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'url' => $session->url,
            'id' => $session->id,
        ]);
    }

    /**
     * Stripe webhook handler.
     */
    public function webhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = Config::get('stripe.webhook_secret');

        if (!$webhookSecret) {
            return new Response('Webhook not configured', 500);
        }

        try {
            // Verify webhook signature using Stripe SDK
            $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
        } catch (\UnexpectedValueException $e) {
            return new Response('Invalid payload', 400);
        } catch (SignatureVerificationException $e) {
            return new Response('Invalid signature', 400);
        }

        switch ($event->type) {
            case 'checkout.session.completed':
                $this->handleCheckoutSessionCompleted($event->data->object);
                break;
            case 'invoice.payment_succeeded':
                $this->handleInvoicePaymentSucceeded($event->data->object);
                break;
            case 'invoice.payment_failed':
                $this->handleInvoicePaymentFailed($event->data->object);
                break;
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                $this->handleSubscriptionUpsert($event->data->object);
                break;
            case 'customer.subscription.deleted':
                $this->handleSubscriptionDeleted($event->data->object);
                break;
            case 'payment_intent.succeeded':
                $this->handlePaymentIntentSucceeded($event->data->object);
                break;
            case 'payment_intent.payment_failed':
                $this->handlePaymentIntentFailed($event->data->object);
                break;
            default:
                // Unhandled event type
                Log::info('Unhandled Stripe event', ['type' => $event->type]);
        }

        return new Response('success', 200);
    }

    protected function handleCheckoutSessionCompleted($session): void
    {
        // session contains client_reference_id (user), metadata plan_id
        $userId = (int) ($session->client_reference_id ?? 0);
        $planId = (int) (($session->metadata->plan_id ?? 0));
        $amountTotal = ($session->amount_total ?? 0) / 100.0;
        $currency = $session->currency ?? Config::get('stripe.currency', 'usd');

        if (!$userId || !$planId) {
            Log::warning('Stripe checkout.session.completed missing identifiers');
            return;
        }

        DB::transaction(function () use ($userId, $planId, $session, $amountTotal, $currency) {
            $plan = SubscriptionPlan::find($planId);
            if (!$plan) {
                return;
            }

            // Find existing subscription or create new one
            $subscription = Subscription::where('user_id', $userId)
                ->where('subscription_plan_id', $plan->id)
                ->latest('id')
                ->first();

            if (!$subscription) {
                // Create subscription if it doesn't exist
                $subscription = Subscription::create([
                    'user_id' => $userId,
                    'subscription_plan_id' => $plan->id,
                    'status' => 'pending',
                    'started_at' => now(),
                    'expires_at' => null,
                    'amount' => $plan->price,
                    'billing_cycle' => 'monthly',
                    'auto_renew' => true,
                    'notes' => 'Created from Stripe checkout session',
                ]);
            } else {
                // Update existing subscription
                $subscription->update([
                    'status' => 'pending', // Will be updated to active by subscription.updated event
                    'notes' => 'Updated from Stripe checkout session',
                ]);
            }

            // Check if transaction already exists to avoid duplicates
            $existingTransaction = PaymentTransaction::where('transaction_id', $session->id)->first();
            if ($existingTransaction) {
                // Update existing transaction
                $existingTransaction->update([
                    'status' => 'completed',
                    'amount' => $amountTotal ?: $plan->price,
                    'currency' => strtoupper($currency),
                    'payment_details' => json_encode(['checkout_session' => $session]),
                    'gateway_response' => json_encode($session),
                    'paid_at' => now(),
                    'notes' => 'Stripe checkout completed',
                ]);
                Log::info('Payment transaction updated for checkout session', ['transaction_id' => $session->id]);
                return;
            }

            // Create new transaction
            PaymentTransaction::create([
                'user_id' => $userId,
                'subscription_id' => $subscription->id,
                'transaction_id' => $session->id,
                'payment_gateway' => 'stripe',
                'amount' => $amountTotal ?: $plan->price,
                'currency' => strtoupper($currency),
                'status' => 'completed',
                'type' => 'subscription',
                'payment_method' => 'card',
                'payment_details' => json_encode(['checkout_session' => $session]),
                'gateway_response' => json_encode($session),
                'paid_at' => now(),
                'notes' => 'Stripe checkout completed',
            ]);
        });
    }

    protected function handleSubscriptionUpsert($stripeSubscription): void
    {
        // Find user via customer ID, link to latest subscription
        $customerId = $stripeSubscription->customer ?? null;
        if (!$customerId) {
            return;
        }

        $user = \App\Models\User::where('stripe_customer_id', $customerId)->first();
        if (!$user) {
            return;
        }

        $planId = null;
        try {
            $priceId = $stripeSubscription->items->data[0]->price->id ?? null;
            if ($priceId) {
                $planId = SubscriptionPlan::where('stripe_price_id', $priceId)->value('id');
            }
        } catch (\Throwable $e) {
            // ignore
        }

        $subscription = Subscription::where('user_id', $user->id)
            ->latest('id')
            ->first();

        if ($subscription) {
            $subscription->update([
                'status' => $stripeSubscription->status === 'active' ? 'active' : ($stripeSubscription->status ?? 'pending'),
                'expires_at' => isset($stripeSubscription->current_period_end) ? now()->setTimestamp($stripeSubscription->current_period_end) : null,
                'stripe_subscription_id' => $stripeSubscription->id,
                'subscription_plan_id' => $planId ?? $subscription->subscription_plan_id,
            ]);
        }
    }

    protected function handleSubscriptionDeleted($stripeSubscription): void
    {
        $customerId = $stripeSubscription->customer ?? null;
        if (!$customerId) {
            return;
        }
        $user = \App\Models\User::where('stripe_customer_id', $customerId)->first();
        if (!$user) {
            return;
        }

        $subscription = Subscription::where('user_id', $user->id)
            ->where('stripe_subscription_id', $stripeSubscription->id)
            ->first();

        if ($subscription) {
            $subscription->cancel('Cancelled from Stripe');
        }
    }

    /**
     * Handle invoice.payment_succeeded event (subscription renewals and initial payments)
     */
    protected function handleInvoicePaymentSucceeded($invoice): void
    {
        $customerId = $invoice->customer ?? null;
        $subscriptionId = $invoice->subscription ?? null;
        $amountPaid = ($invoice->amount_paid ?? 0) / 100.0;
        $currency = strtoupper($invoice->currency ?? Config::get('stripe.currency', 'usd'));
        $paymentIntentId = $invoice->payment_intent ?? null;
        $invoiceId = $invoice->id ?? null;

        if (!$customerId) {
            Log::warning('Stripe invoice.payment_succeeded missing customer ID');
            return;
        }

        $user = \App\Models\User::where('stripe_customer_id', $customerId)->first();
        if (!$user) {
            Log::warning('Stripe invoice.payment_succeeded: User not found', ['customer_id' => $customerId]);
            return;
        }

        DB::transaction(function () use ($user, $subscriptionId, $invoice, $amountPaid, $currency, $paymentIntentId, $invoiceId) {
            // Find or create subscription
            $subscription = null;
            if ($subscriptionId) {
                $subscription = Subscription::where('stripe_subscription_id', $subscriptionId)
                    ->where('user_id', $user->id)
                    ->first();
            }

            // If subscription not found, try to find the latest subscription for this user
            if (!$subscription) {
                $subscription = Subscription::where('user_id', $user->id)
                    ->latest('id')
                    ->first();
            }

            // Get plan from invoice or subscription
            $planId = null;
            if ($subscription) {
                $planId = $subscription->subscription_plan_id;
            } else {
                // Try to get plan from invoice line items
                try {
                    $priceId = $invoice->lines->data[0]->price->id ?? null;
                    if ($priceId) {
                        $planId = SubscriptionPlan::where('stripe_price_id', $priceId)->value('id');
                    }
                } catch (\Throwable $e) {
                    Log::warning('Could not extract plan from invoice', ['error' => $e->getMessage()]);
                }
            }

            if (!$planId) {
                Log::warning('Stripe invoice.payment_succeeded: Plan not found', ['invoice_id' => $invoiceId]);
                return;
            }

            $plan = SubscriptionPlan::find($planId);
            if (!$plan) {
                return;
            }

            // Use payment_intent ID or invoice ID as transaction_id
            $transactionId = $paymentIntentId ?? $invoiceId ?? 'inv_' . time();

            // Check if transaction already exists to avoid duplicates
            $existingTransaction = PaymentTransaction::where('transaction_id', $transactionId)->first();
            if ($existingTransaction) {
                Log::info('Payment transaction already exists', ['transaction_id' => $transactionId]);
                return;
            }

            // Determine transaction type
            $transactionType = 'subscription';
            if ($subscription && $subscription->status === 'active') {
                $transactionType = 'renewal';
            }

            // Create payment transaction
            PaymentTransaction::create([
                'user_id' => $user->id,
                'subscription_id' => $subscription?->id,
                'transaction_id' => $transactionId,
                'payment_gateway' => 'stripe',
                'amount' => $amountPaid ?: $plan->price,
                'currency' => $currency,
                'status' => 'completed',
                'type' => $transactionType,
                'payment_method' => 'card',
                'payment_details' => json_encode([
                    'invoice_id' => $invoiceId,
                    'subscription_id' => $subscriptionId,
                    'billing_reason' => $invoice->billing_reason ?? null,
                ]),
                'gateway_response' => json_encode($invoice),
                'paid_at' => isset($invoice->status_transitions->paid_at) 
                    ? now()->setTimestamp($invoice->status_transitions->paid_at) 
                    : now(),
                'notes' => $invoice->billing_reason === 'subscription_create' 
                    ? 'Initial subscription payment' 
                    : 'Subscription renewal payment',
            ]);

            // Update subscription if it exists
            if ($subscription) {
                $subscription->update([
                    'status' => 'active',
                    'expires_at' => isset($invoice->period_end) 
                        ? now()->setTimestamp($invoice->period_end) 
                        : $subscription->expires_at,
                ]);
            }
        });
    }

    /**
     * Handle invoice.payment_failed event
     */
    protected function handleInvoicePaymentFailed($invoice): void
    {
        $customerId = $invoice->customer ?? null;
        $subscriptionId = $invoice->subscription ?? null;
        $amountDue = ($invoice->amount_due ?? 0) / 100.0;
        $currency = strtoupper($invoice->currency ?? Config::get('stripe.currency', 'usd'));
        $invoiceId = $invoice->id ?? null;

        if (!$customerId) {
            return;
        }

        $user = \App\Models\User::where('stripe_customer_id', $customerId)->first();
        if (!$user) {
            return;
        }

        DB::transaction(function () use ($user, $subscriptionId, $invoice, $amountDue, $currency, $invoiceId) {
            $subscription = null;
            if ($subscriptionId) {
                $subscription = Subscription::where('stripe_subscription_id', $subscriptionId)
                    ->where('user_id', $user->id)
                    ->first();
            }

            if (!$subscription) {
                $subscription = Subscription::where('user_id', $user->id)
                    ->latest('id')
                    ->first();
            }

            $planId = $subscription?->subscription_plan_id;
            if (!$planId) {
                try {
                    $priceId = $invoice->lines->data[0]->price->id ?? null;
                    if ($priceId) {
                        $planId = SubscriptionPlan::where('stripe_price_id', $priceId)->value('id');
                    }
                } catch (\Throwable $e) {
                    // ignore
                }
            }

            if (!$planId) {
                return;
            }

            $plan = SubscriptionPlan::find($planId);
            if (!$plan) {
                return;
            }

            $transactionId = 'failed_' . ($invoiceId ?? 'inv_' . time());

            // Check if transaction already exists
            $existingTransaction = PaymentTransaction::where('transaction_id', $transactionId)->first();
            if ($existingTransaction) {
                return;
            }

            PaymentTransaction::create([
                'user_id' => $user->id,
                'subscription_id' => $subscription?->id,
                'transaction_id' => $transactionId,
                'payment_gateway' => 'stripe',
                'amount' => $amountDue ?: $plan->price,
                'currency' => $currency,
                'status' => 'failed',
                'type' => 'subscription',
                'payment_method' => 'card',
                'payment_details' => json_encode([
                    'invoice_id' => $invoiceId,
                    'subscription_id' => $subscriptionId,
                    'attempt_count' => $invoice->attempt_count ?? 0,
                ]),
                'gateway_response' => json_encode($invoice),
                'notes' => 'Payment failed: ' . ($invoice->last_payment_error->message ?? 'Unknown error'),
            ]);
        });
    }

    /**
     * Handle payment_intent.succeeded as backup (for one-time payments or if invoice event is missed)
     */
    protected function handlePaymentIntentSucceeded($paymentIntent): void
    {
        $customerId = $paymentIntent->customer ?? null;
        $paymentIntentId = $paymentIntent->id ?? null;
        $amount = ($paymentIntent->amount ?? 0) / 100.0;
        $currency = strtoupper($paymentIntent->currency ?? Config::get('stripe.currency', 'usd'));

        if (!$customerId || !$paymentIntentId) {
            return;
        }

        // Check if transaction already exists
        $existingTransaction = PaymentTransaction::where('transaction_id', $paymentIntentId)->first();
        if ($existingTransaction) {
            return;
        }

        $user = \App\Models\User::where('stripe_customer_id', $customerId)->first();
        if (!$user) {
            return;
        }

        // Only create if no invoice transaction exists (to avoid duplicates)
        // This is a backup handler, so we check if an invoice transaction might have been created
        $recentTransaction = PaymentTransaction::where('user_id', $user->id)
            ->where('created_at', '>=', now()->subMinutes(5))
            ->where('status', 'completed')
            ->first();

        if ($recentTransaction) {
            // Likely already handled by invoice event
            return;
        }

        $subscription = Subscription::where('user_id', $user->id)
            ->latest('id')
            ->first();

        PaymentTransaction::create([
            'user_id' => $user->id,
            'subscription_id' => $subscription?->id,
            'transaction_id' => $paymentIntentId,
            'payment_gateway' => 'stripe',
            'amount' => $amount,
            'currency' => $currency,
            'status' => 'completed',
            'type' => 'subscription',
            'payment_method' => $paymentIntent->payment_method_types[0] ?? 'card',
            'payment_details' => json_encode([
                'payment_intent_id' => $paymentIntentId,
            ]),
            'gateway_response' => json_encode($paymentIntent),
            'paid_at' => now(),
            'notes' => 'Payment intent succeeded (backup handler)',
        ]);
    }

    /**
     * Handle payment_intent.payment_failed
     */
    protected function handlePaymentIntentFailed($paymentIntent): void
    {
        $customerId = $paymentIntent->customer ?? null;
        $paymentIntentId = $paymentIntent->id ?? null;
        $amount = ($paymentIntent->amount ?? 0) / 100.0;
        $currency = strtoupper($paymentIntent->currency ?? Config::get('stripe.currency', 'usd'));

        if (!$customerId || !$paymentIntentId) {
            return;
        }

        $existingTransaction = PaymentTransaction::where('transaction_id', $paymentIntentId)->first();
        if ($existingTransaction) {
            return;
        }

        $user = \App\Models\User::where('stripe_customer_id', $customerId)->first();
        if (!$user) {
            return;
        }

        $subscription = Subscription::where('user_id', $user->id)
            ->latest('id')
            ->first();

        PaymentTransaction::create([
            'user_id' => $user->id,
            'subscription_id' => $subscription?->id,
            'transaction_id' => $paymentIntentId,
            'payment_gateway' => 'stripe',
            'amount' => $amount,
            'currency' => $currency,
            'status' => 'failed',
            'type' => 'subscription',
            'payment_method' => $paymentIntent->payment_method_types[0] ?? 'card',
            'payment_details' => json_encode([
                'payment_intent_id' => $paymentIntentId,
                'error' => $paymentIntent->last_payment_error ?? null,
            ]),
            'gateway_response' => json_encode($paymentIntent),
            'notes' => 'Payment intent failed: ' . ($paymentIntent->last_payment_error->message ?? 'Unknown error'),
        ]);
    }
}


