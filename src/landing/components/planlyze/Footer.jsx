import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Facebook, Linkedin, Instagram, MessageCircle, Send, Twitter, Youtube, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import SocialLink from './SocialLink';
import { HEADER_CTA_CLASS, useAppTranslation } from '@/config';
import { createPageUrl } from '@/utils';
import { api } from '@/api/client';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6919d7be088a309080879f3d/1d57ae70b_Main_logo-01.png";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const iconMap = {
  Facebook,
  Linkedin,
  Instagram,
  MessageCircle,
  Send,
  Twitter,
  Youtube,
  ExternalLink
};

const fallbackSocialLinks = [
  { href: "https://facebook.com/planlyze", icon: Facebook },
  { href: "https://www.linkedin.com/company/planlyzeco", icon: Linkedin },
  { href: "https://www.instagram.com/planlyze/", icon: Instagram },
  { href: "https://chat.whatsapp.com/IP3RfknGF262dWfB9u1Cjt", icon: MessageCircle, hoverColor: "hover:bg-green-500 hover:border-green-500" },
  { href: "https://t.me/planlyze", icon: Send, hoverColor: "hover:bg-blue-500 hover:border-blue-500" }
];

export default function Footer() {
  const { t } = useAppTranslation('landing');
  const [socialLinks, setSocialLinks] = useState([]);
  
  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const data = await api.get('/social-media');
        if (Array.isArray(data) && data.length > 0) {
          setSocialLinks(data.map(link => ({
            href: link.url,
            icon: iconMap[link.icon] || ExternalLink,
            hoverColor: link.hover_color
          })));
        } else {
          setSocialLinks(fallbackSocialLinks);
        }
      } catch (e) {
        console.log("Using fallback social links");
        setSocialLinks(fallbackSocialLinks);
      }
    };
    fetchSocialLinks();
  }, []);
  
  return (
    <motion.footer
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 py-20 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-8 text-start">
          <div className="md:col-span-2">
            <img src={LOGO_URL} alt="Planlyze" className="h-12 mb-6" />
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">{t.footerDesc}</p>
            <div className="flex space-x-4 rtl:space-x-reverse">
              {socialLinks.map((link, index) => (
                <SocialLink key={index} {...link} />
              ))}
            </div>
          </div>

          <div className="md:col-span-1">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">{t.legal}</h3>
            <div className="space-y-3">
              <Link to={createPageUrl('PrivacyPolicy')} className="block text-gray-600 dark:text-gray-400 hover:text-orange-500 transition-colors duration-300">
                {t.privacyPolicy}
              </Link>
              <Link to={createPageUrl('IdeaSecurity')} className="block text-gray-600 dark:text-gray-400 hover:text-orange-500 transition-colors duration-300">
                {t.ideaSecurity}
              </Link>
            </div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="border-t border-gray-200 dark:border-gray-700 mt-12 pt-8 text-center text-gray-500 dark:text-gray-400">
          <p>{t.copyright}</p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
