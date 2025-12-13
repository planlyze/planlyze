import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function FeatureCard({ icon: Icon, title, desc, colorClass }) {
  const isPurple = colorClass === 'text-purple-400';
  
  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -10, scale: 1.02 }}
      transition={{ duration: 0.3 }}>
      <Card className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center hover:border-purple-400 hover:shadow-xl transition-all duration-300 group">
        <CardContent className="p-8">
          <motion.div 
            className={`inline-flex p-4 rounded-full mb-6 border ${isPurple ? 'bg-purple-100 border-purple-200' : 'bg-orange-100 border-orange-200'}`}
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}>
            <Icon className={`w-8 h-8 ${isPurple ? 'text-purple-600' : 'text-orange-500'}`} />
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
