import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'API v2 deployed successfully',
    timestamp: new Date().toISOString(),
    version: '2.0'
  });
}
