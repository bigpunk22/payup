import { NextRequest, NextResponse } from 'next/server'
import { createVoucher } from '@/lib/voucher-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount_usd } = body

    // Validate input
    if (!amount_usd || isNaN(amount_usd) || amount_usd <= 0) {
      return NextResponse.json(
        { error: 'Valid amount_usd is required' },
        { status: 400 }
      )
    }

    // Create voucher
    const result = await createVoucher(parseFloat(amount_usd))

    return NextResponse.json({
      success: true,
      voucher_code: result.code,
      amount_ghs: result.amount_ghs,
      amount_usd: parseFloat(amount_usd)
    })

  } catch (error) {
    console.error('Create voucher error:', error)
    return NextResponse.json(
      { error: 'Failed to create voucher' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST /api/voucher/create - Create a new voucher',
    body: {
      amount_usd: 'number (required) - Amount in USD'
    },
    response: {
      success: 'boolean',
      voucher_code: 'string - Generated voucher code',
      amount_ghs: 'number - Amount in GHS',
      amount_usd: 'number - Amount in USD'
    }
  })
}
