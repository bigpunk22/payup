'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { api, ApiError } from '@/lib/api';

export default function ClaimPage() {
  const [step, setStep] = useState(1);
  const [voucherCode, setVoucherCode] = useState('');
  const [usdAmount, setUsdAmount] = useState('0'); // Store USD amount from voucher
  const [calculatedAmount, setCalculatedAmount] = useState('0'); // Calculate using current rate
  const [receiverDetails, setReceiverDetails] = useState({
    fullName: '',
    phoneNumber: '',
    network: 'MTN'
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Configuration state
  const [config, setConfig] = useState({ today_rate: 12.5, percentage: 0 });

  const networks = ['MTN', 'Vodafone', 'AirtelTigo'];

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    // Recalculate amount whenever config or USD amount changes
    if (usdAmount && config.today_rate) {
      const usd = parseFloat(usdAmount);
      
      // CORRECT: USD amount × current rate = GHS amount
      let ghsAmount = usd * config.today_rate;
      
      // Apply service fee if percentage > 0
      if (config.percentage > 0) {
        const fee = ghsAmount * (config.percentage / 100);
        ghsAmount = ghsAmount - fee;
      }
      
      setCalculatedAmount(ghsAmount.toString());
    }
  }, [usdAmount, config]);

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

  // Check approval status function
  const checkApprovalStatus = async () => {
    setLoading(true);
    setErrorMessage('');
    
    try {
      const response = await api.validateVoucher({ code: voucherCode.trim() });
      
      if (response.success) {
        // Check status regardless of valid field (completed vouchers return valid: false)
        if (response.status === 'completed') {
          // Voucher approved - go to success step
          setStep(6); // Go to actual success screen
        } else if (response.status === 'rejected') {
          // Voucher rejected - go back to start
          setVoucherCode('');
          setUsdAmount('0');
          setCalculatedAmount('0');
          setStep(1);
          setErrorMessage('Your voucher was rejected. Please contact support.');
        } else if (response.status === 'pending') {
          // Still pending
          setErrorMessage('Still pending approval. Please try again in a few minutes.');
        } else {
          // Other status
          setErrorMessage(`Voucher status: ${response.status}. Please contact support.`);
        }
      } else {
        throw new Error('Failed to check approval status');
      }
    } catch (error) {
      console.error('Check approval error:', error);
      setErrorMessage('Failed to check approval status. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Validation functions
  const handleNameChange = (value: string) => {
    // Allow only letters, spaces, and hyphens
    const lettersOnly = value.replace(/[^a-zA-Z\s-]/g, '')
    setReceiverDetails({...receiverDetails, fullName: lettersOnly})
  }

  const handlePhoneChange = (value: string) => {
    // Allow only digits, max 10 characters
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
    setReceiverDetails({...receiverDetails, phoneNumber: digitsOnly})
  }

  const handleVoucherSubmit = async () => {
    setLoading(true);
    setErrorMessage('');
    
    try {
      if (!voucherCode.trim()) {
        throw new Error('Please enter a voucher code');
      }

      const response = await api.validateVoucher({ code: voucherCode.trim() });
      
      if (response.success && response.valid) {
        setUsdAmount(response.amount_usd.toString()); // Store USD amount
        setStep(2);
      } else {
        throw new Error(response.message || 'Invalid voucher code');
      }
    } catch (error) {
      console.error('Voucher validation error:', error);
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to validate voucher. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsSubmit = async () => {
    setLoading(true);
    setErrorMessage('');
    
    try {
      if (!receiverDetails.fullName.trim()) {
        throw new Error('Please enter your full name');
      }
      if (!receiverDetails.phoneNumber.trim()) {
        throw new Error('Please enter your phone number');
      }
      if (receiverDetails.phoneNumber.length !== 10) {
        throw new Error('Phone number must be exactly 10 digits');
      }
      if (receiverDetails.fullName.trim().length < 2) {
        throw new Error('Please enter a valid full name');
      }

      setStep(4);
    } catch (error) {
      console.error('Details validation error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setErrorMessage('');
    
    try {
      const response = await api.claimVoucher({
        code: voucherCode.trim(),
        receiver_name: receiverDetails.fullName.trim(),
        receiver_phone: receiverDetails.phoneNumber.trim(),
        network: receiverDetails.network
      });
      
      if (response.success) {
        // Don't go to success step yet - show pending status
        setStep(5); // New pending step
      } else {
        throw new Error(response.message || 'Failed to claim voucher');
      }
    } catch (error) {
      console.error('Claim submission error:', error);
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to submit claim. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0
    }).format(parseFloat(amount) || 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
      {/* Background decoration */}
      <motion.div 
        className="absolute top-20 left-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-30"
        animate={{ 
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-20 right-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-30"
        animate={{ 
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">
          {/* STEP 1: VOUCHER INPUT */}
          {step === 1 && (
            <Card key="step1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
                  Claim your voucher
                </h1>

                <div className="space-y-6">
                  <div>
                    <Input
                      placeholder="Enter voucher code"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      className="text-center text-lg tracking-wider font-mono"
                      style={{ letterSpacing: '0.1em' }}
                    />
                    {errorMessage && (
                      <p className="text-red-500 text-sm mt-2 text-center">{errorMessage}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleVoucherSubmit}
                    loading={loading}
                    disabled={!voucherCode.trim()}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            </Card>
          )}

          {/* STEP 2: AMOUNT PREVIEW */}
          {step === 2 && (
            <Card key="step2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center py-8"
              >
                <p className="text-gray-600 mb-4">You will receive</p>
                
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mb-8"
                >
                  <p className="text-4xl md:text-5xl font-bold text-gray-900">
                    {formatAmount(calculatedAmount)}
                  </p>
                </motion.div>

                {/* Configuration Display */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="bg-blue-50 rounded-lg p-4 mb-6"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Today's Exchange Rate</p>
                      <p className="text-lg font-bold text-blue-900">1 USD = {config.today_rate.toFixed(2)} GHS</p>
                    </div>
                    {config.percentage > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-blue-600 font-medium">Service Fee</p>
                        <p className="text-lg font-bold text-blue-900">{config.percentage.toFixed(2)}%</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Calculation Breakdown */}
                  <div className="bg-white rounded p-3 text-sm">
                    <p className="text-gray-600 mb-1">Calculation:</p>
                    <div className="space-y-1 text-gray-700">
                      <p>• USD amount: ${parseFloat(usdAmount).toFixed(2)}</p>
                      <p>• Rate applied: × {config.today_rate.toFixed(2)}</p>
                      {config.percentage > 0 && (
                        <p>• Fee ({config.percentage}%): -{formatAmount((parseFloat(usdAmount) * config.today_rate * (config.percentage / 100)).toString())}</p>
                      )}
                      <p className="font-bold text-green-700">• You receive: {formatAmount(calculatedAmount)}</p>
                    </div>
                  </div>
                </motion.div>

                <div className="w-full h-px bg-gray-200 mb-8"></div>

                <Button
                  onClick={() => setStep(3)}
                  className="w-full"
                >
                  Continue
                </Button>
              </motion.div>
            </Card>
          )}

          {/* STEP 3: RECEIVER DETAILS FORM */}
          {step === 3 && (
            <Card key="step3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Receiver Details
                </h2>

                <div className="space-y-4">
                  <Input
                    placeholder="Enter your full name"
                    value={receiverDetails.fullName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    label="Full Name"
                  />

                  <Input
                    placeholder="Enter phone number (10 digits)"
                    value={receiverDetails.phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    label="Phone Number"
                    type="tel"
                    maxLength={10}
                  />

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Network
                    </label>
                    <motion.select
                      value={receiverDetails.network}
                      onChange={(e) => setReceiverDetails({...receiverDetails, network: e.target.value})}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 outline-none transition-all duration-200 ease-in-out hover:border-gray-300"
                      whileFocus={{ scale: 1.01 }}
                    >
                      {networks.map(network => (
                        <option key={network} value={network}>
                          {network}
                        </option>
                      ))}
                    </motion.select>
                  </div>

                  <Button
                    onClick={handleDetailsSubmit}
                    loading={loading}
                    disabled={!receiverDetails.fullName || !receiverDetails.phoneNumber || receiverDetails.phoneNumber.length !== 10 || receiverDetails.fullName.trim().length < 2}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            </Card>
          )}

          {/* STEP 5: PENDING APPROVAL */}
          {step === 5 && (
            <Card key="step5">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10"
                  >
                    <svg className="w-full h-full text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                </motion.div>

                <motion.h2
                  className="text-2xl font-bold text-gray-900 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Request Submitted
                </motion.h2>

                <motion.p
                  className="text-lg text-gray-600 mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Your payment is pending approval
                </motion.p>

                <motion.p
                  className="text-sm text-gray-500 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  You will be notified once completed
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    onClick={checkApprovalStatus}
                    loading={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Check Approval Status
                  </Button>
                </motion.div>

                {errorMessage && (
                  <motion.div
                    className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className="text-red-800 text-sm">{errorMessage}</p>
                  </motion.div>
                )}
              </motion.div>
            </Card>
          )}

          {/* STEP 4: CONFIRMATION SCREEN */}
          {step === 4 && (
            <Card key="step4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Confirm Details
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 text-sm">Name</span>
                    <span className="font-medium text-gray-900">{receiverDetails.fullName}</span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 text-sm">Phone</span>
                    <span className="font-medium text-gray-900">{receiverDetails.phoneNumber}</span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 text-sm">Network</span>
                    <span className="font-medium text-gray-900">{receiverDetails.network}</span>
                  </div>

                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-600 text-sm">Amount</span>
                    <span className="font-bold text-gray-900 text-lg">{formatAmount(calculatedAmount)}</span>
                  </div>
                </div>

                <motion.div 
                  className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-sm text-amber-800">
                    ⚠️ Please confirm details carefully. Payments cannot be reversed.
                  </p>
                </motion.div>

                <Button
                  onClick={handleFinalSubmit}
                  loading={loading}
                >
                  Submit Request
                </Button>
              </motion.div>
            </Card>
          )}

          {/* STEP 6: SUCCESS SCREEN */}
          {step === 6 && (
            <Card key="step6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>

                <motion.h2
                  className="text-2xl font-bold text-gray-900 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Payment Successful!
                </motion.h2>

                <motion.p
                  className="text-lg text-gray-600 mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Your payment has been approved and processed
                </motion.p>

                <motion.p
                  className="text-sm text-gray-500 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  The funds have been sent to your mobile wallet
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    onClick={() => {
                      setVoucherCode('');
                      setUsdAmount('0');
                      setCalculatedAmount('0');
                      setStep(1);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Claim Another Voucher
                  </Button>
                </motion.div>
              </motion.div>
            </Card>
          )}

          </AnimatePresence>
      </div>
    </div>
  );
}
