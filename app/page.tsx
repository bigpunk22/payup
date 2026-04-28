'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to send page after a short delay
    const timer = setTimeout(() => {
      router.push('/send');
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: 360
          }}
          transition={{ 
            scale: { duration: 1, repeat: Infinity },
            rotate: { duration: 3, repeat: Infinity, ease: "linear" }
          }}
        >
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </motion.div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Voucher Remittance
        </h1>
        <p className="text-gray-600">
          Redirecting to send page...
        </p>
      </motion.div>
    </div>
  );
}
