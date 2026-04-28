import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  loading = false, 
  children, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseClasses = 'w-full py-3 rounded-xl font-medium transition-all duration-200 ease-in-out';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:brightness-110 active:scale-95 disabled:opacity-50 shadow-lg hover:shadow-xl',
    secondary: 'border border-gray-200 rounded-xl py-3 text-sm hover:bg-gray-50 active:scale-95 hover:shadow-md'
  };

  return (
    <motion.button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...(props as any)}
    >
      {loading && (
        <motion.div 
          className="inline-block mr-3"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </motion.div>
      )}
      {children}
    </motion.button>
  );
};
