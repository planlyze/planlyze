import React, { useState, useEffect } from "react";
import { auth } from "@/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, X, Sparkles, FileText, Wallet, BarChart3 } from "lucide-react";

const tutorialSteps = [
  {
    id: 1,
    title: { en: "Welcome to Planlyze! 🎉", ar: "مرحباً في Planlyze! 🎉" },
    description: { 
      en: "Let's take a quick interactive tour to help you get started with validating your business ideas and turning them into actionable plans.",
      ar: "دعنا نأخذ جولة تفاعلية سريعة لمساعدتك على البدء في التحقق من أفكار عملك وتحويلها إلى خطط قابلة للتنفيذ."
    },
    icon: Sparkles,
    tip: {
      en: "This tutorial takes only 2 minutes and will help you navigate the platform effectively.",
      ar: "يستغرق هذا البرنامج التعليمي دقيقتين فقط وسيساعدك على التنقل في المنصة بفعالية."
    }
  },
  {
    id: 2,
    title: { en: "Create Your First Analysis", ar: "أنشئ تحليلك الأول" },
    description: { 
      en: "Start by creating a comprehensive business analysis. Simply describe your idea and we'll generate market insights, competitor research, and technical recommendations.",
      ar: "ابدأ بإنشاء تحليل شامل للأعمال. ما عليك سوى وصف فكرتك وسنقوم بإنشاء رؤى السوق وبحث المنافسين والتوصيات التقنية."
    },
    icon: FileText,
    action: { en: "Create Analysis", ar: "إنشاء تحليل" },
    actionUrl: "/NewAnalysis",
    tip: {
      en: "Pro tip: The more detailed your business idea description, the more accurate the analysis will be.",
      ar: "نصيحة احترافية: كلما كان وصف فكرة عملك أكثر تفصيلاً، كلما كان التحليل أكثر دقة."
    }
  },
  {
    id: 3,
    title: { en: "Manage Your Credits", ar: "أدر أرصدتك" },
    description: { 
      en: "Premium credits unlock advanced features like detailed competitor analysis (15+ competitors), AI tool recommendations, and regional market data. Each credit = one premium report.",
      ar: "الأرصدة المتميزة تفتح ميزات متقدمة مثل تحليل المنافسين التفصيلي (15+ منافس)، توصيات أدوات AI، وبيانات السوق الإقليمية. كل رصيد = تقرير متميز واحد."
    },
    icon: Wallet,
    action: { en: "View Credits", ar: "عرض الأرصدة" },
    actionUrl: "/Credits",
    tip: {
      en: "Start with 1 credit to test premium features, then buy bundles for better value.",
      ar: "ابدأ برصيد واحد لاختبار الميزات المتميزة، ثم اشترِ الباقات للحصول على قيمة أفضل."
    }
  },
  {
    id: 4,
    title: { en: "Track Your Progress", ar: "تتبع تقدمك" },
    description: { 
      en: "Your dashboard shows all your analyses, credit balance, and personalized recommendations. Access completed reports, compare multiple ideas, and get AI-powered guidance on next steps.",
      ar: "تعرض لوحة التحكم الخاصة بك جميع تحليلاتك ورصيد الأرصدة والتوصيات المخصصة. الوصول إلى التقارير المكتملة ومقارنة الأفكار المتعددة والحصول على إرشادات مدعومة بالذكاء الاصطناعي حول الخطوات التالية."
    },
    icon: BarChart3,
    tip: {
      en: "Check your dashboard daily for new recommendations based on your analysis results.",
      ar: "تحقق من لوحة التحكم الخاصة بك يومياً للحصول على توصيات جديدة بناءً على نتائج تحليلك."
    }
  }
];

export default function OnboardingTutorial({ user, onComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const isArabic = user?.preferred_language === 'arabic';

  useEffect(() => {
    if (user && !user.onboarding_completed) {
      setIsOpen(true);
      setCurrentStep(user.onboarding_step || 0);
    } else {
      setIsOpen(false);
    }
  }, [user]);

  const handleNext = async () => {
    if (currentStep < tutorialSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      try {
        await auth.updateProfile({ onboarding_step: nextStep });
      } catch (err) {
        console.error('Error updating onboarding step:', err);
      }
    } else {
      await handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await auth.updateProfile({ 
        onboarding_completed: true,
        onboarding_step: tutorialSteps.length 
      });
    } catch (err) {
      console.error('Error completing onboarding:', err);
    }
    setIsOpen(false);
    if (onComplete) onComplete();
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  const handleDialogChange = async (open) => {
    if (!open) {
      await handleComplete();
    }
  };

  if (!user || !isOpen) return null;

  const step = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">
              {isArabic ? step.title.ar : step.title.en}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleSkip} className="hover:bg-slate-100">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center shadow-lg">
              <step.icon className="w-12 h-12 text-purple-600" />
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-lg text-slate-700 leading-relaxed px-4">
              {isArabic ? step.description.ar : step.description.en}
            </p>
            {step.tip && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 mx-4">
                <p className="text-sm text-purple-800 font-medium">
                  💡 {isArabic ? step.tip.ar : step.tip.en}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2 px-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>{isArabic ? `الخطوة ${currentStep + 1} من ${tutorialSteps.length}` : `Step ${currentStep + 1} of ${tutorialSteps.length}`}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3 bg-slate-200" />
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <Button variant="ghost" onClick={handleSkip} className="text-slate-500">
            {isArabic ? "تخطي" : "Skip"}
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {isArabic ? "السابق" : "Previous"}
              </Button>
            )}
            <Button onClick={handleNext} className="bg-purple-600 hover:bg-purple-700 text-white">
              {currentStep === tutorialSteps.length - 1 ? (
                isArabic ? "إنهاء" : "Finish"
              ) : (
                <>
                  {isArabic ? "التالي" : "Next"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}