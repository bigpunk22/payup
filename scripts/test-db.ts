import pool from '../lib/db'

async function testConnection() {
  try {
    console.log('Testing database connection...')
    
    // Simple test query
    const result = await pool('SELECT NOW() as current_time')
    console.log('Database connection successful!')
    console.log('Current time:', result[0]?.current_time)
    
    // Test table creation
    console.log('Creating vouchers table...')
    const createTable = await pool(`
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
      )
    `)
    console.log('Table created successfully')
    
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

testConnection()
