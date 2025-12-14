import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight, BookOpen, Search } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

import Header from '@/landing/components/planlyze/Header';
import Footer from '@/landing/components/planlyze/Footer';
import { useTranslation } from 'react-i18next';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const categoryColors = {
  'ai': 'bg-purple-100 text-purple-700 border-purple-200',
  'business-strategy': 'bg-orange-100 text-orange-700 border-orange-200',
  'syrian-market': 'bg-green-100 text-green-700 border-green-200',
  'tech-startup': 'bg-blue-100 text-blue-700 border-blue-200',
  'entrepreneurship': 'bg-pink-100 text-pink-700 border-pink-200'
};

const categoryLabels = {
  en: {
    'ai': 'AI & Technology',
    'business-strategy': 'Business Strategy',
    'syrian-market': 'Syrian Market',
    'tech-startup': 'Tech Startup',
    'entrepreneurship': 'Entrepreneurship'
  },
  ar: {
    'ai': 'الذكاء الاصطناعي',
    'business-strategy': 'استراتيجية الأعمال',
    'syrian-market': 'السوق السوري',
    'tech-startup': 'الشركات الناشئة',
    'entrepreneurship': 'ريادة الأعمال'
  }
};

export default function BlogPage() {
  const { t: ti, i18n } = useTranslation('landing');
  const lang = i18n?.language || 'en';
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    document.title = lang === 'en' 
      ? "Blog | Planlyze AI - AI Business Strategy Insights" 
      : "المدونة | Planlyze AI - رؤى استراتيجية الأعمال";
  }, [lang]);

  const handleLanguageChange = (newLang) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem('planlyze-language', newLang);
  };
  const t = new Proxy({}, { get: (_, prop) => ti(String(prop)) });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blogPosts'],
    queryFn: () => base44.entities.BlogPost.filter({ published: true }, '-publish_date')
  });

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const title = lang === 'ar' && post.title_ar ? post.title_ar : post.title_en;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const blogContent = {
    en: {
      title: "Blog",
      subtitle: "Insights on AI, business strategy, and the Syrian market",
      search: "Search articles...",
      allCategories: "All",
      readMore: "Read More",
      minRead: "min read",
      noPosts: "No articles found",
      noPostsDesc: "Check back soon for new content!"
    },
    ar: {
      title: "المدونة",
      subtitle: "رؤى حول الذكاء الاصطناعي واستراتيجية الأعمال والسوق السوري",
      search: "البحث في المقالات...",
      allCategories: "الكل",
      readMore: "اقرأ المزيد",
      minRead: "دقيقة قراءة",
      noPosts: "لا توجد مقالات",
      noPostsDesc: "تابعنا قريباً لمحتوى جديد!"
    }
  };

  const bt = blogContent[lang];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Header lang={lang} onLanguageChange={handleLanguageChange} />

      <main className="pt-32 pb-24">
        {/* Hero Section */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-6 mb-16">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div variants={itemVariants} className="inline-flex p-3 rounded-full bg-purple-100 mb-6">
              <BookOpen className="w-8 h-8 text-purple-600" />
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {bt.title}
            </motion.h1>
            <motion.p variants={itemVariants} className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {bt.subtitle}
            </motion.p>
          </div>
        </motion.section>

        {/* Filters */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-6 mb-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <motion.div variants={itemVariants} className="relative w-full md:w-80">
                <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={bt.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-12 pe-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </motion.div>

              {/* Categories */}
              <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                  className={`rounded-full ${selectedCategory === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}>
                  {bt.allCategories}
                </Button>
                {Object.keys(categoryColors).map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full ${selectedCategory === cat ? 'bg-purple-600 hover:bg-purple-700' : ''}`}>
                    {categoryLabels[lang][cat]}
                  </Button>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Blog Posts Grid */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-6">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-t-2xl" />
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-b-2xl border border-gray-200 dark:border-gray-700">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-4" />
                      <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full mb-4" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <motion.div variants={itemVariants} className="text-center py-16">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{bt.noPosts}</h3>
                <p className="text-gray-500 dark:text-gray-400">{bt.noPostsDesc}</p>
              </motion.div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    variants={itemVariants}
                    whileHover={{ y: -10 }}
                    transition={{ duration: 0.3 }}>
                    <Link to={createPageUrl(`BlogPost?slug=${post.slug}`)}>
                      <Card className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-xl transition-all duration-300 overflow-hidden group">
                        {post.cover_image && (
                          <div className="h-48 overflow-hidden">
                            <img
                              src={post.cover_image}
                              alt={lang === 'ar' && post.title_ar ? post.title_ar : post.title_en}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={`${categoryColors[post.category]} border`}>
                              {categoryLabels[lang][post.category]}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
                            {lang === 'ar' && post.title_ar ? post.title_ar : post.title_en}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                            {lang === 'ar' && post.excerpt_ar ? post.excerpt_ar : post.excerpt_en}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-4">
                              {post.publish_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {format(new Date(post.publish_date), 'MMM d, yyyy')}
                                </span>
                              )}
                              {post.read_time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {post.read_time} {bt.minRead}
                                </span>
                              )}
                            </div>
                            <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}
