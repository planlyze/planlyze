import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const tourSteps = [
  {
    id: "credits-widget",
    selector: '[data-tour="credits-widget"]',
    title: { en: "Your Credit Balance", ar: "رصيد أرصدتك" },
    content: { 
      en: "This shows your available premium credits. Each credit unlocks one comprehensive analysis with advanced features.",
      ar: "يعرض هذا رصيد أرصدتك المتميزة المتاحة. كل رصيد يفتح تحليلاً شاملاً واحداً مع ميزات متقدمة."
    },
    position: "bottom"
  },
  {
    id: "new-analysis-button",
    selector: '[data-tour="new-analysis"]',
    title: { en: "Start Your Analysis", ar: "ابدأ تحليلك" },
    content: { 
      en: "Click here to create a new business analysis. Describe your idea and get instant insights!",
      ar: "انقر هنا لإنشاء تحليل عمل جديد. صف فكرتك واحصل على رؤى فورية!"
    },
    position: "bottom"
  },
  {
    id: "reports-section",
    selector: '[data-tour="reports"]',
    title: { en: "Your Reports", ar: "تقاريرك" },
    content: { 
      en: "View all your completed analyses here. Compare different ideas and track your progress.",
      ar: "اعرض جميع تحليلاتك المكتملة هنا. قارن الأفكار المختلفة وتتبع تقدمك."
    },
    position: "top"
  },
  {
    id: "activity-feed",
    selector: '[data-tour="activity"]',
    title: { en: "Activity Feed", ar: "تغذية النشاط" },
    content: { 
      en: "Stay updated with your recent activities and important notifications here.",
      ar: "ابق على اطلاع بأنشطتك الأخيرة والإشعارات المهمة هنا."
    },
    position: "top"
  }
];

export default function GuidedTour({ user, onComplete }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourPosition, setTourPosition] = useState({ top: 0, left: 0 });
  const isArabic = user?.preferred_language === 'arabic';

  useEffect(() => {
    if (user && user.onboarding_completed && !user.guided_tour_completed) {
      setTimeout(() => setIsActive(true), 1000);
    }
  }, [user]);

  useEffect(() => {
    if (isActive && tourSteps[currentStep]) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [isActive, currentStep]);

  const updatePosition = () => {
    const step = tourSteps[currentStep];
    const element = document.querySelector(step.selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      const position = step.position;
      
      let top, left;
      if (position === "bottom") {
        top = rect.bottom + 20;
        left = rect.left + rect.width / 2;
      } else if (position === "top") {
        top = rect.top - 180;
        left = rect.left + rect.width / 2;
      } else if (position === "right") {
        top = rect.top + rect.height / 2;
        left = rect.right + 20;
      } else {
        top = rect.top + rect.height / 2;
        left = rect.left - 320;
      }
      
      setTourPosition({ top, left });
      
      // Highlight element
      element.style.position = 'relative';
      element.style.zIndex = '1001';
      element.classList.add('tour-highlight');
    }
  };

  const handleNext = async () => {
    // Remove highlight from current element
    const currentElement = document.querySelector(tourSteps[currentStep].selector);
    if (currentElement) {
      currentElement.style.zIndex = '';
      currentElement.classList.remove('tour-highlight');
    }

    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    await base44.auth.updateMe({ guided_tour_completed: true });
    setIsActive(false);
    if (onComplete) onComplete();
  };

  const handleSkip = async () => {
    const currentElement = document.querySelector(tourSteps[currentStep].selector);
    if (currentElement) {
      currentElement.style.zIndex = '';
      currentElement.classList.remove('tour-highlight');
    }
    await handleComplete();
  };

  if (!isActive || !tourSteps[currentStep]) return null;

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-1000"
        style={{ zIndex: 1000 }}
        onClick={handleSkip}
      />

      {/* Tour Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed z-[1002] bg-white rounded-xl shadow-2xl p-6 w-80"
          style={{
            top: `${tourPosition.top}px`,
            left: `${tourPosition.left}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            className="absolute top-2 right-2 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">
                {isArabic ? step.title.ar : step.title.en}
              </h3>
            </div>

            <p className="text-slate-600 leading-relaxed">
              {isArabic ? step.content.ar : step.content.en}
            </p>

            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-slate-500">
                {currentStep + 1}/{tourSteps.length}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  {isArabic ? "تخطي" : "Skip"}
                </Button>
                <Button size="sm" onClick={handleNext} className="bg-purple-600 hover:bg-purple-700">
                  {currentStep === tourSteps.length - 1 ? (
                    isArabic ? "إنهاء" : "Finish"
                  ) : (
                    <>
                      {isArabic ? "التالي" : "Next"}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <style>{`
        .tour-highlight {
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.5), 0 0 0 8px rgba(124, 58, 237, 0.2);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
      `}</style>
    </>
  );
}