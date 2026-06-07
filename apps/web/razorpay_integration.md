# End-to-End Razorpay Payment Gateway Integration Guide

This document describes how the Razorpay payment gateway integration is configured and executed end-to-end within the Envitra monorepo (Next.js + Supabase).

---

## Step 1: Razorpay Dashboard Configuration

To process payments (both in **Test Mode** for local development and **Live Mode** for production), you must obtain credentials from the Razorpay Dashboard.

1. **Sign Up / Log In**: Go to [Razorpay Dashboard](https://dashboard.razorpay.com/) and register a developer account.
2. **Switch to Test Mode**: Locate the toggle in the top-right corner of the dashboard header and switch it to **Test Mode** (or **Live Mode** if you are ready to launch).
3. **Generate API Keys**:
   - In the left sidebar, navigate to **Account & Settings** > **API Keys**.
   - Click **Generate Key** to produce a new credentials set.
   - Copy down the **Key ID** and the **Key Secret**. Store the Secret securely, as it cannot be retrieved again.

---

## Step 2: Configure Environment Variables

Create or update the environment variables file (`apps/web/.env.local` or your production server settings) with your newly generated credentials:

```bash
# Public key accessible by the browser to render the checkout widget
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_yourPublicKeyHere"

# Private backend keys (Never expose to client-side code!)
RAZORPAY_KEY_ID="rzp_test_Sx28aHbbq0hN1b"
RAZORPAY_KEY_SECRET="mmTD4n0WUa4GgoWgJza7MfIx"
```

---

## Step 3: Server-Side Backend API Routes (Node.js/Next.js)

The backend routes are implemented inside the Next.js router. They handle order generation and payment verification securely:

### A. Order Creation (`/api/payment/create-order`)
* **File Location**: [route.ts](file:///d:/1-Manoj/projects/envitra/apps/web/app/api/payment/create-order/route.ts)
* **How it works**:
  1. Authenticates the active user session with Supabase auth.
  2. Receives the `cart` items, chosen `plan`, and `shipping` details in the request body.
  3. Calculates the total amount in **paise** (1 rupee = 100 paise) to prevent decimal precision errors:
     - Base price (₹499 per card) + upgrades (+₹200 metallic, +₹100 custom background, +₹50 brand logo).
     - Calculates 18% GST on the cards.
     - Adds Pro plan upgrade (₹199) **only** if the user isn't already subscribed to the Pro plan.
  4. Triggers the Razorpay Order API to create a unique checkout order ID:
     ```javascript
     const rzpOrder = await razorpay.orders.create({
       amount: total, // in paise
       currency: 'INR',
       receipt: `rcpt_${Date.now()}`
     });
     ```
  5. Inserts a new database record in `orders` table (status: `pending_payment`) and associated cards inside `order_items` table.
  6. Returns the `orderId`, `razorpayOrderId`, and public `key` back to the frontend.

### B. Payment Verification (`/api/payment/verify`)
* **File Location**: [route.ts](file:///d:/1-Manoj/projects/envitra/apps/web/app/api/payment/verify/route.ts)
* **How it works**:
  1. Validates the signature sent back by the Razorpay client widget to verify the transaction wasn't spoofed.
  2. The signature is verified using HMAC SHA256 hashing:
     ```javascript
     const generated_signature = crypto
       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
       .update(razorpay_order_id + '|' + razorpay_payment_id)
       .digest('hex');
     ```
  3. If signatures match (or a mock identifier `pay_mock_*` is used in development/test scenarios):
     - Updates order status to `pending_production` in Supabase.
     - Saves the `razorpay_payment_id` and stamps the payment date (`paid_at`).
     - Generates a custom Invoice Number (`INV-YYYY-XXXX`).
     - If the user purchased the **Pro Profile Plan**, automatically updates their active plan status in the `accounts` table to `pro` and sets an expiry date (+30 days).
     - Inserts a real-time notification into the `admin_notifications` table to alert production managers.

---

## Step 4: Client-Side Checkout Widget Configuration

The frontend orchestrates the payment flow inside [checkout/page.tsx](file:///d:/1-Manoj/projects/envitra/apps/web/app/(store)/checkout/page.tsx) at **Step 4: Review & Pay**:

1. **Loads Razorpay SDK**: Dynamically injects the official checkout script on mount:
   ```tsx
   <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
   ```
2. **Launches Widget**: When the user clicks the payment button:
   - Dispatches a request to `/api/payment/create-order` to register the session on Razorpay and generate the server order details.
   - Renders the custom Razorpay dialog options overlay:
     ```javascript
     const options = {
       key: orderData.key,
       amount: orderData.amount,
       currency: 'INR',
       name: 'Envitra Smart Cards',
       description: 'Order of customized smart cards',
       order_id: orderData.razorpayOrderId,
       handler: function (response) {
         // Passes order validation details to /api/payment/verify route
         verifyPayment(response);
       },
       prefill: {
         name: shipping.fullName,
         email: shipping.email,
         contact: shipping.phone
       },
       theme: { color: '#7C3AED' } // Envitra Brand Purple Accent
     };
     const rzp = new window.Razorpay(options);
     rzp.open();
     ```

---

## Step 5: Testing Local Checkouts

1. **Mock Checkout**: If Razorpay variables are not configured in your `.env.local` file, the checkout flow triggers an **offline fallback mode**. It creates a mock payment code `pay_mock_*` and bypasses Razorpay script loading to let you test order placement, database insertions, and redirect completions locally.
2. **Sandbox Payment credentials**: To test with the real Razorpay widget in sandbox mode:
   - Initiate a payment.
   - Enter mock phone numbers/emails when prompted by the overlay.
   - Choose **Netbanking** or **UPI** as the payment method.
   - Razorpay will redirect to a simulated payment page. Click **Success** to verify the end-to-end database callback handler.
