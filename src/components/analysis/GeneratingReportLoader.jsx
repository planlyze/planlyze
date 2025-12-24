import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  FileSearch, 
  BarChart3, 
  Target, 
  Lightbulb, 
  CheckCircle2,
  Loader2,
  Sparkles,
  TrendingUp,
  Code,
  DollarSign,
  Shield
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const GENERATION_STEPS = [
  { 
    id: 'validating',
    icon: FileSearch,
    en: 'Validating your business idea',
    ar: 'جاري التحقق من فكرة عملك',
    duration: 2000
  },
  { 
    id: 'analyzing',
    icon: Brain,
    en: 'Analyzing market potential',
    ar: 'تحليل إمكانات السوق',
    duration: 3000
  },
  { 
    id: 'competitors',
    icon: Target,
    en: 'Researching competitors',
    ar: 'البحث عن المنافسين',
    duration: 2500
  },
  { 
    id: 'business_model',
    icon: TrendingUp,
    en: 'Crafting business model',
    ar: 'صياغة نموذج العمل',
    duration: 2500
  },
  { 
    id: 'technical',
    icon: Code,
    en: 'Planning technical strategy',
    ar: 'تخطيط الاستراتيجية التقنية',
    duration: 2000
  },
  { 
    id: 'financial',
    icon: DollarSign,
    en: 'Calculating financial projections',
    ar: 'حساب التوقعات المالية',
    duration: 2500
  },
  { 
    id: 'risks',
    icon: Shield,
    en: 'Assessing risks and opportunities',
    ar: 'تقييم المخاطر والفرص',
    duration: 2000
  },
  { 
    id: 'finalizing',
    icon: Sparkles,
    en: 'Finalizing your report',
    ar: 'إنهاء تقريرك',
    duration: 2000
  }
];

const AI_TIPS = {
  en: [
    "AI is analyzing your idea against market trends...",
    "Identifying key success factors for your industry...",
    "Evaluating competitive landscape...",
    "Assessing technical feasibility...",
    "Calculating potential ROI...",
    "Preparing actionable recommendations..."
  ],
  ar: [
    "الذكاء الاصطناعي يحلل فكرتك مقارنة باتجاهات السوق...",
    "تحديد عوامل النجاح الرئيسية لصناعتك...",
    "تقييم المشهد التنافسي...",
    "تقييم الجدوى التقنية...",
    "حساب العائد المحتمل على الاستثمار...",
    "إعداد التوصيات القابلة للتنفيذ..."
  ]
};

export default function GeneratingReportLoader({ isArabic = false, onComplete }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [currentTip, setCurrentTip] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % AI_TIPS.en.length);
    }, 4000);

    return () => clearInterval(tipInterval);
  }, []);

  useEffect(() => {
    if (currentStepIndex >= GENERATION_STEPS.length) {
      onComplete?.();
      return;
    }

    const stepDuration = GENERATION_STEPS[currentStepIndex].duration;
    const progressIncrement = (100 / GENERATION_STEPS.length);
    const startProgress = currentStepIndex * progressIncrement;
    const endProgress = (currentStepIndex + 1) * progressIncrement;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 0.5;
        return next >= endProgress ? endProgress : next;
      });
    }, stepDuration / ((endProgress - startProgress) * 2));

    const stepTimer = setTimeout(() => {
      setCompletedSteps(prev => [...prev, GENERATION_STEPS[currentStepIndex].id]);
      setProgress(endProgress);
      setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, 300);
    }, stepDuration);

    return () => {
      clearTimeout(stepTimer);
      clearInterval(progressInterval);
    };
  }, [currentStepIndex, onComplete]);

  const tips = isArabic ? AI_TIPS.ar : AI_TIPS.en;

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-8" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-orange-500 p-1">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <Brain className="w-10 h-10 text-purple-600" />
              </div>
            </div>
          </motion.div>
          
          <h2 className="text-2xl font-bold text-slate-800">
            {isArabic ? 'جاري إنشاء تقريرك' : 'Generating Your Report'}
          </h2>
          
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTip}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-slate-500 text-sm h-6"
            >
              {tips[currentTip]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>{isArabic ? 'التقدم' : 'Progress'}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="space-y-3">
          {GENERATION_STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-emerald-50 border border-emerald-200' 
                    : isCurrent 
                      ? 'bg-purple-50 border border-purple-200' 
                      : 'bg-slate-50 border border-slate-100'
                }`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted 
                    ? 'bg-emerald-500 text-white' 
                    : isCurrent 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-slate-200 text-slate-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isCurrent ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                
                <div className="flex-1">
                  <p className={`font-medium ${
                    isCompleted 
                      ? 'text-emerald-700' 
                      : isCurrent 
                        ? 'text-purple-700' 
                        : 'text-slate-400'
                  }`}>
                    {isArabic ? step.ar : step.en}
                  </p>
                </div>

                {isCompleted && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-xs text-emerald-600 font-medium"
                  >
                    {isArabic ? '✓ مكتمل' : '✓ Done'}
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-400">
            {isArabic 
              ? 'يرجى عدم إغلاق هذه الصفحة أثناء إنشاء التقرير'
              : 'Please do not close this page while the report is being generated'}
          </p>
        </div>
      </div>
    </div>
  );
}
