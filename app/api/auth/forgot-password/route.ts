import { NextRequest, NextResponse } from 'next/server'
import { requestPasswordReset } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validate input
    if (!email) {
      return NextResponse.json(
        { message: 'Email address is required' },
        { status: 400 }
      )
    }

    if (!email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { message: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Request password reset (this will send email)
    const result = await requestPasswordReset(email)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Password reset request error:', error)
    
    return NextResponse.json(
      { message: 'Failed to send password reset email. Please try again.' },
      { status: 500 }
    )
  }
}
