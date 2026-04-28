import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Helper function to check if Paystack is configured
const isPaystackConfigured = () => {
  return !!process.env.PAYSTACK_SECRET_KEY;
};

// Exchange rate: 1 USD = 12.5 GHS
const EXCHANGE_RATE = 12.5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount_usd } = body;

    // Validate input
    if (!amount_usd || typeof amount_usd !== 'number' || amount_usd <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount provided' },
        { status: 400 }
      );
    }

    // Convert USD to Kobo (smallest currency unit)
    // Paystack expects amount in kobo (1 NGN = 100 kobo)
    // Using current rate: 1 USD ≈ 1520 NGN (April 2026 rate)
    const amount_ngn = Math.round(amount_usd * 1520 * 100); // Convert to kobo

    // Generate unique reference
    const reference = `VOU_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Check if Paystack is configured
    if (!isPaystackConfigured()) {
      console.error('Paystack not configured - please add PAYSTACK_SECRET_KEY');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment system not configured. Please contact support.' 
        },
        { status: 500 }
      );
    }

    // Call Paystack API to initialize transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount_usd * 100), // Amount in cents (USD)
        currency: 'USD', // Explicitly set currency to USD
        email: 'customer@voucherapp.com', // Placeholder email
        reference,
        callback_url: `${BASE_URL}/payment/callback`,
        metadata: {
          amount_usd,
          custom_fields: [
            {
              display_name: "Voucher Purchase",
              variable_name: "voucher_purchase",
              value: `USD ${amount_usd}`
            }
          ]
        }
      })
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      console.error('Paystack initialization error:', paystackData);
      return NextResponse.json(
        { success: false, error: 'Failed to initialize payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
      amount_usd
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
