import React, { useState } from "react";
import { auth, api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

import AnalysisWizard from "../components/analysis/AnalysisWizard";
import GeneratingReportLoader from "../components/analysis/GeneratingReportLoader";

export default function NewAnalysis() {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [pendingAnalysisId, setPendingAnalysisId] = useState(null);
  const [reportLanguage, setReportLanguage] = useState('english');

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
    setReportLanguage(formDataFromWizard.report_language);

    try {
      const resp = await api.post('/analyses/generate', formDataFromWizard);
      const createdAnalysis = resp?.data || resp;

      if (!createdAnalysis?.id) {
        throw new Error("Failed to create analysis.");
      }

      await refreshUser();
      setPendingAnalysisId(createdAnalysis.id);

    } catch (error) {
      console.error("Analysis creation failed:", error);
      const errorMsg = error?.response?.data?.error || error.message || "An unexpected error occurred.";
      toast.error(errorMsg);
      setIsSubmitting(false);
    }
  };

  const handleLoaderComplete = () => {
    if (pendingAnalysisId) {
      toast.success(reportLanguage === 'arabic' 
        ? "تم إنشاء التحليل بنجاح!" 
        : "Analysis created successfully!");
      navigate(createPageUrl(`AnalysisResult?id=${pendingAnalysisId}`));
    }
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-slate-50">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isArabic = currentUser?.language === 'arabic' || reportLanguage === 'arabic';

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-slate-200 shadow-lg bg-white">
            <GeneratingReportLoader 
              isArabic={reportLanguage === 'arabic'} 
              onComplete={handleLoaderComplete}
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="shadow-sm border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all">
            <ArrowLeft className="w-4 h-4 text-purple-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-orange-600">
              {isArabic ? "تحليل أعمال تقني جديد" : "New Tech Business Analysis"}
            </h1>
            <p className="text-slate-600 mt-1">{isArabic ? "احصل على رؤى Planlyze المدعومة بالذكاء الاصطناعي لفكرة منتجك البرمجي" : "Get Planlyze AI-powered insights for your software product idea"}</p>
          </div>
        </div>

        <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
          <CardHeader className="text-center border-b border-slate-100 pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-purple-100 rounded-2xl border-2 border-purple-200">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">
              {isArabic ? "أخبرنا عن فكرتك" : "Tell Us About Your Idea"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <AnalysisWizard onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
