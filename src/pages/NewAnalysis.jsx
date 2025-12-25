import React, { useState } from "react";
import { auth, api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Sparkles, Coins, Lightbulb, Shield, Zap, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { emitCreditUpdate } from "@/lib/creditEvents";
import { motion } from "framer-motion";

import AnalysisWizard from "../components/analysis/AnalysisWizard";
import PageLoader from "@/components/common/PageLoader";

export default function NewAnalysis() {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  const isUIArabic = currentUser?.language === 'arabic';

  React.useEffect(() => {
    (async () => {
      try {
        await auth.me();
      } catch {
        window.location.href = "/login";
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  const handleFormSubmit = async (formDataFromWizard) => {
    setIsSubmitting(true);

    try {
      const resp = await api.post('/analyses/generate', formDataFromWizard);
      const createdAnalysis = resp?.data || resp;

      if (!createdAnalysis?.id) {
        throw new Error("Failed to create analysis.");
      }

      await refreshUser();
      emitCreditUpdate();
      
      toast.success(formDataFromWizard.report_language === 'arabic' 
        ? "تم إنشاء التحליل بنجاح!" 
        : "Analysis created successfully!");
      navigate(createPageUrl(`AnalysisResult?id=${createdAnalysis.id}`));

    } catch (error) {
      console.error("Analysis creation failed:", error);
      const errorMsg = error?.response?.data?.error || error.message || "An unexpected error occurred.";
      toast.error(errorMsg);
      setIsSubmitting(false);
    }
  };

  if (!authChecked) {
    return <PageLoader isArabic={isUIArabic} />;
  }

  const features = [
    { 
      icon: TrendingUp, 
      title: isUIArabic ? "تحليل السوق" : "Market Analysis",
      desc: isUIArabic ? "رؤى عميقة للسوق" : "Deep market insights"
    },
    { 
      icon: Shield, 
      title: isUIArabic ? "تحليل المخاطر" : "Risk Analysis",
      desc: isUIArabic ? "تحديد التحديات" : "Identify challenges"
    },
    { 
      icon: Zap, 
      title: isUIArabic ? "خطة العمل" : "Action Plan",
      desc: isUIArabic ? "خطوات واضحة" : "Clear next steps"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900" dir={isUIArabic ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200/30 dark:bg-orange-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(createPageUrl("Dashboard"))}
                className="shadow-md border-2 border-purple-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800 hover:border-purple-300 transition-all bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <ArrowLeft className={`w-4 h-4 text-purple-600 dark:text-purple-400 ${isUIArabic ? 'rotate-180' : ''}`} />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                  {isUIArabic ? "تحليل أعمال جديد" : "New Business Analysis"}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm md:text-base">
                  {isUIArabic ? "احصل على رؤى مدعومة بالذكاء الاصطناعي" : "Get AI-powered insights for your idea"}
                </p>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-orange-100 dark:from-purple-900/50 dark:to-orange-900/50 rounded-full border border-purple-200 dark:border-purple-700"
            >
              <Coins className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {currentUser?.credits || 0} {isUIArabic ? "رصيد" : "credits"}
              </span>
            </motion.div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white pb-8 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">
                        {isUIArabic ? "أخبرنا عن فكرتك" : "Tell Us About Your Idea"}
                      </CardTitle>
                      <p className="text-purple-100 text-sm mt-1">
                        {isUIArabic ? "سنقوم بتحليل شامل لفكرتك" : "We'll provide a comprehensive analysis"}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 -mt-4 bg-white dark:bg-gray-800 rounded-t-3xl relative">
                  <AnalysisWizard onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg">
                      {isUIArabic ? "نصيحة" : "Pro Tip"}
                    </h3>
                  </div>
                  <p className="text-orange-100 text-sm leading-relaxed">
                    {isUIArabic 
                      ? "كلما كانت فكرتك أكثر تفصيلاً، كان التحليل أكثر دقة وفائدة. اذكر المشكلة، الحل، والجمهور المستهدف."
                      : "The more detailed your idea, the more accurate and useful the analysis. Mention the problem, solution, and target audience."}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    {isUIArabic ? "ما ستحصل عليه" : "What You'll Get"}
                  </h3>
                  <div className="space-y-3">
                    {features.map((feature, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-purple-50 dark:from-gray-700 dark:to-purple-900/30 border border-slate-100 dark:border-gray-600"
                      >
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                          <feature.icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white text-sm">{feature.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{feature.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {isUIArabic ? "تكلفة التحليل" : "Analysis Cost"}
                      </p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">1 {isUIArabic ? "رصيد" : "Credit"}</p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                      <Coins className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  {currentUser?.credits < 1 && (
                    <Button 
                      onClick={() => navigate(createPageUrl("Credits"))}
                      className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                    >
                      {isUIArabic ? "احصل على رصيد" : "Get Credits"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
