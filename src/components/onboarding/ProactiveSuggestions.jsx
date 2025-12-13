import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, X, ArrowRight, Sparkles, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

const suggestions = {
  no_analyses: {
    id: "no_analyses",
    icon: Sparkles,
    title: { en: "Ready to validate your first idea?", ar: "جاهز للتحقق من فكرتك الأولى؟" },
    description: { 
      en: "Start by creating your first business analysis. Get market insights, competitor research, and technical recommendations in minutes.",
      ar: "ابدأ بإنشاء أول تحليل عمل خاص بك. احصل على رؤى السوق وبحث المنافسين والتوصيات التقنية في دقائق."
    },
    action: { en: "Create Analysis", ar: "إنشاء تحليل" },
    actionUrl: "/NewAnalysis",
    priority: 1
  },
  low_credits: {
    id: "low_credits",
    icon: TrendingUp,
    title: { en: "Running low on credits", ar: "رصيدك ينخفض" },
    description: { 
      en: "You have limited credits left. Purchase more to continue creating premium analyses with advanced features.",
      ar: "لديك أرصدة محدودة متبقية. اشترِ المزيد لمواصلة إنشاء تحليلات متميزة بميزات متقدمة."
    },
    action: { en: "Get More Credits", ar: "احصل على المزيد من الأرصدة" },
    actionUrl: "/Credits",
    priority: 2
  },
  completed_analysis: {
    id: "completed_analysis",
    icon: Users,
    title: { en: "Share your insights!", ar: "شارك رؤيتك!" },
    description: { 
      en: "You've completed an analysis! Share it with your team or stakeholders to get feedback and collaborate.",
      ar: "لقد أكملت تحليلاً! شاركه مع فريقك أو أصحاب المصلحة للحصول على ملاحظات والتعاون."
    },
    action: { en: "View Reports", ar: "عرض التقارير" },
    actionUrl: "/Reports",
    priority: 3
  },
  incomplete_profile: {
    id: "incomplete_profile",
    icon: Lightbulb,
    title: { en: "Complete your profile for better insights", ar: "أكمل ملفك الشخصي للحصول على رؤى أفضل" },
    description: { 
      en: "Add your location and contact details to receive personalized market analysis tailored to your region.",
      ar: "أضف موقعك وتفاصيل الاتصال للحصول على تحليل سوق مخصص مصمم خصيصاً لمنطقتك."
    },
    action: { en: "Complete Profile", ar: "إكمال الملف الشخصي" },
    actionUrl: "/Profile",
    priority: 4
  }
};

export default function ProactiveSuggestions({ user, analyses }) {
  const [activeSuggestion, setActiveSuggestion] = useState(null);
  const [dismissed, setDismissed] = useState(new Set());
  const isArabic = user?.preferred_language === 'arabic';

  useEffect(() => {
    if (!user) return;

    // Determine which suggestion to show based on priority
    const userHasNoAnalyses = !analyses || analyses.length === 0;
    const userHasLowCredits = (user.premium_credits || 0) <= 2;
    const userHasCompletedAnalysis = analyses && analyses.some(a => a.status === 'completed');
    const userProfileIncomplete = !user.phone_number || !user.country;

    let suggestionToShow = null;

    if (userHasNoAnalyses && !dismissed.has('no_analyses')) {
      suggestionToShow = suggestions.no_analyses;
    } else if (userHasLowCredits && !dismissed.has('low_credits')) {
      suggestionToShow = suggestions.low_credits;
    } else if (userHasCompletedAnalysis && !dismissed.has('completed_analysis')) {
      suggestionToShow = suggestions.completed_analysis;
    } else if (userProfileIncomplete && !dismissed.has('incomplete_profile')) {
      suggestionToShow = suggestions.incomplete_profile;
    }

    setActiveSuggestion(suggestionToShow);
  }, [user, analyses, dismissed]);

  const handleDismiss = () => {
    if (activeSuggestion) {
      setDismissed(prev => new Set([...prev, activeSuggestion.id]));
      setActiveSuggestion(null);
    }
  };

  if (!activeSuggestion) return null;

  const Icon = activeSuggestion.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-50 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="p-6 relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="absolute top-4 right-4 hover:bg-white/50"
            >
              <X className="w-4 h-4 text-slate-500" />
            </Button>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <Icon className="w-7 h-7 text-white" />
              </div>
              
              <div className="flex-1 space-y-3 pr-8">
                <h3 className="text-xl font-bold text-slate-800">
                  {isArabic ? activeSuggestion.title.ar : activeSuggestion.title.en}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {isArabic ? activeSuggestion.description.ar : activeSuggestion.description.en}
                </p>
                <Link to={createPageUrl(activeSuggestion.actionUrl)}>
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md">
                    {isArabic ? activeSuggestion.action.ar : activeSuggestion.action.en}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}