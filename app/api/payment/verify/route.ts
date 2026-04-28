import { NextRequest, NextResponse } from 'next/server';
import { createVoucher } from '@/lib/voucher-utils';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  throw new Error('PAYSTACK_SECRET_KEY is not configured');
}

// Exchange rate: 1 USD = 12.5 GHS
const EXCHANGE_RATE = 12.5;

// Store processed references to prevent duplicate verification
const processedReferences = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference } = body;

    // Validate input
    if (!reference || typeof reference !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid reference provided' },
        { status: 400 }
      );
    }

    // Check for duplicate verification
    if (processedReferences.has(reference)) {
      return NextResponse.json(
        { success: false, error: 'Payment already verified' },
        { status: 400 }
      );
    }

    // Call Paystack API to verify transaction
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      console.error('Paystack verification error:', paystackData);
      return NextResponse.json(
        { success: false, error: 'Failed to verify payment' },
        { status: 500 }
      );
    }

    const transaction = paystackData.data;

    // Verify payment status
    if (transaction.status !== 'success') {
      return NextResponse.json(
        { success: false, error: `Payment not successful. Status: ${transaction.status}` },
        { status: 400 }
      );
    }

    // Extract amount from metadata
    const amount_usd = transaction.metadata?.amount_usd;
    const expected_amount_ghs = transaction.metadata?.amount_ghs;

    if (!amount_usd || !expected_amount_ghs) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment metadata' },
        { status: 400 }
      );
    }

    // Verify amount (convert from kobo back to NGN, then to GHS, then to USD for verification)
    const paid_amount_ngn = transaction.amount / 100; // Convert from kobo to NGN
    const paid_amount_ghs = paid_amount_ngn / 0.16; // Convert NGN to GHS
    const paid_amount_usd = paid_amount_ghs / EXCHANGE_RATE; // Convert GHS to USD

    // Allow small rounding differences (within 1%)
    const amount_difference = Math.abs(paid_amount_usd - amount_usd);
    const tolerance_percentage = amount_difference / amount_usd;

    if (tolerance_percentage > 0.01) { // More than 1% difference
      console.error('Amount mismatch:', {
        expected: amount_usd,
        paid: paid_amount_usd,
        difference: amount_difference,
        tolerance: tolerance_percentage
      });
      return NextResponse.json(
        { success: false, error: 'Amount verification failed' },
        { status: 400 }
      );
    }

    // Mark reference as processed (in production, use Redis or database)
    processedReferences.add(reference);

    // Create voucher after successful payment verification
    try {
      const voucher = await createVoucher(parseFloat(amount_usd));

      return NextResponse.json({
        success: true,
        message: 'Payment verified and voucher created successfully',
        voucher: {
          code: voucher.code,
          amount_usd: parseFloat(amount_usd),
          amount_ghs: parseFloat(voucher.amount_ghs)
        },
        payment_details: {
          reference,
          amount_paid: paid_amount_usd,
          currency: 'USD',
          paid_at: transaction.paid_at
        }
      });

    } catch (voucherError) {
      console.error('Voucher creation error:', voucherError);
      return NextResponse.json(
        { success: false, error: 'Payment verified but failed to create voucher' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
