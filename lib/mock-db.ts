// Mock database for development when PostgreSQL is not available
interface Voucher {
  id: number
  code: string
  amount_usd: number
  amount_ghs: number
  status: 'paid' | 'pending' | 'completed' | 'rejected' | 'expired'
  receiver_name?: string
  receiver_phone?: string
  network?: string
  created_at: Date
  claimed_at?: Date
}

interface User {
  id: number
  email: string
  password_hash: string
  full_name: string
  is_admin: boolean
  reset_token?: string
  reset_token_expires?: Date
  created_at: Date
  updated_at: Date
}

// In-memory storage (simulates database)
let vouchers: Voucher[] = []
let users: User[] = []
let nextId = 1
let nextUserId = 1

// Mock database functions that match the PostgreSQL interface
export const mockDb = {
  async query(text: string, params?: any[]): Promise<{ rows: Voucher[] }> {
    console.log('Mock DB Query:', text, params)
    
    // Simulate database delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Parse basic SQL operations (simplified for demo)
    if (text.includes('INSERT INTO vouchers')) {
      const newVoucher: Voucher = {
        id: nextId++,
        code: params?.[0] || `GH-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        amount_usd: params?.[1] || 0,
        amount_ghs: params?.[2] || 0,
        status: 'paid',
        created_at: new Date()
      }
      vouchers.push(newVoucher)
      return { rows: [newVoucher] }
    }
    
    if (text.includes('SELECT') && text.includes('WHERE code =')) {
      const code = params?.[0]
      const voucher = vouchers.find(v => v.code === code)
      return { rows: voucher ? [voucher] : [] }
    }
    
    if (text.includes('UPDATE vouchers') && text.includes('status =')) {
      const status = params?.[0]
      const code = params?.[1]
      const index = vouchers.findIndex(v => v.code === code)
      
      if (index !== -1) {
        vouchers[index] = { ...vouchers[index], status }
        return { rows: [vouchers[index]] }
      }
      return { rows: [] }
    }
    
    if (text.includes('UPDATE vouchers') && text.includes('claimed_at')) {
      const receiverName = params?.[0]
      const receiverPhone = params?.[1]
      const network = params?.[2]
      const code = params?.[3]
      
      const index = vouchers.findIndex(v => v.code === code && v.status === 'paid')
      
      if (index !== -1) {
        vouchers[index] = {
          ...vouchers[index],
          receiver_name: receiverName,
          receiver_phone: receiverPhone,
          network,
          status: 'pending',
          claimed_at: new Date()
        }
        return { rows: [vouchers[index]] }
      }
      return { rows: [] }
    }
    
    if (text.includes('SELECT * FROM vouchers') && text.includes('ORDER BY created_at DESC')) {
      return { rows: [...vouchers].sort((a, b) => b.created_at.getTime() - a.created_at.getTime()) }
    }
    
    // User operations
    if (text.includes('INSERT INTO users')) {
      const newUser: User = {
        id: nextUserId++,
        email: params?.[0] || '',
        password_hash: params?.[1] || '',
        full_name: params?.[2] || '',
        is_admin: params?.[3] || false,
        created_at: new Date(),
        updated_at: new Date()
      }
      users.push(newUser)
      return { rows: [newUser] as any }
    }
    
    if (text.includes('SELECT COUNT(*) as count FROM users')) {
      return { rows: [{ count: users.length }] as any }
    }
    
    if (text.includes('SELECT') && text.includes('FROM users') && text.includes('WHERE email =')) {
      const email = params?.[0]
      const user = users.find(u => u.email === email)
      return { rows: user ? [user as any] : [] }
    }
    
    if (text.includes('SELECT') && text.includes('FROM users') && text.includes('WHERE id =')) {
      const userId = params?.[0]
      const user = users.find(u => u.id === userId)
      return { rows: user ? [user as any] : [] }
    }
    
    if (text.includes('UPDATE users') && text.includes('password_hash =')) {
      const passwordHash = params?.[0]
      const userId = params?.[1]
      const index = users.findIndex(u => u.id === userId)
      
      if (index !== -1) {
        users[index] = {
          ...users[index],
          password_hash: passwordHash,
          reset_token: undefined,
          reset_token_expires: undefined,
          updated_at: new Date()
        }
        return { rows: [users[index] as any] }
      }
      return { rows: [] }
    }
    
    if (text.includes('UPDATE users') && text.includes('reset_token =')) {
      const resetToken = params?.[0]
      const userId = params?.[1]
      const index = users.findIndex(u => u.id === userId)
      
      if (index !== -1) {
        users[index] = {
          ...users[index],
          reset_token: resetToken,
          reset_token_expires: new Date(Date.now() + 3600000), // 1 hour from now
          updated_at: new Date()
        }
        return { rows: [users[index] as any] }
      }
      return { rows: [] }
    }
    
    if (text.includes('CREATE TABLE')) {
      console.log('Mock: Table creation skipped (using in-memory storage)')
      return { rows: [] }
    }
    
    return { rows: [] }
  }
}

// Initialize with some sample data
export async function initializeMockData() {
  if (vouchers.length === 0) {
    const sampleVouchers: Voucher[] = [
      {
        id: nextId++,
        code: 'GH-DEMO-1234',
        amount_usd: 50,
        amount_ghs: 625,
        status: 'paid',
        created_at: new Date('2024-03-20T10:00:00Z')
      },
      {
        id: nextId++,
        code: 'GH-DEMO-5678',
        amount_usd: 100,
        amount_ghs: 1250,
        status: 'pending',
        receiver_name: 'John Doe',
        receiver_phone: '+233-555-0123',
        network: 'MTN',
        created_at: new Date('2024-03-20T11:00:00Z'),
        claimed_at: new Date('2024-03-20T11:30:00Z')
      },
      {
        id: nextId++,
        code: 'GH-DEMO-9012',
        amount_usd: 75,
        amount_ghs: 937.50,
        status: 'completed',
        receiver_name: 'Jane Smith',
        receiver_phone: '+233-555-0456',
        network: 'Vodafone',
        created_at: new Date('2024-03-20T09:00:00Z'),
        claimed_at: new Date('2024-03-20T09:15:00Z')
      }
    ]
    
    vouchers = sampleVouchers
    console.log('Mock database initialized with sample data')
  }
}
