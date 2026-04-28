import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Configuration interface
interface Config {
  today_rate: number;
  percentage: number;
  updated_at: string;
}

export async function GET() {
  try {
    // Check if config table exists
    const tableCheck = await pool`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'config'
      );
    `;

    if (!tableCheck[0].exists) {
      // Create config table
      await pool`
        CREATE TABLE config (
          id SERIAL PRIMARY KEY,
          today_rate DECIMAL(10,2) NOT NULL DEFAULT 12.5,
          percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      // Insert default config
      await pool`
        INSERT INTO config (today_rate, percentage) 
        VALUES (12.5, 0.00);
      `;
    }

    // Get latest config
    const result = await pool`
      SELECT today_rate, percentage, updated_at 
      FROM config 
      ORDER BY updated_at DESC 
      LIMIT 1;
    `;

    const config = result[0];

    return NextResponse.json({
      success: true,
      config: {
        today_rate: parseFloat(config.today_rate),
        percentage: parseFloat(config.percentage),
        updated_at: config.updated_at
      }
    });
  } catch (error) {
    console.error('Get config error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch configuration'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { today_rate, percentage } = body;

    // Validate input
    if (!today_rate || !percentage || 
        typeof today_rate !== 'number' || 
        typeof percentage !== 'number' ||
        today_rate <= 0 || 
        percentage < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid configuration values' },
        { status: 400 }
      );
    }

    // Update or insert config
    await pool`
      INSERT INTO config (today_rate, percentage) 
      VALUES (${today_rate}, ${percentage});
    `;

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      config: {
        today_rate,
        percentage,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Update config error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update configuration'
      },
      { status: 500 }
    );
  }
}
