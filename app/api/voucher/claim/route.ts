import { NextRequest, NextResponse } from 'next/server'
import { claimVoucher } from '@/lib/voucher-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, receiver_name, receiver_phone, network } = body

    // Validate input
    if (!code || !receiver_name || !receiver_phone || !network) {
      return NextResponse.json(
        { error: 'All fields are required: code, receiver_name, receiver_phone, network' },
        { status: 400 }
      )
    }

    // Validate field types and formats
    if (typeof code !== 'string' || typeof receiver_name !== 'string' || 
        typeof receiver_phone !== 'string' || typeof network !== 'string') {
      return NextResponse.json(
        { error: 'Invalid field types' },
        { status: 400 }
      )
    }

    // Claim voucher
    const result = await claimVoucher(code, receiver_name, receiver_phone, network)

    return NextResponse.json({
      success: result.success,
      message: result.message,
      voucher: result.voucher
    })

  } catch (error) {
    console.error('Claim voucher error:', error)
    return NextResponse.json(
      { error: 'Failed to claim voucher' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST /api/voucher/claim - Claim a voucher',
    body: {
      code: 'string (required) - Voucher code to claim',
      receiver_name: 'string (required) - Name of receiver',
      receiver_phone: 'string (required) - Phone number of receiver',
      network: 'string (required) - Mobile network (MTN, Vodafone, Airtel, etc.)'
    },
    response: {
      success: 'boolean',
      message: 'string - Result message',
      voucher: 'object - Updated voucher details if successful'
    }
  })
}
