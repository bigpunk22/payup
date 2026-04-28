import { NextRequest, NextResponse } from 'next/server'
import { registerFirstUser } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, password } = await request.json()

    // Validate input
    if (!email || !fullName || !password) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Register the first user
    const user = await registerFirstUser(email, password, fullName)

    return NextResponse.json({
      message: 'Admin account created successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        isAdmin: user.is_admin
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { message: 'Registration is disabled. An account already exists.' },
          { status: 403 }
        )
      }
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { message: 'An account with this email already exists' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { message: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
