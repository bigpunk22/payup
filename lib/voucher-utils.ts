import pool from './db'
import { mockDb, initializeMockData } from './mock-db'

// Exchange rate (fixed for MVP)
const EXCHANGE_RATE = 12.5 // 1 USD = 12.5 GHS

// Use mock database if PostgreSQL is not available
const useMockDb = !process.env.DATABASE_URL && !process.env.DB_HOST

// Generate unique voucher code
export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'GH-'
  
  // Generate 4 characters, dash, 4 characters
  for (let i = 0; i < 2; i++) {
    if (i > 0) code += '-'
    for (let j = 0; j < 4; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
  }
  
  return code
}

// Create vouchers table
export async function createVouchersTable() {
  if (useMockDb) {
    await initializeMockData()
    return
  }

  const query = `
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
  
  try {
    const db = useMockDb ? mockDb : pool
    await db(query)
    console.log('Vouchers table created successfully')
  } catch (error) {
    console.error('Error creating vouchers table:', error)
  }
}

// Create voucher
export async function createVoucher(amountUsd: number) {
  const code = generateVoucherCode()
  const amountGhs = amountUsd * EXCHANGE_RATE
  
  try {
    const db = useMockDb ? mockDb : pool
    
    if (useMockDb) {
      // Mock database syntax
      const query = `
        INSERT INTO vouchers (code, amount_usd, amount_ghs, status)
        VALUES ($1, $2, $3, 'paid')
        RETURNING code, amount_ghs
      `
      const result = await db.query(query, [code, amountUsd, amountGhs])
      return result.rows[0]
    } else {
      // Neon database syntax
      const result = await db`
        INSERT INTO vouchers (code, amount_usd, amount_ghs, status)
        VALUES (${code}, ${amountUsd}, ${amountGhs}, 'paid')
        RETURNING code, amount_ghs
      `
      return result[0]
    }
  } catch (error) {
    console.error('Error creating voucher:', error)
    throw error
  }
}

// Validate voucher
export async function validateVoucher(code: string) {
  try {
    const db = useMockDb ? mockDb : pool
    
    if (useMockDb) {
      // Mock database syntax
      const query = `
        SELECT code, amount_usd, amount_ghs, status 
        FROM vouchers 
        WHERE code = $1
      `
      const result = await db.query(query, [code])
      
      if (result.rows.length === 0) {
        return { valid: false, message: 'Voucher not found' }
      }
      
      const voucher = result.rows[0]
      
      if (voucher.status === 'completed') {
        return { 
          valid: false, 
          message: 'Voucher already completed',
          amount_usd: voucher.amount_usd,
          amount_ghs: voucher.amount_ghs,
          status: voucher.status
        }
      }
      
      if (voucher.status === 'rejected') {
        return { 
          valid: false, 
          message: 'Voucher was rejected',
          amount_usd: voucher.amount_usd,
          amount_ghs: voucher.amount_ghs,
          status: voucher.status
        }
      }
      
      return { 
        valid: true, 
        amount_usd: voucher.amount_usd,
        amount_ghs: voucher.amount_ghs,
        status: voucher.status
      }
    } else {
      // Neon database syntax
      const result = await db`
        SELECT code, amount_usd, amount_ghs, status 
        FROM vouchers 
        WHERE code = ${code}
      `
      
      if (result.length === 0) {
        return { valid: false, message: 'Voucher not found' }
      }
      
      const voucher = result[0]
      
      if (voucher.status === 'completed') {
        return { 
          valid: false, 
          message: 'Voucher already completed',
          amount_usd: voucher.amount_usd,
          amount_ghs: voucher.amount_ghs,
          status: voucher.status
        }
      }
      
      if (voucher.status === 'rejected') {
        return { 
          valid: false, 
          message: 'Voucher was rejected',
          amount_usd: voucher.amount_usd,
          amount_ghs: voucher.amount_ghs,
          status: voucher.status
        }
      }
      
      return { 
        valid: true, 
        amount_usd: voucher.amount_usd,
        amount_ghs: voucher.amount_ghs,
        status: voucher.status
      }
    }
  } catch (error) {
    console.error('Error validating voucher:', error)
    throw error
  }
}

// Claim voucher
export async function claimVoucher(
  code: string, 
  receiverName: string, 
  receiverPhone: string, 
  network: string
) {
  // First validate the voucher
  const validation = await validateVoucher(code)
  if (!validation.valid) {
    return { success: false, message: validation.message }
  }
  
  try {
    const db = useMockDb ? mockDb : pool
    
    if (useMockDb) {
      // Mock database syntax
      const query = `
        UPDATE vouchers 
        SET receiver_name = $1, receiver_phone = $2, network = $3, 
            status = 'pending', claimed_at = CURRENT_TIMESTAMP
        WHERE code = $4 AND status = 'paid'
        RETURNING *
      `
      const result = await db.query(query, [receiverName, receiverPhone, network, code])
      
      if (result.rows.length === 0) {
        return { success: false, message: 'Voucher cannot be claimed' }
      }
      
      return { 
        success: true, 
        message: 'Voucher claimed successfully',
        voucher: result.rows[0]
      }
    } else {
      // Neon database syntax
      const result = await db`
        UPDATE vouchers 
        SET receiver_name = ${receiverName}, receiver_phone = ${receiverPhone}, network = ${network}, 
            status = 'pending', claimed_at = CURRENT_TIMESTAMP
        WHERE code = ${code} AND status = 'paid'
        RETURNING *
      `
      
      if (result.length === 0) {
        return { success: false, message: 'Voucher cannot be claimed' }
      }
      
      return { 
        success: true, 
        message: 'Voucher claimed successfully',
        voucher: result[0]
      }
    }
  } catch (error) {
    console.error('Error claiming voucher:', error)
    throw error
  }
}

// Get all vouchers for admin
export async function getAllVouchers() {
  try {
    const db = useMockDb ? mockDb : pool
    
    if (useMockDb) {
      // Mock database syntax
      const query = `
        SELECT * FROM vouchers 
        ORDER BY created_at DESC
      `
      const result = await db.query(query)
      return result.rows
    } else {
      // Neon database syntax
      const result = await db`
        SELECT * FROM vouchers 
        ORDER BY created_at DESC
      `
      return result
    }
  } catch (error) {
    console.error('Error fetching vouchers:', error)
    throw error
  }
}

// Update voucher status (admin)
export async function updateVoucherStatus(code: string, status: 'completed' | 'rejected') {
  try {
    const db = useMockDb ? mockDb : pool
    
    if (useMockDb) {
      // Mock database syntax
      const query = `
        UPDATE vouchers 
        SET status = $1 
        WHERE code = $2
        RETURNING *
      `
      const result = await db.query(query, [status, code])
      
      if (result.rows.length === 0) {
        return { success: false, message: 'Voucher not found' }
      }
      
      return { 
        success: true, 
        message: `Voucher status updated to ${status}`,
        voucher: result.rows[0]
      }
    } else {
      // Neon database syntax
      const result = await db`
        UPDATE vouchers 
        SET status = ${status} 
        WHERE code = ${code}
        RETURNING *
      `
      
      if (result.length === 0) {
        return { success: false, message: 'Voucher not found' }
      }
      
      return { 
        success: true, 
        message: `Voucher status updated to ${status}`,
        voucher: result[0]
      }
    }
  } catch (error) {
    console.error('Error updating voucher status:', error)
    throw error
  }
}

// Initialize database
export async function initializeDatabase() {
  await createVouchersTable()
  const { createUsersTable } = await import('./auth-utils')
  await createUsersTable()
}
