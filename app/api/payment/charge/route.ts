import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Helper function to check if Paystack is configured
const isPaystackConfigured = () => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  console.log('Paystack key configured:', !!key);
  console.log('Key starts with sk_:', key?.startsWith('sk_'));
  console.log('Environment variables available:', Object.keys(process.env).filter(k => k.includes('PAYSTACK')));
  return !!key;
};

// We'll use Paystack's default currency (NGN) and let Paystack handle conversion
// Paystack will automatically convert based on the card's currency

export async function POST(request: NextRequest) {
  console.log('=== PAYMENT CHARGE API CALLED (v2 - NO MOCK) ===');
  
  try {
    const body = await request.json();
    const { amount_usd, card, email, pin } = body;
    
    console.log('Request body:', { amount_usd, cardNumber: card?.number?.slice(-4), email });

    // Validate input
    if (!amount_usd || typeof amount_usd !== 'number' || amount_usd <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount provided' },
        { status: 400 }
      );
    }

    if (!card || !card.number || !card.expiry || !card.cvv) {
      return NextResponse.json(
        { success: false, error: 'Invalid card details provided' },
        { status: 400 }
      );
    }

    // Check if Paystack is configured
    const paystackConfigured = isPaystackConfigured();
    console.log('Paystack configuration check result:', paystackConfigured);
    
    if (!paystackConfigured) {
      console.error('Paystack not configured - please add PAYSTACK_SECRET_KEY');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment system not configured. Please contact support.' 
        },
        { status: 500 }
      );
    }

    // Paystack needs explicit currency specification
    // We'll charge in USD and let Paystack handle conversion for non-USD cards
    // For USD cards: charge $1 USD (100 cents) - no conversion needed
    // For GHS/NGN cards: Paystack converts USD → local currency automatically
    const amount_in_cents = Math.round(amount_usd * 100); // Amount in cents (USD)

    // Parse card expiry
    const [expiryMonth, expiryYear] = card.expiry.split('/');
    const formattedYear = expiryYear.length === 2 ? `20${expiryYear}` : expiryYear;

    // Generate unique reference
    const reference = `VOU_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Call Paystack API to charge card directly
    console.log('Attempting Paystack charge with amount:', amount_in_cents, 'cents');
    
    const chargePayload: any = {
      amount: amount_in_cents,
      currency: 'USD', // Explicitly set currency to USD
      email: email || 'customer@voucherapp.com',
      card: {
        number: card.number.replace(/\s/g, ''), // Remove spaces
        cvv: card.cvv,
        expiry_month: parseInt(expiryMonth),
        expiry_year: parseInt(formattedYear)
      },
      reference,
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
    };

    // Only add pin if provided
    if (pin) {
      chargePayload.pin = pin;
    }

    console.log('Charge payload:', JSON.stringify(chargePayload, null, 2));

    const paystackResponse = await fetch('https://api.paystack.co/charge', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chargePayload)
    });

    const paystackData = await paystackResponse.json();
    console.log('Paystack response:', JSON.stringify(paystackData, null, 2));

    if (!paystackData.status) {
      console.error('Paystack charge error:', paystackData);
      return NextResponse.json(
        { 
          success: false, 
          error: paystackData.message || 'Failed to process payment',
          reference: paystackData.reference 
        },
        { status: 400 }
      );
    }

    console.log('Paystack response status:', paystackData.data.status);

    // Handle different Paystack response statuses
    if (paystackData.data.status === 'open_url') {
      // Paystack requires 3D Secure authentication - redirect to auth page
      return NextResponse.json({
        success: true,
        requires_auth: true,
        authorization_url: paystackData.data.url,
        reference: paystackData.data.reference,
        amount_usd,
        message: 'Please complete authentication to complete payment'
      });
    }

    if (paystackData.data.status === 'success') {
      // Payment was successful - generate voucher code
      const voucherCode = `VOU-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      return NextResponse.json({
        success: true,
        reference: paystackData.data.reference,
        amount_usd,
        voucher_code: voucherCode,
        message: 'Payment processed successfully'
      });
    }

    // Handle other statuses
    return NextResponse.json(
      { 
        success: false, 
        error: `Payment status: ${paystackData.data.status}. Please try again.`,
        reference: paystackData.data.reference 
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Payment charge error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
