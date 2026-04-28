import React from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <motion.div 
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <motion.input
        className={`
          w-full rounded-xl border border-gray-200 px-4 py-3 text-base
          focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 
          outline-none transition-all duration-200 ease-in-out
          hover:border-gray-300
          ${error ? 'border-red-300 focus:ring-red-30' : ''}
          ${className}
        `}
        whileFocus={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...(props as any)}
      />
      {error && (
        <motion.p 
          className="text-sm text-red-500"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
};
