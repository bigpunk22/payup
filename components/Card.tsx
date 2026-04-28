import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      className={`
        bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl 
        p-6 md:p-8 space-y-6 transition-all duration-300 ease-in-out
        hover:shadow-2xl hover:scale-[1.01]
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
      whileHover={{ 
        y: -2,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}
    >
      {children}
    </motion.div>
  );
};
