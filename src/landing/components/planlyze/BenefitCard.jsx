import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function BenefitCard({ icon: Icon, title, desc }) {
  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3 }}>
      <Card className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-orange-400 hover:shadow-xl transition-all duration-300">
        <CardContent className="p-8 flex items-start gap-6">
          <div className="flex-shrink-0">
            <motion.div 
              className="inline-flex p-4 rounded-full bg-orange-100 border border-orange-200"
              whileHover={{ scale: 1.2, rotate: 15 }}
              transition={{ duration: 0.3 }}>
              <Icon className="w-8 h-8 text-orange-500" />
            </motion.div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: desc }} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
