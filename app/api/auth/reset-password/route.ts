import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    // Validate input
    if (!token || !password) {
      return NextResponse.json(
        { message: 'Reset token and new password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Reset the password
    const result = await resetPassword(token, password)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Password reset error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid or expired')) {
        return NextResponse.json(
          { message: 'Invalid or expired reset token' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { message: 'Failed to reset password. Please try again.' },
      { status: 500 }
    )
  }
}
