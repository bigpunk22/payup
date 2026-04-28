import { NextRequest, NextResponse } from 'next/server'
import { hasAnyUsers } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const setupAvailable = !(await hasAnyUsers())
    
    return NextResponse.json({ 
      setupAvailable,
      message: setupAvailable 
        ? 'Setup is available - no users exist' 
        : 'Setup not available - users already exist'
    })
  } catch (error) {
    console.error('Error checking setup availability:', error)
    return NextResponse.json(
      { error: 'Failed to check setup availability' },
      { status: 500 }
    )
  }
}
