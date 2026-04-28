import { Pool } from 'pg'
import { neon } from '@neondatabase/serverless'

// Database connection configuration
let pool: any

// Check if using Neon connection string
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon')) {
  // Use Neon serverless driver
  pool = neon(process.env.DATABASE_URL)
  console.log('Connected to Neon PostgreSQL database')
} else {
  // Use traditional PostgreSQL connection
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'voucher_remittance',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432'),
  })
  console.log('Connected to traditional PostgreSQL database')
}

// Test database connection
if (pool.on) {
  pool.on('connect', () => {
    console.log('Connected to PostgreSQL database')
  })

  pool.on('error', (err: any) => {
    console.error('Database connection error:', err)
  })
}

export default pool
