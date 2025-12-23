# Stripe Setup Guide - Step by Step

## Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Click "Start now" or "Sign up"
3. Enter your email and create a password
4. Verify your email address
5. Complete basic account information (name, business type, etc.)

**Note:** You can use test mode immediately - no credit card required!

## Step 2: Get Your API Keys

1. Once logged in, you'll be in **Test mode** by default (toggle in top right)
2. Go to **Developers** → **API keys** (or click https://dashboard.stripe.com/test/apikeys)
3. You'll see:
   - **Publishable key** (starts with `pk_test_`) - Not needed for backend
   - **Secret key** (starts with `sk_test_`) - **COPY THIS**
4. Click "Reveal test key" to see the secret key
5. Copy the secret key - this is your `STRIPE_SECRET_KEY`

## Step 3: Create Subscription Plan Products

### Create Starter Plan ($10/month)

1. Go to **Products** → **Add product** (or https://dashboard.stripe.com/test/products)
2. Fill in:
   - **Name:** `Carouslk Starter`
   - **Description:** `Unlimited projects & exports, 20 AI generations/month`
   - **Pricing model:** `Recurring`
   - **Price:** `$10.00`
   - **Billing period:** `Monthly`
   - **Currency:** `USD`
3. Click **Save product**
4. After saving, you'll see a **Price ID** (starts with `price_`) - **COPY THIS**
   - This is your `STRIPE_STARTER_PRICE_ID`

### Create Pro Plan ($19/month)

1. Go to **Products** → **Add product** (or https://dashboard.stripe.com/test/products)
2. Fill in:
   - **Name:** `Carouslk Pro`
   - **Description:** `Unlimited everything - projects, exports, AI features, and more`
   - **Pricing model:** `Recurring`
   - **Price:** `$19.00`
   - **Billing period:** `Monthly`
   - **Currency:** `USD`
3. Click **Save product**
4. After saving, you'll see a **Price ID** (starts with `price_`) - **COPY THIS**
   - This is your `STRIPE_PRO_PRICE_ID`

## Step 4: Set Up Webhook (For Local Testing)

### Option A: Using Stripe CLI (Recommended for Development)

1. **Install Stripe CLI:**
   - Windows: Download from https://github.com/stripe/stripe-cli/releases
   - Or use: `scoop install stripe` (if you have Scoop)
   - Or: `winget install stripe.stripe-cli`

2. **Login to Stripe CLI:**
   ```bash
   stripe login
   ```
   This will open your browser to authorize

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/subscription/webhook
   ```
   
4. **Copy the webhook signing secret** (starts with `whsec_`)
   - This is your `STRIPE_WEBHOOK_SECRET` for local development

### Option B: Using Stripe Dashboard (For Production)

1. Go to **Developers** → **Webhooks** (https://dashboard.stripe.com/test/webhooks)
2. Click **Add endpoint**
3. Enter endpoint URL:
   - Local: `http://localhost:3000/api/subscription/webhook` (for testing)
   - Production: `https://yourdomain.com/api/subscription/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Click on the endpoint to view details
7. Click **Reveal** next to "Signing secret"
8. Copy the signing secret (starts with `whsec_`)
   - This is your `STRIPE_WEBHOOK_SECRET`

## Step 5: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_STARTER_PRICE_ID=price_YOUR_STARTER_PRICE_ID_HERE
STRIPE_PRO_PRICE_ID=price_YOUR_PRO_PRICE_ID_HERE

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:** 
- Never commit `.env.local` to git (it should be in `.gitignore`)
- Use test keys for development
- Switch to live keys when going to production

## Step 6: Test the Integration

### Test Cards (Stripe Test Mode)

Use these test card numbers:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Authentication:** `4000 0025 0000 3155`

For all test cards:
- **Expiry:** Any future date (e.g., `12/34`)
- **CVC:** Any 3 digits (e.g., `123`)
- **ZIP:** Any 5 digits (e.g., `12345`)

### Testing Steps

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Start Stripe webhook forwarding** (if using CLI):
   ```bash
   stripe listen --forward-to localhost:3000/api/subscription/webhook
   ```

3. **Test the checkout flow:**
   - Go to http://localhost:3000/pricing
   - Click "Start Free Trial" on Pro plan
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout
   - Check `/dashboard/billing` to see subscription status

4. **Verify webhook events:**
   - Check Stripe dashboard → **Developers** → **Events**
   - You should see events like `checkout.session.completed`

## Step 7: Switch to Live Mode (When Ready)

1. In Stripe dashboard, toggle from **Test mode** to **Live mode**
2. Get your **Live API keys** from **Developers** → **API keys**
3. Create the product again in **Live mode** (test and live are separate)
4. Set up webhook endpoint with your production URL
5. Update `.env.local` with live keys
6. Deploy to production

## Troubleshooting

### Webhook not receiving events?
- Make sure webhook URL is correct
- Check that Stripe CLI is running (if using local forwarding)
- Verify webhook secret matches
- Check server logs for errors

### Checkout not working?
- Verify `STRIPE_SECRET_KEY` is correct
- Verify `STRIPE_PRO_PRICE_ID` is correct
- Check browser console for errors
- Check server logs

### Subscription not updating?
- Verify webhook is set up correctly
- Check webhook events in Stripe dashboard
- Verify webhook secret matches
- Check database for subscription records

## Security Notes

- **Never expose secret keys** in client-side code
- **Always use environment variables** for sensitive data
- **Use test mode** for development
- **Verify webhook signatures** (already implemented in code)
- **Use HTTPS** in production

## Need Help?

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test Mode Guide: https://stripe.com/docs/testing

