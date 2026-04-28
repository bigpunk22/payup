'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

export default function TestAuth() {
  const { isAuthenticated, user, login, logout, checkAuth } = useAuth()
  const [email, setEmail] = useState('rachealbing97@gmail.com')
  const [password, setPassword] = useState('EveryThing@100%')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      const success = await login(email, password)
      console.log('Login result:', success)
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckAuth = async () => {
    try {
      await checkAuth()
      console.log('Auth checked')
    } catch (error) {
      console.error('Check auth error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">AuthContext Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">Current Auth State:</h2>
          <div className="space-y-2">
            <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'None'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">Test Login:</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
              
              <button
                onClick={handleCheckAuth}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Check Auth
              </button>
              
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Navigation:</h2>
          <div className="space-y-2">
            <a href="/admin/login" className="block text-blue-600 hover:underline">Admin Login Page</a>
            <a href="/admin" className="block text-blue-600 hover:underline">Admin Dashboard</a>
          </div>
        </div>
      </div>
    </div>
  )
}
