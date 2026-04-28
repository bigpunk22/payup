import { NextRequest, NextResponse } from 'next/server'
import { validateVoucher } from '@/lib/voucher-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    // Validate input
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Valid voucher code is required' },
        { status: 400 }
      )
    }

    // Validate voucher
    const result = await validateVoucher(code)

    return NextResponse.json({
      success: true,
      valid: result.valid,
      amount_usd: parseFloat(result.amount_usd),
      amount_ghs: parseFloat(result.amount_ghs),
      status: result.status,
      message: result.message
    })

  } catch (error) {
    console.error('Validate voucher error:', error)
    return NextResponse.json(
      { error: 'Failed to validate voucher' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST /api/voucher/validate - Validate a voucher code',
    body: {
      code: 'string (required) - Voucher code to validate'
    },
    response: {
      success: 'boolean',
      valid: 'boolean - Whether voucher is valid',
      amount_ghs: 'number - Amount in GHS if valid',
      status: 'string - Current voucher status',
      message: 'string - Validation message'
    }
  })
}
