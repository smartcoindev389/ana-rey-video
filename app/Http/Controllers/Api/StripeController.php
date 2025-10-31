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

class StripeController extends Controller
{
    /**
     * Create a Stripe Checkout Session for a subscription plan.
     */
    public function createCheckoutSession(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => 'required|integer|exists:subscription_plans,id',
            'success_url' => 'nullable|url',
            'cancel_url' => 'nullable|url',
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

        $successUrl = $validated['success_url'] ?? Config::get('stripe.success_url');
        $cancelUrl = $validated['cancel_url'] ?? Config::get('stripe.cancel_url');

        $client = new \Stripe\StripeClient($secret);

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

        $session = $client->checkout->sessions->create([
            'mode' => 'subscription',
            'customer' => $customerId,
            'line_items' => [[
                'price' => $plan->stripe_price_id,
                'quantity' => 1,
            ]],
            'success_url' => $successUrl . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => $cancelUrl,
            'client_reference_id' => (string) $user->id,
            'metadata' => [
                'user_id' => (string) $user->id,
                'plan_id' => (string) $plan->id,
            ],
        ]);

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
            $event = \Stripe\Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
        } catch (\UnexpectedValueException $e) {
            return new Response('Invalid payload', 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            return new Response('Invalid signature', 400);
        }

        switch ($event->type) {
            case 'checkout.session.completed':
                $this->handleCheckoutSessionCompleted($event->data->object);
                break;
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                $this->handleSubscriptionUpsert($event->data->object);
                break;
            case 'customer.subscription.deleted':
                $this->handleSubscriptionDeleted($event->data->object);
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

            // Create or extend subscription (pending until subscription object event arrives)
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
}


