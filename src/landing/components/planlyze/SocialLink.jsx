import React from 'react';
import { motion } from 'framer-motion';

export default function SocialLink({ href, icon: Icon, hoverColor = 'hover:bg-orange-500 hover:border-orange-500' }) {
  return (
    <motion.a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-10 h-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 ${hoverColor} hover:text-white transition-all duration-300`}
      whileHover={{ scale: 1.2, rotate: 360 }}
      transition={{ duration: 0.4 }}>
      <Icon className="w-5 h-5" />
    </motion.a>
  );
}
