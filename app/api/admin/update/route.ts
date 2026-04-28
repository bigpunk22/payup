import { NextRequest, NextResponse } from 'next/server'
import { updateVoucherStatus } from '@/lib/voucher-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, status } = body

    // Validate input
    if (!code || !status) {
      return NextResponse.json(
        { error: 'Both code and status are required' },
        { status: 400 }
      )
    }

    // Validate status value
    if (status !== 'completed' && status !== 'rejected') {
      return NextResponse.json(
        { error: 'Status must be either "completed" or "rejected"' },
        { status: 400 }
      )
    }

    // Update voucher status
    const result = await updateVoucherStatus(code, status)

    return NextResponse.json({
      success: result.success,
      message: result.message,
      voucher: result.voucher
    })

  } catch (error) {
    console.error('Update voucher status error:', error)
    return NextResponse.json(
      { error: 'Failed to update voucher status' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST /api/admin/update - Update voucher status',
    body: {
      code: 'string (required) - Voucher code to update',
      status: 'string (required) - New status: "completed" or "rejected"'
    },
    response: {
      success: 'boolean',
      message: 'string - Result message',
      voucher: 'object - Updated voucher details if successful'
    }
  })
}
