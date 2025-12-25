import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function PageLoader({ message, isArabic = false }) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-orange-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <div className="absolute -inset-2 bg-gradient-to-br from-purple-500/20 to-orange-500/20 rounded-3xl blur-xl animate-pulse" />
        </div>
        {message && (
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {message}
          </p>
        )}
      </motion.div>
    </div>
  );
}
