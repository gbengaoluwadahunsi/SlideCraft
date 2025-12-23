# Payment & Subscription System Setup

## Overview

A complete payment and subscription management system has been implemented using Stripe. This includes:

1. **Database Schema** - Subscription tracking tables
2. **Stripe Integration** - Checkout, webhooks, subscription management
3. **Plan Limits** - Enforcement of free/pro/enterprise limits
4. **Usage Tracking** - Monthly usage tracking for exports, AI generations, projects
5. **Subscription Management UI** - Billing page with subscription controls

## Database Changes

New tables added:
- `subscriptions` - Detailed subscription records
- `subscription_usage` - Monthly usage tracking
- `payments` - Payment history

New columns added to `users` table:
- `plan` - Current plan (free/pro/enterprise)
- `subscription_status` - Status (active/trialing/past_due/canceled)
- `subscription_start_date` - When subscription started
- `subscription_end_date` - When subscription renews/ends
- `trial_end_date` - When trial ends (if applicable)
- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_id` - Stripe subscription ID

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret (get from Stripe dashboard)
STRIPE_STARTER_PRICE_ID=price_... # Stripe Price ID for Starter plan ($10/month)
STRIPE_PRO_PRICE_ID=price_... # Stripe Price ID for Pro plan ($19/month)

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Or your production URL
```

## Stripe Setup Steps

1. **Create Stripe Account**
   - Sign up at https://stripe.com
   - Get your API keys from the dashboard

2. **Create Subscription Plan Products & Prices**
   - Go to Products in Stripe dashboard
   - Create a new product: "Carouslk Starter"
     - Add a recurring price: $10/month
     - Copy the Price ID (starts with `price_`)
     - Add it to `STRIPE_STARTER_PRICE_ID` in `.env.local`
   - Create a new product: "Carouslk Pro"
     - Add a recurring price: $19/month
     - Copy the Price ID (starts with `price_`)
     - Add it to `STRIPE_PRO_PRICE_ID` in `.env.local`

3. **Set Up Webhook**
   - Go to Developers > Webhooks in Stripe dashboard
   - Add endpoint: `https://yourdomain.com/api/subscription/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

4. **Test Mode**
   - Use test API keys for development
   - Test cards: https://stripe.com/docs/testing

## Plan Limits

### Free Plan
- 5 projects
- 5 exports/month
- 5 AI generations/month
- No brand customization
- No project sharing
- Basic templates only

### Starter Plan ($10/month)
- Unlimited projects
- Unlimited exports
- 20 AI generations/month
- Brand customization
- Project sharing
- All templates
- 14-day free trial

### Pro Plan ($19/month)
- Unlimited projects
- Unlimited exports
- Unlimited AI generations
- All advanced AI features (image generation, research, performance prediction)
- Brand customization
- Project sharing
- All templates
- Priority support
- 14-day free trial

### Enterprise Plan
- Contact sales (custom pricing)
- All Pro features plus:
  - Advanced analytics
  - Team collaboration
  - API access
  - White-label
  - Custom AI training

## API Endpoints

### `/api/subscription/checkout` (POST)
Creates a Stripe checkout session for upgrading to Pro.

### `/api/subscription/status` (GET)
Returns current subscription status and usage.

### `/api/subscription/cancel` (POST)
Cancels subscription at period end.

### `/api/subscription/resume` (POST)
Resumes a canceled subscription.

### `/api/subscription/webhook` (POST)
Stripe webhook handler for subscription events.

## Plan Limit Enforcement

Plan limits are enforced in:
- `/api/projects` - Project creation limit
- `/api/export` - Export limit
- `/api/generate` - AI generation limit
- `/api/user/brand-settings` - Brand customization (Pro only)
- `/api/projects/[id]/share` - Project sharing (Pro only)

## UI Components

### SubscriptionManager Component
Located at `/components/SubscriptionManager.tsx`
- Shows current plan and status
- Displays usage statistics
- Upgrade/cancel/resume controls

### Billing Page
Located at `/app/dashboard/billing/page.tsx`
- Full subscription management interface
- Accessible from dashboard header (CreditCard icon)

## Usage Tracking

Usage is tracked monthly and resets at the start of each month:
- **Projects**: Count of total projects (not monthly)
- **Exports**: Monthly count of PDF/PPT exports
- **AI Generations**: Monthly count of AI content generations

## Subscription Lifecycle

1. **Checkout**: User clicks "Upgrade to Pro" → Stripe checkout
2. **Trial**: 14-day free trial starts
3. **Active**: After trial, subscription becomes active
4. **Renewal**: Auto-renews monthly
5. **Cancellation**: Can cancel at period end
6. **Downgrade**: Automatically downgrades to free when canceled

## Testing

1. Use Stripe test mode
2. Test with test cards (4242 4242 4242 4242)
3. Use Stripe CLI to forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/subscription/webhook
   ```
4. Check subscription status at `/dashboard/billing`

## Migration

The database schema will be automatically updated on next app start. Existing users will default to the "free" plan.


