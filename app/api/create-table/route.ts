import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS vouchers (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        amount_usd DECIMAL(10,2) NOT NULL,
        amount_ghs DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'paid',
        receiver_name VARCHAR(255),
        receiver_phone VARCHAR(20),
        network VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        claimed_at TIMESTAMP
      );
    `
    
    await pool(createTableQuery)
    console.log('Table created successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Vouchers table created successfully'
    })
  } catch (error) {
    console.error('Error creating table:', error)
    return NextResponse.json(
      { error: 'Failed to create table', details: error },
      { status: 500 }
    )
  }
}
