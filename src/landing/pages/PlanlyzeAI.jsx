import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Brain,
  Target,
  FileText,
  BarChart3,
  Zap,
  Globe,
  CheckCircle,
  MapPin,
  TrendingUp,
  Clock,
  Star,
  ChevronDown,
  Send,
  Unlock,
  HelpCircle,
  User,
  Smartphone,
  Award,
  Crown,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useTranslation } from "react-i18next";
import Header from "@/landing/components/planlyze/Header";
import Footer from "@/landing/components/planlyze/Footer";
import FeatureCard from "@/landing/components/planlyze/FeatureCard";
import BenefitCard from "@/landing/components/planlyze/BenefitCard";
import PricingCard from "@/landing/components/planlyze/PricingCard";
import SEOSchema from "@/landing/components/planlyze/SEOSchema";
import { api } from '@/api/client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CTA_BUTTON_CLASS, CTA_SMALL_BUTTON_CLASS } from '@/config';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const CountUp = ({ end }) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) return;

    const duration = 2000;
    const steps = 60;
    const increment = end / steps;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setCount(Math.min(Math.floor(increment * currentStep), end));
      } else {
        setCount(end);
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [end, hasStarted]);

  useEffect(() => {
    setHasStarted(true);
  }, []);

  return <span>{count.toLocaleString()}+</span>;
};

const defaultPartners = [
  { name: "Tech Startup", name_ar: "شركة ناشئة تقنية", color: "6B46C1" },
  { name: "Tech Accelerator", name_ar: "مسرّع تقني", color: "F59E0B" },
  { name: "Innovation Center", name_ar: "مركز الابتكار", color: "6B46C1" },
  { name: "Venture Partners", name_ar: "شركاء الاستثمار", color: "F59E0B" },
  { name: "Digital Solutions", name_ar: "حلول رقمية", color: "6B46C1" },
  { name: "Tech Institute", name_ar: "معهد التقنية", color: "F59E0B" },
  { name: "Business Network", name_ar: "شبكة الأعمال", color: "6B46C1" },
  { name: "Growth Lab", name_ar: "مختبر النمو", color: "F59E0B" },
];

export default function PlanlyzeAIPage() {
  const { t: ti, i18n } = useTranslation("landing");
  const lang = i18n?.language || "en";
  const [theme, setTheme] = useState("light");
  const [isSending, setIsSending] = useState(false);
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [stats, setStats] = useState({ users_count: 500, reports_count: 2000, syrian_apps_count: 150 });
  const [partners, setPartners] = useState(defaultPartners);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch('/api/credit-packages');
        if (response.ok) {
          const data = await response.json();
          setPackages(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch packages:', error);
      } finally {
        setPackagesLoading(false);
      }
    };
    fetchPackages();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/landing-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await fetch('/api/partners');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setPartners(data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch partners:', error);
      }
    };
    fetchPartners();
  }, []);

  useEffect(() => {
    const savedLang = localStorage.getItem("planlyze-language");
    if (savedLang && (savedLang === "en" || savedLang === "ar")) {
      i18n.changeLanguage(savedLang);
    }
    const savedTheme = localStorage.getItem("planlyze-theme");
    if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setTheme(prefersDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", prefersDark);
    }
    setupSEO();
  }, []);

  const setupSEO = () => {
    document.title =
      "Planlyze AI - AI-Powered Business Strategy Generator | Tech Startup & Project Planning Tool";

    const metaTags = [
      {
        name: "description",
        content:
          "Planlyze AI transforms your startup ideas into comprehensive business strategies. AI-powered planning tool for tech startups, study projects, and entrepreneurs.",
      },
      {
        name: "keywords",
        content:
          "AI business strategy, tech startup planning, project planning tool, business plan generator, Syrian market",
      },
      {
        property: "og:title",
        content: "Planlyze AI - AI-Powered Business Strategy Generator",
      },
      {
        property: "og:description",
        content:
          "Transform your startup ideas into actionable business strategies with AI.",
      },
      { property: "og:type", content: "website" },
    ];

    metaTags.forEach((tag) => {
      let element = document.querySelector(
        `meta[${tag.property ? "property" : "name"}="${
          tag.property || tag.name
        }"]`
      );
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(
          tag.property ? "property" : "name",
          tag.property || tag.name
        );
        document.head.appendChild(element);
      }
      element.setAttribute("content", tag.content);
    });
  };

  const handleLanguageChange = (newLang) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem("planlyze-language", newLang);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("planlyze-theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // keep existing code references (t.xxx) working by providing a proxy
  const t = new Proxy({}, { get: (_, prop) => ti(String(prop)) });

  const features = [
    { icon: Target, titleKey: 'feature1Title', descKey: 'feature1Desc', colorClass: 'text-purple-400' },
    { icon: BarChart3, titleKey: 'feature2Title', descKey: 'feature2Desc', colorClass: 'text-orange-400' },
    { icon: MapPin, titleKey: 'feature3Title', descKey: 'feature3Desc', colorClass: 'text-purple-400' },
    { icon: CheckCircle, titleKey: 'feature4Title', descKey: 'feature4Desc', colorClass: 'text-orange-400' },
    { icon: FileText, titleKey: 'feature5Title', descKey: 'feature5Desc', colorClass: 'text-purple-400' },
    { icon: TrendingUp, titleKey: 'feature6Title', descKey: 'feature6Desc', colorClass: 'text-orange-400' },
  ];

  const benefits = [
    { icon: Award, titleKey: 'benefit1Title', descKey: 'benefit1Desc' },
    { icon: FileText, titleKey: 'benefit2Title', descKey: 'benefit2Desc' },
    { icon: Clock, titleKey: 'benefit3Title', descKey: 'benefit3Desc' },
    { icon: BarChart3, titleKey: 'benefit4Title', descKey: 'benefit4Desc' },
  ];

  const steps = [
    {
      title: t.step1Title,
      desc: t.step1Desc,
      number: "01",
      icon: FileText,
      bgColor: "bg-purple-600",
    },
    {
      title: t.step2Title,
      desc: t.step2Desc,
      number: "02",
      icon: Brain,
      bgColor: "bg-orange-500",
    },
    {
      title: t.step3Title,
      desc: t.step3Desc,
      number: "03",
      icon: Star,
      bgColor: "bg-purple-600",
    },
  ];

  const faqs = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
    { q: t.faq5Q, a: t.faq5A },
    { q: t.faq6Q, a: t.faq6A },
    { q: t.faq7Q, a: t.faq7A },
  ];

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 text-[#070707] dark:text-gray-100"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <SEOSchema faqs={faqs} lang={lang} />
      <Header
        lang={lang}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onThemeChange={handleThemeChange}
      />

      <main>
        {/* Hero Section */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative py-20 lg:py-32 px-6 bg-gradient-to-br from-purple-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden pt-[148px] lg:pt-[196px]"
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600 rounded-full blur-[120px] animate-pulse"></div>
            <div
              className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500 rounded-full blur-[120px] animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div variants={itemVariants} className="space-y-8">
                <div className="space-y-6">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6919d7be088a309080879f3d/7f23c2838_Main_logo-01.png"
                    alt="Planlyze AI Logo"
                    className="h-24 lg:h-32 w-auto"
                  />
                  <h2 className="text-2xl lg:text-4xl font-semibold text-gray-700 dark:text-gray-300">
                    {t.heroSubtitle1}{" "}
                    <span className="text-orange-500 font-bold">
                      {t.heroSubtitleIdea}
                    </span>{" "}
                    {t.heroSubtitle2}{" "}
                    <span className="text-purple-500 font-bold">
                      {t.heroSubtitlePlan}
                    </span>
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
                    {t.heroDescription}
                  </p>
                </div>

                <motion.div
                  className="flex flex-col sm:flex-row gap-4"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link to={createPageUrl('Login')}>
                    <Button size="lg" className={CTA_BUTTON_CLASS}>
                      {t.tryAiNow} <Zap className="ms-2 w-5 h-5" />
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants} className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      {
                        icon: Brain,
                        label: t.heroStat1,
                        bg: "bg-purple-50 dark:bg-purple-900/30",
                        border: "border-purple-200 dark:border-purple-700",
                        hoverBorder: "hover:border-purple-400",
                        iconColor: "text-purple-600 dark:text-purple-400",
                      },
                      {
                        icon: MapPin,
                        label: t.heroStat2,
                        bg: "bg-orange-50 dark:bg-orange-900/30",
                        border: "border-orange-200 dark:border-orange-700",
                        hoverBorder: "hover:border-orange-400",
                        iconColor: "text-orange-500 dark:text-orange-400",
                      },
                      {
                        icon: FileText,
                        label: t.heroStat3,
                        bg: "bg-purple-50 dark:bg-purple-900/30",
                        border: "border-purple-200 dark:border-purple-700",
                        hoverBorder: "hover:border-purple-400",
                        iconColor: "text-purple-600 dark:text-purple-400",
                      },
                      {
                        icon: Clock,
                        label: t.heroStat4,
                        bg: "bg-orange-50 dark:bg-orange-900/30",
                        border: "border-orange-200 dark:border-orange-700",
                        hoverBorder: "hover:border-orange-400",
                        iconColor: "text-orange-500 dark:text-orange-400",
                      },
                    ].map((stat, index) => (
                      <motion.div
                        key={index}
                        className={`text-center p-6 ${stat.bg} rounded-2xl border ${stat.border} ${stat.hoverBorder} transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                        whileHover={{ y: -5 }}
                      >
                        <stat.icon
                          className={`w-8 h-8 ${stat.iconColor} mx-auto mb-3`}
                        />
                        <div className="text-lg font-bold text-[#070707] dark:text-white">
                          {stat.label}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Stats Section */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="py-16 px-6 bg-gradient-to-r from-purple-600 to-orange-500"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { number: stats.users_count, label: t.statsUsers, icon: User },
                { number: stats.reports_count, label: t.statsReports, icon: FileText },
                { number: stats.syrian_apps_count, label: t.syApps, icon: Smartphone },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300"
                  whileHover={{ y: -5, scale: 1.05 }}
                >
                  <motion.div
                    initial={{ rotate: 0 }}
                    whileInView={{ rotate: 360 }}
                    transition={{ duration: 1, delay: index * 0.2 }}
                    viewport={{ once: true }}
                  >
                    <stat.icon className="w-12 h-12 text-white mx-auto mb-4" />
                  </motion.div>
                  <motion.div
                    className="text-5xl font-bold text-white mb-2"
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    viewport={{ once: true }}
                  >
                    <CountUp end={stat.number} />
                  </motion.div>
                  <div className="text-lg text-white/90">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* About Section */}
        <motion.section
          id="about"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="py-24 px-6 bg-white dark:bg-gray-900"
        >
          <div className="max-w-5xl mx-auto text-center">
            <motion.h2
              variants={itemVariants}
              className="text-5xl font-bold text-[#070707] dark:text-white mb-8"
            >
              {t.aboutTitle}
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-2xl text-gray-600 dark:text-gray-400 leading-relaxed"
            >
              {t.aboutDescription}
            </motion.p>
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section
          id="features"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="py-24 px-6 bg-purple-50 dark:bg-gray-800"
        >
          <div className="max-w-7xl mx-auto">
            <motion.h2
              variants={itemVariants}
              className="text-5xl font-bold text-[#070707] dark:text-white text-center mb-16"
            >
              {t.featuresTitle}
            </motion.h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="py-24 px-6 bg-white dark:bg-gray-900"
        >
          <div className="max-w-7xl mx-auto">
            <motion.h2
              variants={itemVariants}
              className="text-5xl font-bold text-[#070707] dark:text-white text-center mb-16"
            >
              {t.howItWorksTitle}
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center"
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative mb-8">
                    <motion.div
                      className={`w-20 h-20 ${step.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}
                      whileHover={{ scale: 1.15 }}
                      transition={{ duration: 0.6 }}
                    >
                      <span className="text-4xl font-bold text-white">
                        {index + 1}
                      </span>
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-semibold text-[#070707] dark:text-white mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Benefits Section */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="py-24 px-6 bg-white dark:bg-gray-900"
        >
          <div className="max-w-7xl mx-auto">
            <motion.h2
              variants={itemVariants}
              className="text-5xl font-bold text-[#070707] dark:text-white text-center mb-16"
            >
              {t.benefitsTitle}
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <BenefitCard key={index} {...benefit} />
              ))}
            </div>
          </div>
        </motion.section>

        {/* Partners Section */}
        <motion.section
          id="partners"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="py-24 px-6 bg-purple-50 dark:bg-gray-800"
        >
          <div className="max-w-7xl mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-5xl font-bold text-[#070707] dark:text-white mb-6">
                {t.partnersTitle}
              </h2>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {partners.map((partner, index) => {
                const partnerName = lang === 'ar' && partner.name_ar ? partner.name_ar : partner.name;
                const displayName = partner.logo_url ? '' : partnerName;
                const CardWrapper = partner.website_url ? 'a' : 'div';
                const cardProps = partner.website_url ? {
                  href: partner.website_url,
                  target: '_blank',
                  rel: 'noopener noreferrer'
                } : {};
                return (
                  <motion.div
                    key={partner.id || index}
                    variants={itemVariants}
                    whileHover={{ y: -5, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardWrapper
                      {...cardProps}
                      className={`flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 transition-all duration-300 hover:shadow-lg h-full ${partner.website_url ? 'cursor-pointer' : ''}`}
                    >
                      <img
                        src={partner.logo_url || `https://via.placeholder.com/150x60/${
                          partner.color || '6B46C1'
                        }/FFFFFF?text=${partnerName.replace(/ /g, "+")}`}
                        alt={partnerName}
                        className="w-full h-auto mb-4 rounded-lg opacity-80 hover:opacity-100 transition-opacity duration-300"
                      />
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
                        {partnerName}
                      </h4>
                    </CardWrapper>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* Pricing Section */}
        <motion.section
          id="pricing"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="py-24 px-6 bg-white dark:bg-gray-900"
        >
          <div className="max-w-7xl mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-20">
              <h2 className="text-5xl font-bold text-[#070707] dark:text-white mb-6">
                {t.pricingTitle}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {t.pricingSubtitle}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <PricingCard
                icon={Unlock}
                titleKey="freeTier"
                price="$0"
                descriptionKey="freeTierDesc"
                featuresKeys={["freeTierFeature1", "freeTierFeature2"]}
                notIncludedKeys={["freeTierNotIncluded1", "freeTierNotIncluded2", "freeTierNotIncluded3"]}
                selectTextKey="selectPlan"
              />
              {packagesLoading ? (
                <div className="col-span-2 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : packages.length > 0 ? (
                packages.map((pkg, index) => (
                  <PricingCard
                    key={pkg.id}
                    icon={pkg.is_popular ? Zap : Crown}
                    title={lang === 'ar' ? (pkg.name_ar || pkg.name) : pkg.name}
                    price={`$${pkg.price_usd}`}
                    description={lang === 'ar' ? (pkg.description_ar || pkg.description) : pkg.description}
                    features={lang === 'ar' ? (pkg.features_ar || pkg.features || []) : (pkg.features || [])}
                    badge={pkg.is_popular ? t.mostPopular : (index === packages.length - 1 ? t.bestValue : null)}
                    variant={pkg.is_popular ? 'popular' : (index === packages.length - 1 ? 'best' : 'default')}
                    selectText={t.selectPlan}
                  />
                ))
              ) : (
                <>
                  <PricingCard
                    icon={Zap}
                    titleKey="payPerReport"
                    price={t.payPerReportPrice}
                    descriptionKey="payPerReportDesc"
                    featuresKeys={["payPerReportFeature1","payPerReportFeature2","payPerReportFeature3","payPerReportFeature4","payPerReportFeature5","payPerReportFeature6"]}
                    badge={t.mostPopular}
                    variant="popular"
                    selectTextKey="selectPlan"
                  />
                  <PricingCard
                    icon={Crown}
                    titleKey="bundlePackage"
                    price={t.bundlePackagePrice}
                    descriptionKey="bundlePackageDesc"
                    featuresKeys={["bundlePackageFeature1","bundlePackageFeature2","bundlePackageFeature3","bundlePackageFeature4","bundlePackageFeature5","bundlePackageFeature6"]}
                    badge={t.bestValue}
                    variant="best"
                    selectTextKey="selectPlan"
                  />
                </>
              )}
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="py-28 px-6 bg-gradient-to-br from-purple-600 to-orange-500 relative overflow-hidden"
        >
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div variants={itemVariants} className="space-y-8">
              <motion.h2
                className="text-5xl lg:text-6xl font-bold text-white"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {t.ctaTitle}
              </motion.h2>
              <motion.p
                className="text-xl text-white/90 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {t.ctaSubtitle}
              </motion.p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Link to={createPageUrl('Login')}>
                  <Button
                    size="lg"
                    className="bg-white hover:bg-gray-100 text-purple-600 my-5 px-4 py-2 text-lg font-semibold rounded-full shadow-2xl transition-all duration-300 hover:scale-105"
                  >
                    {t.getStarted}
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* FAQ Section */}
        <motion.section
          id="faq"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="py-24 px-6 bg-white dark:bg-gray-900"
        >
          <div className="max-w-4xl mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <div className="inline-flex p-3 rounded-full bg-purple-100 mb-6">
                <HelpCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-5xl font-bold text-[#070707] dark:text-white mb-6">
                {t.faqTitle}
              </h2>
            </motion.div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="group"
                >
                  <details className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden hover:border-purple-400 transition-all duration-300">
                    <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                      <span className="text-lg font-semibold text-[#070707] dark:text-white pe-4">
                        {faq.q}
                      </span>
                      <ChevronDown className="w-5 h-5 text-purple-600 flex-shrink-0 transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </details>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Contact Section */}
        <motion.section
          id="contact"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="py-24 px-6 bg-purple-50 dark:bg-gray-800"
        >
          <div className="max-w-4xl mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-5xl font-bold text-[#070707] dark:text-white mb-6">
                {t.contactTitle}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {t.contactSubtitle}
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl">
                <CardContent className="p-8">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setIsSending(true);
                      const formData = new FormData(e.target);
                      const name = formData.get("name");
                      const email = formData.get("email");
                      const message = formData.get("message");
                      try {
                        await api.post('/contact', { name, email, message });
                        toast({
                          title:
                            lang === "ar"
                              ? "تم الإرسال بنجاح!"
                              : "Message Sent!",
                          description:
                            lang === "ar"
                              ? "شكراً لتواصلك معنا. سنرد عليك قريباً."
                              : "Thank you for contacting us. We will get back to you soon.",
                          duration: 5000,
                        });
                        e.target.reset();
                      } catch (error) {
                        toast({
                          title: lang === "ar" ? "حدث خطأ" : "Error",
                          description:
                            lang === "ar"
                              ? "فشل إرسال الرسالة. حاول مرة أخرى."
                              : "Failed to send message. Please try again.",
                          variant: "destructive",
                          duration: 5000,
                        });
                      } finally {
                        setIsSending(false);
                      }
                    }}
                    className="space-y-6"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t.contactFormName}
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 outline-none bg-white dark:bg-gray-800 text-[#070707] dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t.contactFormEmail}
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 outline-none bg-white dark:bg-gray-800 text-[#070707] dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t.contactFormMessage}
                      </label>
                      <textarea
                        name="message"
                        required
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 outline-none resize-none bg-white dark:bg-gray-800 text-[#070707] dark:text-white"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSending}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                    >
                      <Send className="w-5 h-5 me-2" />
                      {isSending
                        ? lang === "ar"
                          ? "جاري الإرسال..."
                          : "Sending..."
                        : t.contactFormSend}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.section>
      </main>

      <Footer />
      <Toaster />
    </div>
  );
}
