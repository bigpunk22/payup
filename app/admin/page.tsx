'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, LogOut, Plus, X } from 'lucide-react'
import { api, ApiError, Voucher } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Transaction {
  id: number
  voucher: string
  amount: string  // Changed from number to string to match database response
  name: string
  phone: string
  network: string
  status: 'paid' | 'pending' | 'completed' | 'rejected'
  date: string
  amount_ghs: string  // Changed from number to string to match database response
}


export default function AdminDashboard() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'completed' | 'rejected'>('all')
  const [showSendModal, setShowSendModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Configuration state
  const [config, setConfig] = useState({ today_rate: 12.5, percentage: 0 })
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)
  const [tempConfig, setTempConfig] = useState({ today_rate: '', percentage: '' })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [notification, setNotification] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [newTransaction, setNewTransaction] = useState({
    voucher: '',
    amount: '',
    name: '',
    phone: '',
    network: 'MTN'
  })

  const { isAuthenticated, user, logout } = useAuth()

  useEffect(() => {
    setIsClient(true)
    
    console.log('Admin Dashboard - isAuthenticated:', isAuthenticated)
    console.log('Admin Dashboard - user:', user)
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login...')
      router.push('/admin/login')
      return
    }

    // Fetch vouchers from API
    fetchVouchers()
    fetchConfig()
    
    // Set up real-time polling for voucher updates
    const pollInterval = setInterval(() => {
      fetchVouchers()
    }, 3000) // Poll every 3 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(pollInterval)
  }, [router, refreshKey, isAuthenticated])

  const fetchConfig = async () => {
    try {
      const response = await api.getConfig()
      if (response.success) {
        setConfig(response.config)
      }
    } catch (error) {
      console.error('Fetch config error:', error)
    }
  }

  const fetchVouchers = async () => {
    // Don't set loading to true during polling to avoid UI flicker
    const isFirstLoad = transactions.length === 0;
    if (isFirstLoad) setLoading(true);
    setError('');
    
    try {
      const response = await api.getVouchers()
      
      if (response.success) {
        const transformedTransactions: Transaction[] = response.vouchers.map(voucher => ({
          id: voucher.id,
          voucher: voucher.code,
          amount: voucher.amount_usd.toString(),  // Convert to string
          amount_ghs: voucher.amount_ghs.toString(),  // Convert to string
          name: voucher.receiver_name || 'N/A',
          phone: voucher.receiver_phone || 'N/A',
          network: voucher.network || 'N/A',
          status: voucher.status as Transaction['status'],
          date: new Date(voucher.created_at).toISOString().split('T')[0]
        }))
        setTransactions(transformedTransactions)
        setLastUpdated(new Date())
      } else {
        throw new Error('Failed to fetch vouchers')
      }
    } catch (error) {
      console.error('Fetch vouchers error:', error)
      setError(error instanceof ApiError ? error.message : 'Failed to load vouchers. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/admin/login')
  }

  const handleApprove = async (voucherCode: string) => {
    try {
      const response = await api.updateVoucherStatus({ code: voucherCode, status: 'completed' })
      
      if (response.success) {
        // Update local state immediately for instant feedback
        setTransactions(prev => 
          prev.map(tx => 
            tx.voucher === voucherCode ? { ...tx, status: 'completed' as const } : tx
          )
        )
        setNotification(`Voucher ${voucherCode} approved successfully!`)
        setTimeout(() => setNotification(''), 3000)
      } else {
        throw new Error(response.error || 'Failed to approve voucher')
      }
    } catch (error) {
      console.error('Approve error:', error)
      setError(error instanceof ApiError ? error.message : 'Failed to approve voucher')
    }
  }

  const handleReject = async (voucherCode: string) => {
    try {
      const response = await api.updateVoucherStatus({ code: voucherCode, status: 'rejected' })
      
      if (response.success) {
        // Update local state immediately for instant feedback
        setTransactions(prev => 
          prev.map(tx => 
            tx.voucher === voucherCode ? { ...tx, status: 'rejected' as const } : tx
          )
        )
        setNotification(`Voucher ${voucherCode} rejected successfully!`)
        setTimeout(() => setNotification(''), 3000)
      } else {
        throw new Error(response.error || 'Failed to reject voucher')
      }
    } catch (error) {
      console.error('Reject error:', error)
      setError(error instanceof ApiError ? error.message : 'Failed to reject voucher')
    }
  }

  const handleUpdateConfig = () => {
    setTempConfig({
      today_rate: config.today_rate.toString(),
      percentage: config.percentage.toString()
    })
    setShowConfigModal(true)
  }

  const handleSaveConfig = async () => {
    const today_rate = parseFloat(tempConfig.today_rate)
    const percentage = parseFloat(tempConfig.percentage)

    if (!today_rate || today_rate <= 0 || percentage < 0) {
      setError('Please enter valid configuration values')
      return
    }

    setConfigLoading(true)
    try {
      const response = await api.updateConfig({ today_rate, percentage })
      
      if (response.success) {
        setConfig(response.config)
        setShowConfigModal(false)
        setTempConfig({ today_rate: '', percentage: '' })
      } else {
        throw new Error(response.error || 'Failed to update configuration')
      }
    } catch (error) {
      console.error('Update config error:', error)
      setError(error instanceof ApiError ? error.message : 'Failed to update configuration')
    } finally {
      setConfigLoading(false)
    }
  }

  const handleSendMoney = () => {
    // Generate voucher code if not provided
    if (!newTransaction.voucher) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let code = 'VOU' + new Date().getFullYear() + new Date().getMonth().toString().padStart(2, '0')
      for (let i = 0; i < 3; i++) {
        code += '-'
        for (let j = 0; j < 3; j++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
      }
      setNewTransaction(prev => ({ ...prev, voucher: code }))
    }
  }

  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSendModal(false)
    // Refresh the vouchers list to show new data
    setRefreshKey(prev => prev + 1)
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = searchTerm === '' || 
        tx.voucher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterStatus === 'all' || tx.status === filterStatus
      
      return matchesSearch && matchesFilter
    })
  }, [transactions, searchTerm, filterStatus])

  const summaryStats = useMemo(() => {
    const paid = transactions.filter(tx => tx.status === 'paid').length
    const pending = transactions.filter(tx => tx.status === 'pending').length
    const completed = transactions.filter(tx => tx.status === 'completed').length
    const rejected = transactions.filter(tx => tx.status === 'rejected').length
    const totalVolume = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
    
    // Calculate amounts based on transaction status
    const totalTransferred = transactions
      .filter(tx => tx.status === 'completed')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
    
    const totalLeft = transactions
      .filter(tx => tx.status === 'pending')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)

    return { paid, pending, completed, rejected, totalVolume, totalTransferred, totalLeft }
  }, [transactions])

  const StatusBadge = ({ status }: { status: Transaction['status'] }) => {
    const styles = {
      paid: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">PayApp Admin</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live</span>
                {isClient && lastUpdated && (
                  <span className="text-xs">({lastUpdated.toLocaleTimeString()})</span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <div className="relative">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.fullName?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Dashboard Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
            <p className="text-gray-600 mt-1">Manage incoming payout requests</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              disabled={loading}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Send Money</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Success Notification */}
        {notification && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 animate-pulse">
            <p className="text-green-800">{notification}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Paid</p>
            <p className="text-xl font-semibold text-gray-900">{summaryStats.paid}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-xl font-semibold text-gray-900">{summaryStats.pending}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Completed</p>
            <p className="text-xl font-semibold text-gray-900">{summaryStats.completed}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Rejected</p>
            <p className="text-xl font-semibold text-gray-900">{summaryStats.rejected}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Volume</p>
            <p className="text-xl font-semibold text-gray-900">${summaryStats.totalVolume.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Transferred</p>
            <p className="text-xl font-semibold text-green-600">${summaryStats.totalTransferred.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Left to Transfer</p>
            <p className="text-xl font-semibold text-yellow-600">${summaryStats.totalLeft.toFixed(2)}</p>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Exchange Rate Configuration</h3>
            <button
              onClick={handleUpdateConfig}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Configuration
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Today's Rate (USD to GHS)</p>
              <p className="text-2xl font-bold text-gray-900">{config.today_rate.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Service Percentage (%)</p>
              <p className="text-2xl font-bold text-gray-900">{config.percentage.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by voucher or name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voucher Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (USD)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receiver Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Network
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {transaction.voucher}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {transaction.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      ${parseFloat(transaction.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {transaction.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {transaction.phone}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {transaction.network}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={transaction.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        {transaction.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(transaction.voucher)}
                              className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(transaction.voucher)}
                              className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {transaction.status !== 'pending' && (
                          <span className="text-xs text-gray-400">No actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {!loading && filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {transactions.length === 0 ? 'No vouchers found' : 'No transactions match your filters'}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Loading vouchers...</p>
          </div>
        )}

        {/* Send Money Modal */}
        {showSendModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Send Money</h3>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitTransaction} className="space-y-4">
                {/* Voucher Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voucher Code (Optional)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTransaction.voucher}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, voucher: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Auto-generated if empty"
                    />
                    <button
                      type="button"
                      onClick={handleSendMoney}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Receiver Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receiver Name
                  </label>
                  <input
                    type="text"
                    value={newTransaction.name}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newTransaction.phone}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1-555-0123"
                  />
                </div>

                {/* Network */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Network
                  </label>
                  <select
                    value={newTransaction.network}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, network: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="MTN">MTN</option>
                    <option value="Vodafone">Vodafone</option>
                    <option value="Airtel">Airtel</option>
                    <option value="Glo">Glo</option>
                    <option value="9Mobile">9Mobile</option>
                  </select>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSendModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Send Money
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Configuration Modal */}
        {showConfigModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Update Configuration</h3>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSaveConfig(); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Today's Rate (USD to GHS)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tempConfig.today_rate}
                      onChange={(e) => setTempConfig(prev => ({ ...prev, today_rate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="12.50"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tempConfig.percentage}
                      onChange={(e) => setTempConfig(prev => ({ ...prev, percentage: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={configLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {configLoading ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
