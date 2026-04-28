import React from 'react';
import { motion } from 'framer-motion';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange
}) => {
  const methods = [
    { id: 'card', name: 'Card', icon: '💳' },
    { id: 'apple', name: 'Apple Pay', icon: '🍎' },
    { id: 'google', name: 'Google Pay', icon: '🔵' }
  ];

  return (
    <motion.div 
      className="grid grid-cols-3 gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {methods.map((method, index) => (
        <motion.button
          key={method.id}
          onClick={() => onMethodChange(method.id)}
          className={`
            border border-gray-200 rounded-xl py-3 text-sm 
            flex items-center justify-center gap-2 
            transition-all duration-200 ease-in-out
            ${selectedMethod === method.id 
              ? 'border-blue-400 bg-blue-50 text-blue-600 shadow-md' 
              : 'hover:bg-gray-50 hover:border-gray-300'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 17, delay: index * 0.1 }}
        >
          <motion.span 
            className="text-lg"
            animate={{ 
              rotate: selectedMethod === method.id ? [0, -10, 10, 0] : 0 
            }}
            transition={{ duration: 0.3 }}
          >
            {method.icon}
          </motion.span>
          <span className="font-medium">{method.name}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};
