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

// We'll use Paystack's default currency (NGN) and let Paystack handle conversion
// Paystack will automatically convert based on the card's currency

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount_usd, card, email, pin } = body;

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

    // Bypass payment if Paystack is not configured
    if (!isPaystackConfigured()) {
      console.log('Paystack not configured - using mock payment flow');
      
      // Generate unique reference
      const reference = `VOU_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      // Simulate successful payment
      return NextResponse.json({
        success: true,
        reference,
        amount_usd,
        voucher_code: `VOU-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        mock_payment: true,
        message: 'Mock payment - add PAYSTACK_SECRET_KEY to enable real payments'
      });
    }

    // Convert USD to Kobo (smallest currency unit)
    // Paystack expects amount in kobo and will handle currency conversion automatically
    // Using approximate rate: 1 USD ≈ 1600 NGN (Paystack will adjust based on real rates)
    const amount_ngn = Math.round(amount_usd * 1600 * 100); // Convert to kobo

    // Parse card expiry
    const [expiryMonth, expiryYear] = card.expiry.split('/');
    const formattedYear = expiryYear.length === 2 ? `20${expiryYear}` : expiryYear;

    // Generate unique reference
    const reference = `VOU_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Call Paystack API to charge card directly
    const paystackResponse = await fetch('https://api.paystack.co/charge', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount_ngn,
        email: email || 'customer@voucherapp.com',
        card: {
          number: card.number.replace(/\s/g, ''), // Remove spaces
          cvv: card.cvv,
          expiry_month: parseInt(expiryMonth),
          expiry_year: parseInt(formattedYear)
        },
        reference,
        pin: pin, // Optional PIN if required
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

    // Generate voucher code on successful payment
    const voucherCode = `VOU-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      reference: paystackData.data.reference,
      amount_usd,
      voucher_code: voucherCode,
      message: 'Payment processed successfully'
    });

  } catch (error) {
    console.error('Payment charge error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
