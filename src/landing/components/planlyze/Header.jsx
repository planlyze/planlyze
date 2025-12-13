import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { HEADER_CTA_CLASS } from '@/config';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useAppTranslation } from '@/config';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6919d7be088a309080879f3d/1d57ae70b_Main_logo-01.png";

export default function Header({ lang: propLang, onLanguageChange, theme, onThemeChange }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, lang, changeLanguage } = useAppTranslation('landing');

  const navSections = [
    { id: 'about', key: 'navAbout', isAnchor: true },
    { id: 'features', key: 'navFeatures', isAnchor: true },
    { id: 'partners', key: 'navPartners', isAnchor: true },
    { id: 'pricing', key: 'navPricing', isAnchor: true },
    { id: 'faq', key: 'navFAQ', isAnchor: true },
    { id: 'contact', key: 'navContact', isAnchor: true }
  ];

  return (
    <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 fixed top-0 w-full z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <a className="flex items-center space-x-2 rtl:space-x-reverse">
            <img src={LOGO_URL} alt="Planlyze" className="h-10" />
          </a>

          <nav className="hidden md:flex items-center gap-2">
            {navSections.map((section) => (
              section.isAnchor ? (
                <a 
                  key={section.id}
                  href={`#${section.id}`} 
                  className="text-gray-700 dark:text-gray-300 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-800 px-4 py-2 rounded-full transition-all duration-300 font-medium active:scale-95">
                  {t[section.key]}
                </a>
              ) : (
                <Link 
                  key={section.id}
                  to={createPageUrl(section.id)} 
                  className="text-gray-700 dark:text-gray-300 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-800 px-4 py-2 rounded-full transition-all duration-300 font-medium active:scale-95">
                  {t[section.key]}
                </Link>
              )
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
              className="border-purple-400 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 dark:bg-gray-800 dark:border-gray-600 dark:text-yellow-400 dark:hover:bg-yellow-400 dark:hover:text-gray-900">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const next = lang === 'en' ? 'ar' : 'en';
                changeLanguage(next);
                if (onLanguageChange) onLanguageChange(next);
              }}
              className="hidden sm:flex border-purple-400 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 px-6 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 dark:bg-gray-800 dark:border-gray-600 dark:text-purple-400">
              {lang === 'en' ? 'العربية' : 'English'}
            </Button>            
            <Link to={createPageUrl('Login')} className="hidden sm:block">
              <Button className={HEADER_CTA_CLASS}>
                {lang === 'en' ? 'Get Started' : 'ابدأ الآن'}
              </Button>
            </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden border-gray-300 dark:border-gray-600 rounded-full">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 space-y-2">
              {navSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-gray-700 dark:text-gray-300 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-800 px-4 py-3 rounded-xl transition-all duration-300 font-medium">
                  {t[section.key]}
                </a>
              ))}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <Button
                  variant="outline"
                  onClick={() => onLanguageChange(lang === 'en' ? 'ar' : 'en')}
                  className="w-full border-purple-400 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 px-6 py-2 rounded-full font-semibold dark:bg-gray-800 dark:border-gray-600 dark:text-purple-400">
                  {lang === 'en' ? 'العربية' : 'English'}
                </Button>
                <Link to={createPageUrl('Login')} className="block">
                  <Button className={`w-full ${HEADER_CTA_CLASS}`}>
                    {lang === 'en' ? 'Get Started' : 'ابدأ الآن'}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
