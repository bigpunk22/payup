import pool from './db'
import { mockDb } from './mock-db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'

// Use mock database if PostgreSQL is not available
const useMockDb = !process.env.DATABASE_URL && !process.env.DB_HOST

// JWT Secret (should be in .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || 'your-reset-token-secret-change-in-production'

// Email configuration (use environment variables in production)
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-gmail@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
})

// Create users table
export async function createUsersTable() {
  if (useMockDb) {
    // For mock database, we'll simulate the users table
    console.log('Using mock database - users table simulated')
    return
  }

  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      is_admin BOOLEAN DEFAULT false,
      reset_token VARCHAR(255),
      reset_token_expires TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `
  
  try {
    await pool.query(query)
    console.log('Users table created successfully')
  } catch (error) {
    console.error('Error creating users table:', error)
  }
}

// Check if any user exists (for single account restriction)
export async function hasAnyUsers(): Promise<boolean> {
  try {
    const db = useMockDb ? mockDb : pool
    
    if (useMockDb) {
      // Mock database - simulate no users initially
      const query = 'SELECT COUNT(*) as count FROM users'
      const result = await db.query(query)
      const rows = result.rows || result
      return rows[0].count > 0
    } else {
      const result = await pool.query('SELECT COUNT(*) as count FROM users')
      const rows = Array.isArray(result) ? result : result.rows
      return parseInt(rows[0].count) > 0
    }
  } catch (error) {
    console.error('Error checking users:', error)
    return false
  }
}

// Register first user (only if no users exist)
export async function registerFirstUser(email: string, password: string, fullName: string) {
  // Check if any users already exist
  const usersExist = await hasAnyUsers()
  if (usersExist) {
    throw new Error('Registration is disabled. An account already exists.')
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12)

  try {
    const db = useMockDb ? mockDb : pool
    
    if (useMockDb) {
      // Mock database - simulate user creation
      const query = `
        INSERT INTO users (email, password_hash, full_name, is_admin)
        VALUES ($1, $2, $3, true)
        RETURNING id, email, full_name, is_admin
      `
      const result = await db.query(query, [email, passwordHash, fullName])
      return result.rows[0]
    } else {
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, full_name, is_admin) VALUES ($1, $2, $3, true) RETURNING id, email, full_name, is_admin',
        [email, passwordHash, fullName]
      )
      // Handle both Neon (direct rows) and traditional PostgreSQL (result.rows)
      return Array.isArray(result) ? result[0] : result.rows[0]
    }
  } catch (error) {
    console.error('Error registering user:', error)
    throw error
  }
}

// Authenticate user
export async function authenticateUser(email: string, password: string) {
  try {
    const db = useMockDb ? mockDb : pool
    
    if (useMockDb) {
      // Mock database - simulate authentication
      const query = `
        SELECT id, email, password_hash, full_name, is_admin
        FROM users 
        WHERE email = $1
      `
      const result = await db.query(query, [email])
      const rows = result.rows || result
      
      if (rows.length === 0) {
        return null
      }
      
      const user = rows[0]
      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      
      if (!isValidPassword) {
        return null
      }
      
      return {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        isAdmin: user.is_admin
      }
    } else {
      const result = await pool.query(
        'SELECT id, email, password_hash, full_name, is_admin FROM users WHERE email = $1',
        [email]
      )
      const rows = Array.isArray(result) ? result : result.rows
      
      if (rows.length === 0) {
        return null
      }
      
      const user = rows[0]
      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      
      if (!isValidPassword) {
        return null
      }
      
      return {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        isAdmin: user.is_admin
      }
    }
  } catch (error) {
    console.error('Error authenticating user:', error)
    throw error
  }
}

// Generate JWT token
export function generateToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Generate password reset token
export function generateResetToken(userId: number): string {
  return jwt.sign(
    { userId, type: 'reset' },
    RESET_TOKEN_SECRET,
    { expiresIn: '1h' }
  )
}

// Verify reset token
export function verifyResetToken(token: string): any {
  try {
    const decoded = jwt.verify(token, RESET_TOKEN_SECRET) as any
    return decoded.type === 'reset' ? decoded : null
  } catch (error) {
    return null
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-gmail@gmail.com',
    to: email,
    subject: 'Password Reset - PayApp Admin',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">PayApp Admin</h1>
          <p style="margin: 5px 0 0; opacity: 0.9;">Password Reset Request</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <p style="color: #374151; line-height: 1.6;">Hello,</p>
          <p style="color: #374151; line-height: 1.6;">
            You requested to reset your password for the PayApp Admin account. Click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link in your browser:<br>
            <span style="word-break: break-all; color: #3B82F6;">${resetUrl}</span>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            This link will expire in 1 hour for security reasons.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            If you didn't request this password reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    `
  }

  try {
    await emailTransporter.sendMail(mailOptions)
    console.log('Password reset email sent successfully')
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw error
  }
}

// Request password reset
export async function requestPasswordReset(email: string) {
  try {
    const db = useMockDb ? mockDb : pool
    
    if (useMockDb) {
      // Mock database - simulate user lookup
      const query = 'SELECT id, email FROM users WHERE email = $1'
      const result = await db.query(query, [email])
      const rows = result.rows || result
      
      if (rows.length === 0) {
        // Don't reveal if user exists or not
        return { success: true, message: 'If an account exists, a reset link has been sent.' }
      }
      
      const user = rows[0]
      const resetToken = generateResetToken(user.id)
      
      // Store reset token (in real app, you'd store this in database)
      await sendPasswordResetEmail(user.email, resetToken)
      
      return { success: true, message: 'Password reset link sent to your email.' }
    } else {
      const result = await pool.query('SELECT id, email FROM users WHERE email = $1', [email])
      const rows = Array.isArray(result) ? result : result.rows
      
      if (rows.length === 0) {
        // Don't reveal if user exists or not
        return { success: true, message: 'If an account exists, a reset link has been sent.' }
      }
      
      const user = rows[0]
      const resetToken = generateResetToken(user.id)
      
      // Store reset token in database
      await pool.query(
        'UPDATE users SET reset_token = $1, reset_token_expires = NOW() + INTERVAL \'1 hour\' WHERE id = $2',
        [resetToken, user.id]
      )
      
      await sendPasswordResetEmail(user.email, resetToken)
      
      return { success: true, message: 'Password reset link sent to your email.' }
    }
  } catch (error) {
    console.error('Error requesting password reset:', error)
    throw error
  }
}

// Reset password
export async function resetPassword(token: string, newPassword: string) {
  try {
    const decoded = verifyResetToken(token)
    if (!decoded) {
      throw new Error('Invalid or expired reset token')
    }

    const db = useMockDb ? mockDb : pool
    const passwordHash = await bcrypt.hash(newPassword, 12)
    
    if (useMockDb) {
      // Mock database - simulate password update
      const query = `
        UPDATE users 
        SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL
        WHERE id = $2
      `
      await db.query(query, [passwordHash, decoded.userId])
    } else {
      await pool.query(
        'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
        [passwordHash, decoded.userId]
      )
    }
    
    return { success: true, message: 'Password reset successfully' }
  } catch (error) {
    console.error('Error resetting password:', error)
    throw error
  }
}

// Get user by ID
export async function getUserById(userId: number) {
  try {
    const db = useMockDb ? mockDb : pool
    
    if (useMockDb) {
      const query = `
        SELECT id, email, full_name, is_admin
        FROM users 
        WHERE id = $1
      `
      const result = await db.query(query, [userId])
      const rows = result.rows || result
      return rows[0] || null
    } else {
      const result = await pool.query(
        'SELECT id, email, full_name, is_admin FROM users WHERE id = $1',
        [userId]
      )
      const rows = Array.isArray(result) ? result : result.rows
      return rows[0] || null
    }
  } catch (error) {
    console.error('Error getting user:', error)
    throw error
  }
}
