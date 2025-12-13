import React, { useState } from "react";
import { Analysis, Transaction, User, auth, api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";

import AnalysisWizard from "../components/analysis/AnalysisWizard";
import ProcessingStep from "../components/analysis/ProcessingStep";
import { runChainedPrompts } from "@/components/analysis/useChainedPrompts";
import { getCompetitorFileUrl } from "@/components/utils/competitorFiles";

// START chained prompts integration helper
async function startChainedGeneration({
  analysisId,
  businessIdea,
  industry,
  targetHint,
  language,
  country,
  setProgress,
  competitorFileUrl,
  chatContext = "",
}) {
  try {
    const result = await runChainedPrompts({
      analysisId,
      businessIdea: chatContext 
        ? `${businessIdea}\n\n--- User Feedback from Chat ---\n${chatContext}`
        : businessIdea,
      industry,
      targetHint,
      language,
      country,
      competitorFileUrl,
      addContextFromInternet: false,
      onProgress: (percent) => {
        if (typeof setProgress === "function") setProgress(percent);
      },
    });
    return result;
  } catch (error) {
    console.error("Error during chained prompt generation:", error);
    return { status: "failed", error: error.message };
  }
}
// END chained prompts integration helper

export default function NewAnalysis() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState("form");
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisId, setAnalysisId] = useState(null); // NEW: track created analysis ID
  const [pendingTransactionId, setPendingTransactionId] = useState(null); // Track pending transaction

  // Add local progress state to track the generation percentage
  const [progress, setProgress] = useState(0);
  const [lastError, setLastError] = useState(""); // NEW: show backend error details

  // NEW: ensure user is authenticated before using entities/functions
  const [authChecked, setAuthChecked] = useState(false);
  const [regenerateMode, setRegenerateMode] = useState(false);
  const [chatContext, setChatContext] = useState("");

  React.useEffect(() => {
    (async () => {
      try {
        await User.me();
        
        // Check for regeneration mode
        const urlParams = new URLSearchParams(window.location.search);
        const regenerateId = urlParams.get('regenerate');
        const contextParam = urlParams.get('context');
        
        if (regenerateId && contextParam) {
          setRegenerateMode(true);
          setChatContext(decodeURIComponent(contextParam));
          
          // Load existing analysis and start regeneration
          const existingAnalysis = await Analysis.filter({ id: regenerateId });
          if (existingAnalysis.length > 0) {
            const analysis = existingAnalysis[0];
            setAnalysisId(analysis.id);
            setAnalysisData({
              business_idea: analysis.business_idea,
              industry: analysis.industry,
              report_language: analysis.report_language,
              country: analysis.country,
              experience_level: analysis.experience_level,
              target_hint: "",
              chat_context: decodeURIComponent(contextParam)
            });
          }
        }
      } catch {
        await User.loginWithRedirect(window.location.href);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  const handleFormSubmit = async (formDataFromWizard) => {
    const combinedFormData = { ...formDataFromWizard };
    setAnalysisData(combinedFormData);
    setCurrentStep("processing");
    setProgress(0);
    setLastError("");

    try {
      // Check if user has premium credits - automatically use for premium generation
      const user = await User.me();
      const currentCredits = user.premium_credits || 0;
      const hasPremiumCredits = currentCredits > 0;
      
      // Deduct credit upfront and create pending transaction to prevent race conditions (only if has credits)
      let transactionId = null;
      if (hasPremiumCredits) {
        await User.updateMyUserData({
          premium_credits: currentCredits - 1,
          total_credits_used: (user.total_credits_used || 0) + 1
        });
        
        const tx = await Transaction.create({
          user_email: user.email,
          type: 'usage',
          credits: -1,
          status: 'pending',
          notes: 'Premium credit reserved for analysis report'
        });
        transactionId = tx.id;
        setPendingTransactionId(transactionId);
      }
      
      // Try via API first
      let createdAnalysis;
      try {
        const resp = await api.post('/api/analyses/generate', combinedFormData);
        createdAnalysis = resp?.data;
      } catch (err) {
        const msg = String(err?.message || err || "");
        const status = err?.response?.status;
        const isRetryable =
          (typeof status === "number" && status >= 500) ||
          /network|timeout|502|bad gateway|failed to fetch/i.test(msg);

        if (isRetryable) {
          // Fallback path on network/5xx errors: create via entity SDK directly
          const {
            business_idea,
            experience_level,
            report_language,
            country,
            industry,
            custom_industry
          } = combinedFormData;
          createdAnalysis = await Analysis.create({
            business_idea: String(business_idea || "").trim(),
            experience_level: (experience_level || "beginner").toLowerCase(),
            report_language: (report_language || "english").toLowerCase(),
            country: country || "Syria",
            industry: industry || "Other",
            custom_industry: industry === "Other" ? (custom_industry || null) : null,
            status: "analyzing",
            report_generated: false,
            progress_percent: 10,
            last_error: null,
            is_premium: hasPremiumCredits
          });
        } else {
          // Non-retryable (e.g., validation errors) -> propagate
          throw err;
        }
      }

      // Ensure we have an analysis record
      if (!createdAnalysis?.id) {
        throw new Error("Failed to create analysis.");
      }
      setAnalysisId(createdAnalysis.id);
      
      // Link transaction to analysis
      if (transactionId) {
        try {
          await Transaction.update(transactionId, { analysis_id: createdAnalysis.id });
        } catch (e) {
          console.error("Failed to link transaction to analysis:", e);
        }
      }

      // 2. Start the chained prompt generation process.
      // This client-side driven process will continuously update the analysis record
      // identified by 'createdAnalysis.id' in the database.
      // Map target hint robustly (accept either target_hint or target_market)

      const { business_idea, industry, report_language, country } = combinedFormData;
      const targetHint = combinedFormData.target_hint || combinedFormData.target_market || "";

      // Use helper to pick the correct competitor file URL based on industry
      const competitorFileUrlToUse = getCompetitorFileUrl(industry);

      const result = await startChainedGeneration({
        analysisId: createdAnalysis.id,
        businessIdea: business_idea,
        industry,
        targetHint,
        language: report_language,
        country: country, // now coming from wizard step 1
        setProgress, // Pass the state setter to receive progress updates
        competitorFileUrl: competitorFileUrlToUse, // pass industry-specific file
        chatContext: combinedFormData.chat_context || ""
      });

      // Handle outcomes explicitly to avoid "stuck" UI
      if (result?.status === "completed") {
        // Update pending transaction to completed
        if (transactionId) {
          try {
            await Transaction.update(transactionId, {
              status: 'completed',
              notes: 'Premium credit used for completed analysis report'
            });
          } catch (e) {
            console.error("Failed to update transaction status:", e);
          }
        }
        
        toast.success("Analysis completed successfully! 🎉");
        setCurrentStep("completed");
        navigate(createPageUrl(`AnalysisResult?id=${createdAnalysis.id}`));
        return;
      }

      if (result?.status === "failed") {
        // Refund credit on failure
        if (transactionId) {
          try {
            const currentUser = await User.me();
            await User.updateMyUserData({
              premium_credits: (currentUser.premium_credits || 0) + 1,
              total_credits_used: Math.max(0, (currentUser.total_credits_used || 0) - 1)
            });
            
            await Transaction.update(transactionId, {
              status: 'refunded',
              notes: 'Credit refunded - analysis failed'
            });
          } catch (e) {
            console.error("Failed to refund credit:", e);
          }
        }
        
        const errFromResult = result?.analysis?.last_error || "";
        setLastError(errFromResult);
        toast.error("Analysis failed. Please try again.");
        setCurrentStep("error");
        return;
      }

      // Fallback: if unknown status, assume completed and navigate.
      // Update pending transaction to completed
      if (transactionId) {
        try {
          await Transaction.update(transactionId, {
            status: 'completed',
            notes: 'Premium credit used for completed analysis report'
          });
        } catch (e) {
          console.error("Failed to update transaction status:", e);
        }
      }
      
      toast.success("Analysis completed successfully! 🎉");
      setCurrentStep("completed");
      navigate(createPageUrl(`AnalysisResult?id=${createdAnalysis.id}`));

    } catch (error) {
      console.error("Analysis failed:", error);
      
      // Refund credit on error
      if (pendingTransactionId) {
        try {
          const currentUser = await User.me();
          await User.updateMyUserData({
            premium_credits: (currentUser.premium_credits || 0) + 1,
            total_credits_used: Math.max(0, (currentUser.total_credits_used || 0) - 1)
          });
          
          await Transaction.update(pendingTransactionId, {
            status: 'refunded',
            notes: 'Credit refunded - analysis failed with error'
          });
        } catch (e) {
          console.error("Failed to refund credit:", e);
        }
      }
      
      const errorMsg = error?.response?.data?.error || error.message || "An unexpected network error occurred. Please try again.";
      setLastError(errorMsg);
      toast.error("Analysis failed: " + errorMsg);
      setCurrentStep("error");
    }
  };

  // NEW: Retry generation without re-filling the form
  const handleRetry = async () => {
    if (!analysisId || !analysisData) {
      setCurrentStep("form");
      return;
    }
    
    // Check credits and deduct upfront for retry (only if has credits)
    const user = await User.me();
    const currentCredits = user.premium_credits || 0;
    const hasCreditsForRetry = currentCredits > 0;
    let retryTransactionId = null;
    
    if (hasCreditsForRetry) {
      await User.updateMyUserData({
        premium_credits: currentCredits - 1,
        total_credits_used: (user.total_credits_used || 0) + 1
      });
      
      const tx = await Transaction.create({
        user_email: user.email,
        type: 'usage',
        credits: -1,
        analysis_id: analysisId,
        status: 'pending',
        notes: 'Premium credit reserved for analysis retry'
      });
      retryTransactionId = tx.id;
    } else {
      // Update analysis to free if no credits
      await Analysis.update(analysisId, { is_premium: false });
    }
    
    setCurrentStep("processing");
    setProgress(0);
    setLastError("");
    
    const { business_idea, industry, report_language, country } = analysisData;
    const targetHint = analysisData.target_hint || analysisData.target_market || "";
    const competitorFileUrlToUse = getCompetitorFileUrl(industry);

    try {
      const result = await startChainedGeneration({
        analysisId,
        businessIdea: business_idea,
        industry,
        targetHint,
        language: report_language,
        country,
        setProgress,
        competitorFileUrl: competitorFileUrlToUse,
        chatContext: analysisData.chat_context || ""
      });

      if (result?.status === "completed") {
        if (retryTransactionId) {
          await Transaction.update(retryTransactionId, {
            status: 'completed',
            notes: 'Premium credit used for completed analysis report (retry)'
          });
        }
        
        toast.success("Analysis completed successfully! 🎉");
        setCurrentStep("completed");
        navigate(createPageUrl(`AnalysisResult?id=${analysisId}`));
        return;
      }
      
      if (result?.status === "failed") {
        if (retryTransactionId) {
          const currentUser = await User.me();
          await User.updateMyUserData({
            premium_credits: (currentUser.premium_credits || 0) + 1,
            total_credits_used: Math.max(0, (currentUser.total_credits_used || 0) - 1)
          });
          
          await Transaction.update(retryTransactionId, {
            status: 'refunded',
            notes: 'Credit refunded - analysis retry failed'
          });
        }
        
        const errorMsg = result?.analysis?.last_error || "Analysis failed again. Please try adjusting inputs and try once more.";
        setLastError(errorMsg);
        toast.error("Analysis failed: " + errorMsg);
        setCurrentStep("error");
        return;
      }
      
      // Fallback - mark as completed
      if (retryTransactionId) {
        await Transaction.update(retryTransactionId, {
          status: 'completed',
          notes: 'Premium credit used for completed analysis report (retry fallback)'
        });
      }
      
      toast.success("Analysis completed successfully! 🎉");
      setCurrentStep("completed");
      navigate(createPageUrl(`AnalysisResult?id=${analysisId}`));
    } catch (error) {
      if (retryTransactionId) {
        const currentUser = await User.me();
        await User.updateMyUserData({
          premium_credits: (currentUser.premium_credits || 0) + 1,
          total_credits_used: Math.max(0, (currentUser.total_credits_used || 0) - 1)
        });
        
        await Transaction.update(retryTransactionId, {
          status: 'refunded',
          notes: 'Credit refunded - analysis retry error'
        });
      }
      
      const errorMsg = error?.message || "Retry failed";
      setLastError(errorMsg);
      toast.error("Analysis failed: " + errorMsg);
      setCurrentStep("error");
    }
  };

  // Get user language preference
  const [currentUser, setCurrentUser] = React.useState(null);
  React.useEffect(() => {
    (async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch {}
    })();
  }, []);

  // NEW: block rendering until auth check completes
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-slate-50">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isArabic = currentUser?.preferred_language === 'arabic';

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
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

        {/* Main Content */}
        <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
          <CardHeader className="text-center border-b border-slate-100 pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-purple-100 rounded-2xl border-2 border-purple-200">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">
                    {currentStep === "form" && (regenerateMode 
                      ? (isArabic ? "إعادة إنشاء التقرير" : "Regenerating Report") 
                      : (isArabic ? "أخبرنا عن فكرتك" : "Tell Us About Your Idea"))}
                    {currentStep === "processing" && (regenerateMode 
                      ? (isArabic ? "جارٍ إعادة إنشاء تقريرك" : "Regenerating Your Report") 
                      : (isArabic ? "جارٍ تحليل فكرة عملك" : "Analyzing Your Business Idea"))}
                    {currentStep === "completed" && (isArabic ? "اكتمل التحليل!" : "Analysis Complete!")}
                    {currentStep === "error" && (isArabic ? "فشل التحليل" : "Analysis Failed")}
                  </CardTitle>
            {currentStep === "processing" &&
              <p className="text-slate-600 mt-2">
                {regenerateMode 
                  ? (isArabic ? "يقوم Planlyze AI بإعادة إنشاء تقريرك بناءً على ملاحظاتك..." : "Planlyze AI is regenerating your report based on your feedback...") 
                  : (isArabic ? "يقوم Planlyze AI بتحليل فكرة عملك..." : "Planlyze AI is analyzing your business idea...")}
              </p>
              }
          </CardHeader>
          <CardContent className="pt-6">
            {currentStep === "form" && !regenerateMode && (
              <AnalysisWizard onSubmit={handleFormSubmit} />
            )}
            {currentStep === "form" && regenerateMode && analysisData && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-amber-200">
                    <Sparkles className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{isArabic ? "جاهز لإعادة الإنشاء" : "Ready to Regenerate"}</h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    {isArabic ? "سيتم إعادة إنشاء تقريرك بدمج ملاحظاتك من محادثة الذكاء الاصطناعي." : "Your report will be regenerated incorporating your feedback from the AI chat."}
                  </p>
                  <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-lg mx-auto ${isArabic ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm font-medium text-amber-800 mb-2">{isArabic ? "ملاحظاتك:" : "Your feedback:"}</p>
                    <p className="text-sm text-slate-600 line-clamp-4">{chatContext}</p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <Button 
                      onClick={() => handleFormSubmit(analysisData)} 
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6"
                    >
                      {isArabic ? "بدء إعادة الإنشاء" : "Start Regeneration"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(createPageUrl(`AnalysisResult?id=${analysisId}`))} 
                      className="border-2 border-slate-300 hover:bg-slate-50"
                    >
                      {isArabic ? "إلغاء" : "Cancel"}
                    </Button>
                  </div>
                </div>
              )}
            {currentStep === "processing" && (
              <ProcessingStep progress={progress} />
            )}
            {currentStep === "completed" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-200">
                  <Sparkles className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{isArabic ? "اكتمل التحليل!" : "Analysis Complete!"}</h3>
                  <p className="text-slate-600">{isArabic ? "جارٍ التحويل إلى تقريرك المفصل..." : "Redirecting to your detailed report..."}</p>
                </div>
              )}
            {currentStep === "error" && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-200">
                    <span className="text-2xl">❌</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{isArabic ? "فشل التحليل" : "Analysis Failed"}</h3>
                  {lastError ? (
                    <div className={`max-w-xl mx-auto ${isArabic ? 'text-right' : 'text-left'} bg-red-50 border-2 border-red-200 text-red-700 rounded-xl p-4 text-sm whitespace-pre-wrap`}>
                      {lastError}
                    </div>
                  ) : (
                    <p className="text-slate-600">{isArabic ? "واجهنا خطأ أثناء تحليل فكرتك." : "We encountered an error while analyzing your idea."}</p>
                  )}
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <Button onClick={handleRetry} className="bg-purple-600 hover:bg-purple-700 text-white px-6">
                      {isArabic ? "إعادة المحاولة" : "Retry Analysis"}
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentStep("form")} className="border-2 border-slate-300 hover:bg-slate-50">
                      {isArabic ? "تعديل المدخلات" : "Edit Inputs"}
                    </Button>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}