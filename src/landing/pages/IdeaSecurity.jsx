import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Eye, EyeOff, Server, CheckCircle, FileText, Key } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

export default function IdeaSecurityPage() {
  const { t: ti, i18n } = useTranslation('landing');
  const lang = i18n?.language || 'en';

  useEffect(() => {
    const savedLang = localStorage.getItem('planlyze-language');
    if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
      i18n.changeLanguage(savedLang);
    }
    const savedTheme = localStorage.getItem('planlyze-theme');
    if (savedTheme) {
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  const t = new Proxy({}, { get: (_, prop) => ti(`ideaSecurity.${String(prop)}`) });

  const securityFeatures = [
    { icon: Lock, title: t.section1Title, content: t.section1Content, color: "text-purple-400" },
    { icon: EyeOff, title: t.section2Title, content: t.section2Content, color: "text-orange-400" },
    { icon: Server, title: t.section3Title, content: t.section3Content, color: "text-purple-400" },
    { icon: Key, title: t.section4Title, content: t.section4Content, color: "text-orange-400" },
    { icon: FileText, title: t.section5Title, content: t.section5Content, color: "text-purple-400" },
    { icon: CheckCircle, title: t.section6Title, content: t.section6Content, color: "text-orange-400" }
  ];

  const guaranteeItems = (() => {
    const raw = ti('ideaSecurity.guaranteeItems', { returnObjects: true });
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') return Object.values(raw);
    if (typeof raw === 'string') return raw.split('\n').map(s => s.trim()).filter(Boolean);
    return [];
  })();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to={createPageUrl('')}>
            <Button variant="ghost" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-800">
              <ArrowLeft className={`w-5 h-5 ${lang === 'ar' ? 'ml-2 rotate-180' : 'mr-2'}`} />
              {t.backToHome}
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16">
          <Badge className="bg-purple-100 text-purple-600 border border-purple-200 px-6 py-3 text-lg mb-6">
            <Shield className="w-5 h-5 me-2" />
            {t.subtitle}
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">{t.title}</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">{t.intro}</p>
        </motion.div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}>
              <Card className="h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className={`p-4 rounded-full ${index % 2 === 0 ? 'bg-purple-100' : 'bg-orange-100'}`}>
                        <feature.icon className={`w-8 h-8 ${index % 2 === 0 ? 'text-purple-600' : 'text-orange-500'}`} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Security Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-16">
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">{t.guaranteeTitle}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {guaranteeItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Confidentiality Commitment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-16">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t.confidentialityTitle}</h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">{t.confidentialityContent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-center">
          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.contactTitle}</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t.contactContent}</p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
