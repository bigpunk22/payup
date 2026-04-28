'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { api, ApiError } from '@/lib/api';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function SendPage() {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');
  const [status, setStatus] = useState<Status>('idle');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [voucherCode, setVoucherCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const handlePayment = async () => {
    setStatus('loading');
    setErrorMessage('');
    
    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (method === 'card') {
        // Process card payment directly
        console.log('Sending card payment request...');
        
        const response = await fetch('/api/payment/charge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount_usd: amountNum,
            card: {
              number: cardDetails.number,
              expiry: cardDetails.expiry,
              cvv: cardDetails.cvv
            },
            email: 'customer@voucherapp.com'
          })
        });

        console.log('Payment response status:', response.status);
        const data = await response.json();
        console.log('Payment response data:', data);

        if (data.success) {
          setVoucherCode(data.voucher_code);
          setStatus('success');
        } else {
          throw new Error(data.error || 'Payment failed');
        }
      } else {
        // For other payment methods, use the old flow
        const response = await api.initializePayment({ amount_usd: amountNum });
        
        if (response.success && response.authorization_url) {
          window.location.href = response.authorization_url;
        } else {
          throw new Error(response.error || 'Failed to initialize payment');
        }
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setStatus('error');
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(voucherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setStatus('idle');
    setAmount('');
    setVoucherCode('');
    setErrorMessage('');
        setCardDetails({
      number: '',
      expiry: '',
      cvv: '',
      name: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
      {/* Background blobs */}
      <motion.div 
        className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20"
        animate={{ 
          x: [0, 30, 0],
          y: [0, -20, 0]
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-20"
        animate={{ 
          x: [0, -20, 0],
          y: [0, 30, 0]
        }}
        transition={{ 
          duration: 12, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Background overlay for different states */}
      <AnimatePresence>
        {status === 'loading' && (
          <motion.div
            className="absolute inset-0 bg-black/10 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
        {status === 'success' && (
          <motion.div
            className="absolute inset-0 bg-green-50/30 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
        {status === 'error' && (
          <motion.div
            className="absolute inset-0 bg-red-50/20 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-20">
        {/* Hero Section */}
        <motion.div 
          className="text-center pt-16 md:pt-24 px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Buy a voucher for someone you love
          </h1>
          <motion.p 
            className="text-sm md:text-base text-gray-500 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Send a thoughtful gift that lets them choose exactly what they need
          </motion.p>
        </motion.div>

        {/* Payment Card */}
        <div className="max-w-md mx-auto mt-10 md:mt-16 px-4">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <Card key="payment-form">
                {/* Amount Input */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Amount
                  </label>
                  <div className="flex items-center text-2xl font-semibold">
                    <span className="text-gray-400 mr-2">$</span>
                    <motion.input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-transparent outline-none text-2xl w-full focus:ring-2 focus:ring-blue-400/30 rounded-lg px-2 py-1 transition-all duration-200 ease-in-out"
                      whileFocus={{ scale: 1.02 }}
                    />
                  </div>
                </motion.div>

                {/* Payment Method Selector */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Payment Method
                  </label>
                  <PaymentMethodSelector 
                    selectedMethod={method}
                    onMethodChange={setMethod}
                  />
                  {method === 'card' && (
                    <motion.p 
                      className="text-xs text-green-600 mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      ✓ Card payments processed directly - no redirects
                    </motion.p>
                  )}
                </div>

                {/* Card Details Form */}
                <AnimatePresence>
                  {method === 'card' && (
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Input
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                        label="Card Number"
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                          label="Expiry Date"
                        />
                        <Input
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                          label="CVV"
                        />
                      </div>
                      
                      <Input
                        placeholder="John Doe"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                        label="Name on Card"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pay Button */}
                <Button
                  onClick={handlePayment}
                  loading={(status as Status) === 'loading'}
                  disabled={!amount || parseFloat(amount) <= 0 || (method === 'card' && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name))}
                  className="mt-6"
                >
                  {(status as Status) === 'loading' ? 'Processing...' : `Pay $${amount || '0.00'}`}
                </Button>
              </Card>
            )}

            {status === 'loading' && (
              <Card key="loading">
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: 360
                    }}
                    transition={{ 
                      scale: { duration: 1, repeat: Infinity },
                      rotate: { duration: 2, repeat: Infinity, ease: "linear" }
                    }}
                  >
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Processing payment...
                  </h3>
                  <p className="text-gray-500">
                    Please wait while we process your payment
                  </p>
                </motion.div>
              </Card>
            )}

            {status === 'success' && (
              <Card key="success">
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Success Icon */}
                  <motion.div 
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <motion.svg 
                      className="w-10 h-10 text-green-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <motion.path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M5 13l4 4L19 7" 
                      />
                    </motion.svg>
                  </motion.div>
                  
                  <motion.h2 
                    className="text-2xl font-bold text-gray-900 mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Voucher Ready
                  </motion.h2>
                  
                  <motion.div 
                    className="bg-gray-50 rounded-xl p-4 mb-6"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <p className="text-sm text-gray-500 mb-2">Your voucher code:</p>
                    <p className="text-xl font-mono font-semibold text-gray-900">{voucherCode}</p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button 
                      variant="secondary" 
                      onClick={copyToClipboard}
                      className="mb-4"
                    >
                      {copied ? '✓ Copied!' : 'Copy Code'}
                    </Button>
                  </motion.div>
                  
                  <motion.p 
                    className="text-sm text-gray-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    Share this code with the recipient
                  </motion.p>
                  
                                  </motion.div>
              </Card>
            )}

            {status === 'error' && (
              <Card key="error">
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* Error Icon */}
                  <motion.div 
                    className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    animate={{ 
                      x: [-5, 5, -5, 5, 0],
                      transition: { duration: 0.5 }
                    }}
                  >
                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Payment Initialization Failed
                  </h2>
                  
                  <p className="text-gray-500 mb-6">
                    {errorMessage || 'Failed to initialize payment. Please try again.'}
                  </p>
                  
                  <Button onClick={resetForm}>
                    Try Again
                  </Button>
                </motion.div>
              </Card>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
