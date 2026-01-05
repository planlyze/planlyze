import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  X, ChevronRight, ChevronLeft, Sparkles, FileText, 
  CreditCard, Users, Share2, CheckCircle2, Lightbulb,
  Target, BarChart3, Star, ArrowRight
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SystemSettings } from "@/api/client";

const ONBOARDING_KEY = "planlyze_onboarding_completed";
const ONBOARDING_STEP_KEY = "planlyze_onboarding_step";

const steps = [
  {
    id: "welcome",
    icon: Sparkles,
    iconColor: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    title: {
      en: "Welcome to Planlyze!",
      ar: "مرحباً بك في Planlyze!"
    },
    description: {
      en: "Your AI-powered business analysis platform. Let's take a quick tour to help you get started.",
      ar: "منصة تحليل الأعمال المدعومة بالذكاء الاصطناعي. دعنا نأخذ جولة سريعة لمساعدتك على البدء."
    },
    tip: {
      en: "This tour will show you the main features of the platform.",
      ar: "ستعرض لك هذه الجولة الميزات الرئيسية للمنصة."
    }
  },
  {
    id: "new_analysis",
    icon: FileText,
    iconColor: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    title: {
      en: "Create Your First Analysis",
      ar: "إنشاء تحليلك الأول"
    },
    description: {
      en: "Click 'New Analysis' to start analyzing your business idea. Enter your concept and let our AI provide comprehensive insights.",
      ar: "انقر على 'تحليل جديد' لبدء تحليل فكرتك التجارية. أدخل مفهومك ودع الذكاء الاصطناعي يقدم رؤى شاملة."
    },
    tip: {
      en: "Free reports give you a basic overview. Premium reports include detailed market analysis, financial projections, and more.",
      ar: "التقارير المجانية تعطيك نظرة عامة أساسية. التقارير المميزة تتضمن تحليل سوق مفصل وتوقعات مالية والمزيد."
    }
  },
  {
    id: "reports",
    icon: BarChart3,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    title: {
      en: "View Your Reports",
      ar: "عرض تقاريرك"
    },
    description: {
      en: "Access all your analysis reports from the Reports page. Each report includes 6 detailed sections covering every aspect of your business idea.",
      ar: "الوصول إلى جميع تقارير التحليل من صفحة التقارير. يتضمن كل تقرير 6 أقسام مفصلة تغطي كل جانب من فكرتك التجارية."
    },
    tip: {
      en: "Premium reports include: Overview, Market Analysis, Business Model, Technical Requirements, Financial Projections, and Strategy.",
      ar: "التقارير المميزة تشمل: نظرة عامة، تحليل السوق، نموذج العمل، المتطلبات التقنية، التوقعات المالية، والاستراتيجية."
    }
  },
  {
    id: "credits",
    icon: CreditCard,
    iconColor: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    title: {
      en: "Credits System",
      ar: "نظام الرصيد"
    },
    description: {
      en: (cost) => `Purchase credits to generate premium reports. Each premium analysis costs ${cost} credit${cost === 1 ? '' : 's'}. Choose from flexible packages that suit your needs.`,
      ar: (cost) => `اشترِ رصيداً لإنشاء تقارير مميزة. كل تحليل مميز يكلف ${cost} رصيد. اختر من الباقات المرنة التي تناسب احتياجاتك.`
    },
    tip: {
      en: "Check the Credits page to view available packages and your current balance.",
      ar: "تحقق من صفحة الرصيد لعرض الباقات المتاحة ورصيدك الحالي."
    }
  },
  {
    id: "referrals",
    icon: Users,
    iconColor: "text-indigo-500",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    title: {
      en: "Invite Friends & Earn",
      ar: "ادعُ أصدقاءك واكسب"
    },
    description: {
      en: "Share your referral code with friends. When they sign up and use the platform, you both benefit from our referral program.",
      ar: "شارك رمز الإحالة الخاص بك مع الأصدقاء. عندما يسجلون ويستخدمون المنصة، ستستفيدون معاً من برنامج الإحالة."
    },
    tip: {
      en: "Find your unique referral code in the Referrals section of the sidebar.",
      ar: "جد رمز الإحالة الفريد الخاص بك في قسم الإحالات في الشريط الجانبي."
    }
  },
  {
    id: "share",
    icon: Share2,
    iconColor: "text-pink-500",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
    title: {
      en: "Share Your Reports",
      ar: "شارك تقاريرك"
    },
    description: {
      en: "Share your analysis reports with partners, investors, or team members using secure shareable links.",
      ar: "شارك تقارير التحليل مع الشركاء أو المستثمرين أو أعضاء الفريق باستخدام روابط مشاركة آمنة."
    },
    tip: {
      en: "Each report has a 'Share' button that generates a unique link for external viewing.",
      ar: "كل تقرير يحتوي على زر 'مشاركة' يولد رابطاً فريداً للعرض الخارجي."
    }
  },
  {
    id: "complete",
    icon: CheckCircle2,
    iconColor: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    title: {
      en: "You're All Set!",
      ar: "أنت جاهز!"
    },
    description: {
      en: "You now know the basics. Start by creating your first business analysis and explore all the features Planlyze has to offer.",
      ar: "أنت الآن تعرف الأساسيات. ابدأ بإنشاء أول تحليل تجاري واستكشف جميع الميزات التي تقدمها Planlyze."
    },
    tip: {
      en: "Need help? Check the sidebar for additional resources or contact support.",
      ar: "تحتاج مساعدة؟ تحقق من الشريط الجانبي للموارد الإضافية أو تواصل مع الدعم."
    }
  }
];

export default function OnboardingGuide({ onComplete, forceShow = false }) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [premiumCost, setPremiumCost] = useState(1);

  useEffect(() => {
    const fetchCost = async () => {
      try {
        const response = await SystemSettings.get('premium_report_cost');
        const cost = parseInt(response?.data?.value || response?.value || '1', 10);
        setPremiumCost(cost >= 1 ? cost : 1);
      } catch (e) {
        console.error("Failed to fetch premium cost:", e);
      }
    };
    fetchCost();
  }, []);

  useEffect(() => {
    if (forceShow) {
      setIsOpen(true);
      setCurrentStep(0);
      return;
    }
    
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setIsOpen(true);
      const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);
      if (savedStep) {
        setCurrentStep(parseInt(savedStep, 10));
      }
    }
  }, [forceShow]);

  useEffect(() => {
    if (isOpen) {
      localStorage.setItem(ONBOARDING_STEP_KEY, currentStep.toString());
    }
  }, [currentStep, isOpen]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setIsOpen(false);
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const Icon = step.icon;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg"
        >
          <Card className="overflow-hidden border-0 shadow-2xl">
            <div className="relative">
              <div className={`h-2 ${step.bgColor}`}>
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-orange-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 z-10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <CardContent className="p-6 pt-8">
              <div className="text-center mb-6">
                <motion.div
                  key={step.id}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${step.bgColor} mb-4`}
                >
                  <Icon className={`w-8 h-8 ${step.iconColor}`} />
                </motion.div>

                <motion.h2
                  key={`title-${step.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold text-slate-800 dark:text-white mb-2"
                >
                  {isArabic ? step.title.ar : step.title.en}
                </motion.h2>

                <motion.p
                  key={`desc-${step.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-slate-600 dark:text-slate-400"
                >
                  {isArabic 
                    ? (typeof step.description.ar === 'function' ? step.description.ar(premiumCost) : step.description.ar) 
                    : (typeof step.description.en === 'function' ? step.description.en(premiumCost) : step.description.en)}
                </motion.p>
              </div>

              <motion.div
                key={`tip-${step.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-6 flex gap-3"
              >
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  {isArabic ? step.tip.ar : step.tip.en}
                </p>
              </motion.div>

              <div className="flex items-center justify-center gap-2 mb-6">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentStep 
                        ? 'w-6 bg-purple-500' 
                        : index < currentStep 
                          ? 'bg-green-500' 
                          : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  {isArabic ? (
                    <>
                      {isArabic ? "السابق" : "Previous"}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-slate-500"
                >
                  {isArabic ? "تخطي" : "Skip Tour"}
                </Button>

                <Button
                  onClick={handleNext}
                  className="gap-2 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      {isArabic ? "ابدأ الآن" : "Get Started"}
                      <Sparkles className="w-4 h-4" />
                    </>
                  ) : isArabic ? (
                    <>
                      <ChevronLeft className="w-4 h-4" />
                      {isArabic ? "التالي" : "Next"}
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-center text-xs text-slate-400 mt-4">
                {isArabic 
                  ? `الخطوة ${currentStep + 1} من ${steps.length}` 
                  : `Step ${currentStep + 1} of ${steps.length}`}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function OnboardingTrigger({ className }) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [showGuide, setShowGuide] = useState(false);

  const handleStartTour = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setShowGuide(true);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleStartTour}
        className={`gap-2 ${className}`}
      >
        <Target className="w-4 h-4" />
        {isArabic ? "جولة تعريفية" : "Take a Tour"}
      </Button>
      
      {showGuide && (
        <OnboardingGuide 
          forceShow={true} 
          onComplete={() => setShowGuide(false)} 
        />
      )}
    </>
  );
}
