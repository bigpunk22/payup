'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { api, ApiError } from '@/lib/api';

type Status = 'loading' | 'success' | 'error';

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [voucherCode, setVoucherCode] = useState('');
  const [amount, setAmount] = useState({ usd: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const reference = searchParams.get('reference');
    
    if (!reference) {
      setStatus('error');
      setErrorMessage('No payment reference found');
      return;
    }

    verifyPayment(reference);
  }, [searchParams]);

  const verifyPayment = async (reference: string) => {
    try {
      const response = await api.verifyPayment({ reference });
      
      if (response.success) {
        setVoucherCode(response.voucher.code);
        setAmount({
          usd: response.voucher.amount_usd
        });
        setStatus('success');
      } else {
        throw new Error(response.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setErrorMessage(error instanceof ApiError ? error.message : 'Payment verification failed');
      setStatus('error');
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(voucherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoHome = () => {
    router.push('/send');
  };

  const handleTryAgain = () => {
    router.push('/send');
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
          {/* LOADING STATE */}
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
                  Verifying Payment...
                </h3>
                <p className="text-gray-500">
                  Please wait while we confirm your payment
                </p>
              </motion.div>
            </Card>
          )}

          {/* SUCCESS STATE */}
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
                  Payment Successful!
                </motion.h2>
                
                <motion.div 
                  className="bg-gray-50 rounded-xl p-4 mb-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-sm text-gray-500 mb-2">Your voucher code:</p>
                  <p className="text-xl font-mono font-semibold text-gray-900">{voucherCode}</p>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Amount: ${amount.usd.toFixed(2)}
                    </p>
                  </div>
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
                  className="text-sm text-gray-500 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Share this code with the recipient
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button onClick={handleGoHome}>
                    Send Another Voucher
                  </Button>
                </motion.div>
              </motion.div>
            </Card>
          )}

          {/* ERROR STATE */}
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
                  Payment Failed
                </h2>
                
                <p className="text-gray-500 mb-6">
                  {errorMessage || 'Something went wrong with your payment. Please try again.'}
                </p>
                
                <Button onClick={handleTryAgain}>
                  Try Again
                </Button>
              </motion.div>
            </Card>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
