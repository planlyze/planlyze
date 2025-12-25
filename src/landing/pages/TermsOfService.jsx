import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Scale, CreditCard, Shield, Users, AlertTriangle, Gavel, Mail, RefreshCw, Ban, BookOpen, Globe, Bell, MessageCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { useAppTranslation } from '@/config';

export default function TermsOfServicePage() {
  const { lang, ti } = useAppTranslation('landing');

  useEffect(() => {
    const savedTheme = localStorage.getItem('planlyze-theme');
    if (savedTheme) {
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  const t = new Proxy({}, { get: (_, prop) => ti(`termsOfService.${String(prop)}`) });

  const sections = [
    { icon: BookOpen, title: t.section1Title, content: t.section1Content },
    { icon: FileText, title: t.section2Title, content: t.section2Content },
    { icon: Users, title: t.section3Title, content: t.section3Content },
    { icon: CreditCard, title: t.section4Title, content: t.section4Content },
    { icon: Shield, title: t.section5Title, content: t.section5Content },
    { icon: Ban, title: t.section6Title, content: t.section6Content },
    { icon: AlertTriangle, title: t.section7Title, content: t.section7Content },
    { icon: Scale, title: t.section8Title, content: t.section8Content },
    { icon: Shield, title: t.section9Title, content: t.section9Content },
    { icon: RefreshCw, title: t.section10Title, content: t.section10Content },
    { icon: Gavel, title: t.section11Title, content: t.section11Content },
    { icon: Globe, title: t.section12Title, content: t.section12Content },
    { icon: Bell, title: t.section13Title, content: t.section13Content },
    { icon: MessageCircle, title: t.section14Title, content: t.section14Content }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
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

      <main className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16">
          <div className="inline-flex p-4 rounded-full bg-orange-100 mb-6">
            <Scale className="w-12 h-12 text-orange-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">{t.title}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t.lastUpdated}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-8">
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">{t.intro}</p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 2) }}>
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-orange-400 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className={`p-3 rounded-full ${index % 2 === 0 ? 'bg-orange-100' : 'bg-purple-100'}`}>
                        <section.icon className={`w-6 h-6 ${index % 2 === 0 ? 'text-orange-600' : 'text-purple-500'}`} />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{section.title}</h2>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{section.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
