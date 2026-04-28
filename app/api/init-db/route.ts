import { NextResponse } from 'next/server'
import { createVouchersTable } from '@/lib/voucher-utils'

export async function POST() {
  try {
    await createVouchersTable()
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    })
  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST /api/init-db - Initialize database and create vouchers table'
  })
}
