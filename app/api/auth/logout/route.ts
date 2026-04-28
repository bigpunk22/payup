import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Clear the auth cookie
    const response = NextResponse.json({
      message: 'Logout successful'
    })

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // Immediately expire
    })

    return response

  } catch (error) {
    console.error('Logout error:', error)
    
    return NextResponse.json(
      { message: 'Logout failed. Please try again.' },
      { status: 500 }
    )
  }
}
