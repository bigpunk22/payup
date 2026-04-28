import { NextRequest, NextResponse } from 'next/server'
import { verifyResetToken } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    // Validate input
    if (!token) {
      return NextResponse.json(
        { message: 'Reset token is required' },
        { status: 400 }
      )
    }

    // Verify the reset token
    const decoded = verifyResetToken(token)

    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      valid: true,
      message: 'Reset token is valid' 
    })

  } catch (error) {
    console.error('Token verification error:', error)
    
    return NextResponse.json(
      { message: 'Failed to verify reset token' },
      { status: 500 }
    )
  }
}
