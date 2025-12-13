import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowLeft, Share2, BookOpen } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

import Header from '@/landing/components/planlyze/Header';
import Footer from '@/landing/components/planlyze/Footer';
import { useTranslation } from 'react-i18next';

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

export default function BlogPostPage() {
  const { t: ti, i18n } = useTranslation('landing');
  const lang = i18n?.language || 'en';
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  useEffect(() => {
    const savedLang = localStorage.getItem('planlyze-language');
    if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
      i18n.changeLanguage(savedLang);
    }
  }, []);

  const handleLanguageChange = (newLang) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem('planlyze-language', newLang);
  };
  const t = new Proxy({}, { get: (_, prop) => ti(String(prop)) });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blogPost', slug],
    queryFn: () => base44.entities.BlogPost.filter({ slug, published: true }),
    enabled: !!slug
  });

  const post = posts[0];

  useEffect(() => {
    if (post) {
      const title = lang === 'ar' && post.title_ar ? post.title_ar : post.title_en;
      document.title = `${title} | Planlyze AI Blog`;

      // Add Article Schema
      const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "image": post.cover_image,
        "datePublished": post.publish_date,
        "author": {
          "@type": "Organization",
          "name": "Planlyze AI"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Planlyze AI",
          "logo": {
            "@type": "ImageObject",
            "url": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6919d7be088a309080879f3d/1d57ae70b_Main_logo-01.png"
          }
        }
      };

      let script = document.getElementById('article-schema');
      if (!script) {
        script = document.createElement('script');
        script.id = 'article-schema';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(articleSchema);
    }
  }, [post, lang]);

  const blogContent = {
    en: {
      backToBlog: "Back to Blog",
      minRead: "min read",
      share: "Share",
      notFound: "Article not found",
      notFoundDesc: "The article you're looking for doesn't exist or has been removed."
    },
    ar: {
      backToBlog: "العودة للمدونة",
      minRead: "دقيقة قراءة",
      share: "مشاركة",
      notFound: "المقال غير موجود",
      notFoundDesc: "المقال الذي تبحث عنه غير موجود أو تم حذفه."
    }
  };

  const bt = blogContent[lang];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: lang === 'ar' && post.title_ar ? post.title_ar : post.title_en,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Header t={t} lang={lang} onLanguageChange={handleLanguageChange} />
        <main className="pt-32 pb-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{bt.notFound}</h1>
            <p className="text-gray-600 mb-8">{bt.notFoundDesc}</p>
            <Link to={createPageUrl('Blog')}>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full">
                <ArrowLeft className="w-4 h-4 me-2 rtl:rotate-180" />
                {bt.backToBlog}
              </Button>
            </Link>
          </div>
        </main>
        <Footer t={t} />
      </div>
    );
  }

  const title = lang === 'ar' && post.title_ar ? post.title_ar : post.title_en;
  const postContent = lang === 'ar' && post.content_ar ? post.content_ar : post.content_en;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Header t={t} lang={lang} onLanguageChange={handleLanguageChange} />

      <main className="pt-32 pb-24">
        <article className="max-w-4xl mx-auto px-6">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8">
            <Link to={createPageUrl('Blog')}>
              <Button variant="outline" className="rounded-full">
                <ArrowLeft className="w-4 h-4 me-2 rtl:rotate-180" />
                {bt.backToBlog}
              </Button>
            </Link>
          </motion.div>

          {/* Cover Image */}
          {post.cover_image && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 rounded-2xl overflow-hidden shadow-xl">
              <img
                src={post.cover_image}
                alt={title}
                className="w-full h-64 md:h-96 object-cover"
              />
            </motion.div>
          )}

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge className={`${categoryColors[post.category]} border`}>
                {categoryLabels[lang][post.category]}
              </Badge>
              {post.tags?.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-gray-600">
                  #{tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {title}
            </h1>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 text-gray-500">
                {post.publish_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(post.publish_date), 'MMMM d, yyyy')}
                  </span>
                )}
                {post.read_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.read_time} {bt.minRead}
                  </span>
                )}
              </div>
              <Button variant="outline" onClick={handleShare} className="rounded-full">
                <Share2 className="w-4 h-4 me-2" />
                {bt.share}
              </Button>
            </div>
          </motion.header>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-purple-600 prose-strong:text-gray-900">
            <ReactMarkdown>{postContent}</ReactMarkdown>
          </motion.div>
        </article>
      </main>

      <Footer t={t} />
    </div>
  );
}
