import { NextResponse } from 'next/server'
import { getAllVouchers } from '@/lib/voucher-utils'

export async function GET() {
  try {
    const vouchers = await getAllVouchers()

    return NextResponse.json({
      success: true,
      count: vouchers.length,
      vouchers: vouchers
    })

  } catch (error) {
    console.error('Get vouchers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vouchers' },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'GET /api/admin/vouchers - Get all vouchers for admin',
    response: {
      success: 'boolean',
      count: 'number - Total number of vouchers',
      vouchers: 'array - List of all vouchers'
    }
  })
}
