import React, { useState, useEffect, useCallback } from "react";
import { Analysis, User, auth, api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  Globe,
  Printer,
  FileText,
  MapPin,
  Download,
  FileSpreadsheet,
  Share2,
  Target,
  Clock,
  Users,
  DollarSign,
  Sparkles,
  TrendingUp,
  Briefcase,
  Code,
  Calculator,
  Shield,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "@/components/common/StarRating";
import { toast } from "sonner";
import FloatingAIAssistant from "../components/results/FloatingAIAssistant";

import ExecutiveSummary from "../components/results/ExecutiveSummary";
import ProblemSolutionFramework from "../components/results/ProblemSolutionFramework";
import MarketOpportunity from "../components/results/MarketOpportunity";
import TargetAudience from "../components/results/TargetAudience";
import BusinessModelRevenue from "../components/results/BusinessModelRevenue";
import GoToMarket from "../components/results/GoToMarket";
import TechnicalImplementation from "../components/results/TechnicalImplementation";
import DevelopmentPlan from "../components/results/DevelopmentPlan";
import FinancialProjections from "../components/results/FinancialProjections";
import RiskMitigation from "../components/results/RiskMitigation";
import SwotSimple from "../components/results/SwotSimple";
import SuccessMetricsValidation from "../components/results/SuccessMetricsValidation";
import FundingRecommendations from "../components/results/FundingRecommendations";
import Partnerships from "../components/results/Partnerships";
import RecommendationsNext from "../components/results/RecommendationsNext";
import ReportFooter from "../components/results/ReportFooter";
import TechStackSuggestions from "../components/results/TechStackSuggestions";
import AIToolsSuggestions from "../components/results/AIToolsSuggestions";
import CompetitorMatrix from "../components/results/CompetitorMatrix";
import SyrianCompetitors from "../components/results/SyrianCompetitors";
import MarketSection from "../components/results/MarketSection";
import BusinessSection from "../components/results/BusinessSection";
import TechnicalSection from "../components/results/TechnicalSection";
import FinancialSection from "../components/results/FinancialSection";
import StrategySection from "../components/results/StrategySection";
import UpgradePrompt from "../components/credits/UpgradePrompt";
import ShareReportModal from "../components/sharing/ShareReportModal";
import { canAccessAdmin } from "@/components/utils/permissions";

const TabLoadingSpinner = ({ isArabic, message }) => (
  <div className="flex flex-col items-center justify-center py-16 space-y-4">
    <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
    <p className="text-slate-600 text-sm">{message || (isArabic ? "جارٍ تحميل البيانات..." : "Loading data...")}</p>
    <p className="text-slate-400 text-xs">{isArabic ? "يتم توليد المحتوى بالذكاء الاصطناعي" : "AI is generating your content..."}</p>
  </div>
);

const LazyTabContent = ({ isLoaded, isLoading, isArabic, hasError, onRetry, children }) => {
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-slate-700 font-medium">{isArabic ? "حدث خطأ أثناء تحميل المحتوى" : "Error loading content"}</p>
        <p className="text-slate-500 text-sm">{isArabic ? "انقر على الزر أدناه للمحاولة مرة أخرى" : "Click the button below to try again"}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {isArabic ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    );
  }
  if (isLoading || !isLoaded) {
    return <TabLoadingSpinner isArabic={isArabic} />;
  }
  return <>{children}</>;
};

export default function AnalysisResult() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [rating, setRating] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [savingRating, setSavingRating] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [loadedTabs, setLoadedTabs] = useState({});
  const [tabData, setTabData] = useState({});
  const [tabLoading, setTabLoading] = useState({});
  const [tabError, setTabError] = useState({});
  
  const loadTabContent = useCallback(async (tabName) => {
    if (tabData[tabName] || tabLoading[tabName] || tabError[tabName] || !analysis) return;
    
    const cachedData = analysis[`tab_${tabName}`];
    if (cachedData) {
      setTabData(prev => ({ ...prev, [tabName]: cachedData }));
      setLoadedTabs(prev => ({ ...prev, [tabName]: true }));
      return;
    }
    
    setTabLoading(prev => ({ ...prev, [tabName]: true }));
    const isAr = analysis?.report_language === 'arabic';
    const lang = analysis?.report_language === 'arabic' ? 'ar' : 'en';
    
    try {
      const response = await api.post('/ai/generate-tab-content', {
        analysis_id: analysis.id,
        tab_name: tabName,
        language: lang
      });
      
      if (response.data) {
        setTabData(prev => ({ ...prev, [tabName]: response.data }));
        setLoadedTabs(prev => ({ ...prev, [tabName]: true }));
      }
    } catch (error) {
      console.error(`Error loading ${tabName} tab:`, error);
      toast.error(isAr ? "خطأ في تحميل المحتوى. انقر للمحاولة مرة أخرى." : "Error loading content. Click to retry.");
      setTabError(prev => ({ ...prev, [tabName]: true }));
    } finally {
      setTabLoading(prev => ({ ...prev, [tabName]: false }));
    }
  }, [analysis, tabData, tabLoading, tabError]);

  const retryTab = useCallback((tabName) => {
    setTabError(prev => ({ ...prev, [tabName]: false }));
    setTimeout(() => loadTabContent(tabName), 100);
  }, [loadTabContent]);

  useEffect(() => {
    if (activeTab && analysis && !loadedTabs[activeTab] && !tabError[activeTab]) {
      loadTabContent(activeTab);
    }
  }, [activeTab, analysis, loadedTabs, tabError, loadTabContent]);

  // Smooth scroll for quick navigation - REMOVED as quick nav is removed
  // const scrollTo = (id) => {
  //   const el = document.getElementById(id);
  //   if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  // };

  const loadAnalysis = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const userEmailParam = urlParams.get('user'); // NEW: preserve selected user context for admins

    if (!id) {
      navigate(createPageUrl("Dashboard"));
      return;
    }

    setIsLoading(true);
    setTabData({});
    setTabError({});
    setTabLoading({});
    setLoadedTabs({});
    try {
      const user = await auth.me();
      setCurrentUser(user);
      setUserCredits(user.credits || 0);

      if (canAccessAdmin(user) && userEmailParam) {
        // Admin viewing a specific user's report: use backend to bypass RLS
        const data = await Analysis.get(id);

        if (!data || data.is_deleted === true || data.user_email !== userEmailParam) {
          navigate(createPageUrl(`Reports?user=${encodeURIComponent(userEmailParam)}`));
          return;
        }

        setAnalysis(data);
        setRating(data.user_rating ?? null);
        setFeedback(data.user_feedback ?? "");
        setCanRate(false); // Admins shouldn't rate others' reports
        setLoadedTabs({});
      } else {
        // Owner flow (RLS enforced)
        const filter = { user_email: user.email };
        const userAnalyses = await Analysis.filter(filter);
        const analysisItem = userAnalyses.find((a) => a.id === id);

        if (!analysisItem || analysisItem.is_deleted === true) {
          navigate(createPageUrl("Reports"));
          return;
        }

        setAnalysis(analysisItem);
        setRating(analysisItem.user_rating ?? null);
        setFeedback(analysisItem.user_feedback ?? "");
        setCanRate(analysisItem.user_email === user.email && analysisItem.status === 'completed');
        setLoadedTabs({});
      }
    } catch (error) {
      console.error("Error loading analysis:", error);
      navigate(createPageUrl("Dashboard"));
    }
    setIsLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  // Replace export with browser print
  const handleExport = async () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 50);
  };

  const handleDownloadPdf = async () => {
    if (!analysis) return;
    setIsDownloadingPdf(true);

    const sanitize = (s) => {
      const base = String(s || "Report").trim().replace(/[/\\?%*:|"<>]/g, "_").replace(/\s+/g, "_");
      return base.substring(0, 80);
    };
    const filename = `${sanitize(analysis.business_idea)}_Planlyze.pdf`;

    try {
      const reportData = await api.get("/analyses/export");
      const blob = new Blob([reportData], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(isArabic ? "تم تنزيل PDF" : "PDF downloaded");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error(isArabic ? "فشل تنزيل ملف PDF" : "Failed to download PDF");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (!analysis) return;
    setIsDownloadingCsv(true);

    try {
      const br = analysis.business_report || {};
      const tr = analysis.technical_report || {};
      
      // Build CSV content
      const csvRows = [];
      csvRows.push(['Section', 'Field', 'Value']);
      
      // Business Idea
      csvRows.push(['General', 'Business Idea', analysis.business_idea || '']);
      csvRows.push(['General', 'Country', analysis.country || '']);
      csvRows.push(['General', 'Industry', analysis.industry || '']);
      csvRows.push(['General', 'Experience Level', analysis.experience_level || '']);
      csvRows.push(['General', 'Report Language', analysis.report_language || '']);
      csvRows.push(['General', 'Created Date', analysis.created_at || '']);
      csvRows.push(['General', 'Premium', analysis.is_premium ? 'Yes' : 'No']);
      
      // Scores
      csvRows.push(['Scores', 'Business Viability Score', br.overall_viability_score || '']);
      csvRows.push(['Scores', 'Technical Complexity Score', tr.complexity_score || '']);
      csvRows.push(['Scores', 'AI MVP Build Score', tr.mvp_by_ai_tool_score || '']);
      
      // Problem & Solution
      const psf = br.problem_solution_framework || {};
      csvRows.push(['Problem & Solution', 'Core Problem', psf.core_problem || '']);
      csvRows.push(['Problem & Solution', 'Solution Approach', psf.solution_approach || '']);
      csvRows.push(['Problem & Solution', 'Value Proposition', psf.value_proposition || '']);
      
      // Market Opportunity
      csvRows.push(['Market', 'Market Opportunity', br.market_opportunity || '']);
      csvRows.push(['Market', 'Local Demand Assessment', br.local_demand_assessment || '']);
      csvRows.push(['Market', 'Competition Analysis', br.competition_analysis || '']);
      
      // Market Size
      const ms = br.market_size || {};
      csvRows.push(['Market Size', 'TAM', ms.tam || '']);
      csvRows.push(['Market Size', 'SAM', ms.sam || '']);
      csvRows.push(['Market Size', 'SOM', ms.som || '']);
      
      // Target Audience
      const ta = psf.target_audience || {};
      csvRows.push(['Target Audience', 'Description', ta.target_description || '']);
      if (Array.isArray(ta.demographics)) {
        ta.demographics.forEach((item, idx) => csvRows.push(['Target Audience', `Demographic ${idx + 1}`, item]));
      }
      
      // Revenue Streams
      if (Array.isArray(br.revenue_streams)) {
        br.revenue_streams.forEach((item, idx) => csvRows.push(['Revenue', `Stream ${idx + 1}`, item]));
      }
      
      // Go-to-Market
      csvRows.push(['Go-to-Market', 'Strategy', br.go_to_market || '']);
      
      // Technology Stack
      const ts = tr.technology_stack || {};
      csvRows.push(['Technology', 'Frontend', ts.frontend || '']);
      csvRows.push(['Technology', 'Backend', ts.backend || '']);
      csvRows.push(['Technology', 'Database', ts.database || '']);
      csvRows.push(['Technology', 'Cloud', ts.cloud || '']);
      csvRows.push(['Technology', 'Mobile', ts.mobile || '']);
      
      // MVP Core Features
      if (Array.isArray(tr.mvp_core_features)) {
        tr.mvp_core_features.forEach((item, idx) => csvRows.push(['MVP Features', `Feature ${idx + 1}`, item]));
      }
      
      // SWOT
      const swot = br.swot_analysis || {};
      if (Array.isArray(swot.strengths)) {
        swot.strengths.forEach((item, idx) => csvRows.push(['SWOT - Strengths', `Strength ${idx + 1}`, item]));
      }
      if (Array.isArray(swot.weaknesses)) {
        swot.weaknesses.forEach((item, idx) => csvRows.push(['SWOT - Weaknesses', `Weakness ${idx + 1}`, item]));
      }
      if (Array.isArray(swot.opportunities)) {
        swot.opportunities.forEach((item, idx) => csvRows.push(['SWOT - Opportunities', `Opportunity ${idx + 1}`, item]));
      }
      if (Array.isArray(swot.threats)) {
        swot.threats.forEach((item, idx) => csvRows.push(['SWOT - Threats', `Threat ${idx + 1}`, item]));
      }
      
      // Risks
      csvRows.push(['Risks', 'Business Risks & Mitigation', br.risks_and_mitigation || '']);
      csvRows.push(['Risks', 'Technical Risks', tr.technical_risks || '']);
      
      // Funding
      csvRows.push(['Funding', 'Recommendations', br.funding_recommendations || '']);
      
      // Success Metrics
      if (Array.isArray(br.success_metrics)) {
        br.success_metrics.forEach((item, idx) => csvRows.push(['Success Metrics', `Metric ${idx + 1}`, item]));
      }
      
      // Escape CSV values
      const escapeCsv = (val) => {
        const str = String(val || '').replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
      };
      
      const csvContent = csvRows.map(row => row.map(escapeCsv).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${analysis.business_idea.replace(/[^a-zA-Z0-9]/g, '_')}_Planlyze.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(isArabic ? "تم تنزيل CSV" : "CSV downloaded");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      toast.error(isArabic ? "فشل تنزيل ملف CSV" : "Failed to download CSV");
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  // Removed explicit PDF download
  // const handleDownloadPdf = async () => {
  //   if (!analysis) return;
  //   setIsDownloading(true);

  //   // Sanitize business idea for filename
  //   const sanitize = (s) => {
  //     const base = String(s || "Report").trim().replace(/[/\\?%*:|"<>]/g, "_").replace(/\s+/g, "_");
  //     // limit filename length
  //     return base.substring(0, 80);
  //   };
  //   const filename = `${sanitize(analysis.business_idea)}_Planlyze.pdf`;

  //   try {
  //     const data = await exportReport({
  //       // send both keys to be compatible with backend signature
  //       id: analysis.id,
  //       analysisId: analysis.id
  //     });
  
  //     const blob = new Blob([data], { type: "application/pdf" });
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = filename;
  //     document.body.appendChild(a);
  //     a.click();
  //     a.remove();
  //     window.URL.revokeObjectURL(url);
  //   } catch (error) {
  //     console.error("Error downloading PDF:", error);
  //     toast.error(analysis.report_language === 'arabic' ? "فشل تنزيل ملف PDF" : "Failed to download PDF");
  //   } finally {
  //     setIsDownloading(false);
  //   }
  // };

  const handleSaveRating = async () => {
    if (!analysis) return;
    setSavingRating(true);
    try {
      await Analysis.update(analysis.id, {
        user_rating: rating ?? null,
        user_feedback: feedback || ""
      });
      toast.success(analysis.report_language === 'arabic' ? "تم حفظ التقييم" : "Rating saved");
      setAnalysis((prevAnalysis) => ({
        ...prevAnalysis,
        user_rating: rating ?? null,
        user_feedback: feedback || ""
      }));
    } catch (error) {
      console.error("Error saving rating:", error);
      toast.error(analysis.report_language === 'arabic' ? "فشل حفظ التقييم" : "Failed to save rating");
    } finally {
      setSavingRating(false);
    }
  };

  const handleUpgradeToPremium = async () => {
    if (userCredits <= 0) {
      toast.error(analysis.report_language === 'arabic' ? 'ليس لديك أرصدة كافية' : 'Insufficient credits');
      navigate(createPageUrl("Credits"));
      return;
    }

    setIsUpgrading(true);
    try {
      // Call backend API to handle premium upgrade (deducts credit and creates transaction)
      await api.post(`/analyses/${analysis.id}/upgrade-premium`);
      
      toast.success(analysis.report_language === 'arabic' ? 'تمت الترقية بنجاح!' : 'Successfully upgraded!');
      
      // Reload to show premium features
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Upgrade failed:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Unknown error';
      toast.error(`${analysis.report_language === 'arabic' ? 'فشلت الترقية: ' : 'Upgrade failed: '}${errorMsg}`);
      setIsUpgrading(false);
    }
  };

  // Helper to build back URL preserving user param
  const backToReportsUrl = (() => {
    const p = new URLSearchParams(window.location.search).get('user');
    return createPageUrl(p ? `Reports?user=${encodeURIComponent(p)}` : "Reports");
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-64 bg-slate-200 rounded-lg animate-pulse" />
        </div>
      </div>);

  }

  if (!analysis || analysis.status !== 'completed') {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-16">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Report Not Available</h2>
          <p className="text-slate-600 mb-6">This analysis is not completed or doesn't exist.</p>
          <Button onClick={() => navigate(createPageUrl("Dashboard"))} className="gradient-primary text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>);

  }

  const isArabic = analysis.report_language === 'arabic';
  const isPremium = analysis.is_premium === true;
  
  // Map backend report structure to frontend expected structure
  const report = analysis.report || {};
  const businessReport = analysis.business_report || {
    overall_viability_score: report.score || analysis.score || 0,
    executive_summary: report.executive_summary || analysis.executive_summary || '',
    market_opportunity: report.market_analysis?.market_gap || '',
    market_size: report.market_analysis || {},
    swot_analysis: report.swot || {},
    revenue_streams: report.business_strategy?.revenue_streams || [],
    go_to_market: report.go_to_market || {},
    risks_and_mitigation: report.risk_assessment || {},
    funding_recommendations: report.financial_projections?.funding_recommendations || '',
    success_metrics: report.recommendations?.success_metrics || []
  };
  const technicalReport = analysis.technical_report || {
    complexity_score: 5,
    mvp_by_ai_tool_score: 7,
    technology_stack: report.technical_strategy?.recommended_stack || {},
    mvp_core_features: report.technical_strategy?.mvp_features || [],
    architecture: report.technical_strategy?.architecture || '',
    technical_risks: report.technical_strategy?.security || ''
  };
  const fp = analysis.step10_financials_risks_swot || report.financial_projections || {};

  // Replace sectionsNav with the exact order requested - REMOVED as quick nav is removed
  // const sectionsNav = [
  //   { id: "exec_summary", label: isArabic ? "الملخص التنفيذي" : "Executive Summary", icon: FileText },
  //   { id: "problem_solution", label: isArabic ? "إطار المشكلة والحل" : "Problem & Solution Framework", icon: Lightbulb },
  //   { id: "market_opportunity", label: isArabic ? "الفرصة السوقية" : "Market Opportunity", icon: TrendingUp },
  //   { id: "target_audience", label: isArabic ? "الجمهور المستهدف" : "Target Audience", icon: Users },
  //   { id: "business_model_revenue", label: isArabic ? "نموذج العمل والإيرادات" : "Business Model & Revenue", icon: DollarSign },
  //   { id: "go_to_market", label: isArabic ? "استراتيجية دخول السوق" : "Go-to-Market Strategy", icon: Rocket },
  //   { id: "technical_impl", label: isArabic ? "التنفيذ التقني" : "Technical Implementation", icon: Settings },
  //   { id: "dev_plan", label: isArabic ? "خطة التطوير" : "Development Plan", icon: Layers },
  //   { id: "financial_proj", label: isArabic ? "التوقعات المالية" : "Financial Projections", icon: Calculator },
  //   { id: "risk_mitigation", label: isArabic ? "تقييم المخاطر والتخفيف" : "Risk Assessment & Mitigation", icon: Shield },
  //   { id: "swot", label: isArabic ? "تحليل SWOT" : "SWOT Analysis", icon: BarChart3 },
  //   { id: "success_validation", label: isArabic ? "مقاييس النجاح والتحقق" : "Success Metrics & Validation", icon: ListChecks },
  //   { id: "funding", label: isArabic ? "توصيات التمويل" : "Funding Recommendations", icon: DollarSign },
  //   { id: "partnerships", label: isArabic ? "فرص الشراكات" : "Partnership Opportunities", icon: Users },
  //   { id: "recommendations_next", label: isArabic ? "التوصيات والخطوات التالية" : "Recommendations & Next Steps", icon: CheckCircle2 },
  // ];

  return (
    <div className={`min-h-screen p-4 md:p-8 ${isArabic ? 'rtl' : 'ltr'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <style>{`
        [dir="rtl"] .rtl .list-disc { margin-right: 1.5rem; margin-left: 0; }
        [dir="rtl"] .rtl .list-decimal { margin-right: 1.5rem; margin-left: 0; }
        html { scroll-behavior: smooth; }
        @media print {
          .no-print { display: none !important; }

          /* Ensure the page wrapper doesn't clip content */
          .print-wrapper, .print-wrapper * { overflow: visible !important; }

          /* Allow content to naturally flow across pages */
          section, .glass-effect {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }
        }

        /* Colorful accents per section (keeps markdown structure intact) */
        section#exec_summary .glass-effect {
          border-top: 4px solid rgb(16 185 129); /* emerald-500 */
          box-shadow: 0 8px 24px rgba(16,185,129,0.08);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(16,185,129,0.06), transparent);
        }
        section#exec_summary h2 { color: rgb(5 150 105); } /* emerald-600 */

        section#problem_solution .glass-effect {
          border-top: 4px solid rgb(139 92 246); /* violet-500 */
          box-shadow: 0 8px 24px rgba(139,92,246,0.08);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(139,92,246,0.06), transparent);
        }
        section#problem_solution h2 { color: rgb(109 40 217); } /* violet-700 */

        section#market_opportunity .glass-effect {
          border-top: 4px solid rgb(99 102 241); /* indigo-500 */
          box-shadow: 0 8px 24px rgba(99,102,241,0.08);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(99,102,241,0.06), transparent);
        }
        section#market_opportunity h2 { color: rgb(67 56 202); } /* indigo-700 */

        section#competitors .glass-effect {
          border-top: 4px solid rgb(99 102 241); /* indigo-500 */
          box-shadow: 0 8px 24px rgba(99,102,241,0.10);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(99,102,241,0.06), transparent);
        }
        section#competitors h2 { color: rgb(67 56 202); } /* indigo-700 */

        section#competitors_syrian .glass-effect {
          border-top: 4px solid rgb(244 63 94); /* rose-500 */
          box-shadow: 0 8px 24px rgba(244,63,94,0.10);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(244,63,94,0.06), transparent);
        }
        section#competitors_syrian h2 { color: rgb(190 18 60); } /* rose-700 */

        section#target_audience .glass-effect {
          border-top: 4px solid rgb(244 63 94); /* rose-500 */
          box-shadow: 0 8px 24px rgba(244,63,94,0.08);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(244,63,94,0.06), transparent);
        }
        section#target_audience h2 { color: rgb(190 18 60); } /* rose-700 */

        section#business_model_revenue .glass-effect {
          border-top: 4px solid rgb(245 158 11); /* amber-500 */
          box-shadow: 0 8px 24px rgba(245,158,11,0.10);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(245,158,11,0.06), transparent);
        }
        section#business_model_revenue h2 { color: rgb(217 119 6); } /* amber-600 */

        section#go_to_market .glass-effect {
          border-top: 44px solid rgb(14 165 233); /* sky-500 */
          box-shadow: 0 8px 24px rgba(14,165,233,0.10);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(14,165,233,0.06), transparent);
        }
        section#go_to_market h2 { color: rgb(2 132 199); } /* sky-600 */

        section#tech_stack_suggestions .glass-effect {
          border-top: 4px solid rgb(132 204 22); /* lime-500 */
          box-shadow: 0 8px 24px rgba(132,204,22,0.10);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(132,204,22,0.06), transparent);
        }
        section#tech_stack_suggestions h2 { color: rgb(84 139 34); } /* lime-700 */

        section#ai_tools .glass-effect {
          border-top: 4px solid rgb(168 85 247); /* purple-500 */
          box-shadow: 0 8px 24px rgba(168,85,247,0.10);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(168,85,247,0.06), transparent);
        }
        section#ai_tools h2 { color: rgb(126 34 206); } /* purple-700 */

        section#technical_impl .glass-effect {
          border-top: 4px solid rgb(6 182 212); /* cyan-500 */
          box-shadow: 0 8px 24px rgba(6,182,212,0.10);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(6,182,212,0.06), transparent);
        }
        section#technical_impl h2 { color: rgb(8 145 178); } /* cyan-600 */

        section#dev_plan .glass-effect {
          border-top: 4px solid rgb(168 85 247); /* purple-500 */
          box-shadow: 0 8px 24px rgba(168,85,247,0.10);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(168,85,247,0.06), transparent);
        }
        section#dev_plan h2 { color: rgb(147 51 234); } /* purple-600 */

        section#financial_proj .glass-effect {
          border-top: 4px solid rgb(20 184 166); /* teal-500 */
          box-shadow: 0 8px 24px rgba(20,184,166,0.10);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(20,184,166,0.06), transparent);
        }
        section#financial_proj h2 { color: rgb(15 118 110); } /* teal-700 */

        section#risk_mitigation .glass-effect {
          border-top: 4px solid rgb(249 115 22); /* orange-500 */
          box-shadow: 0 8px 24px rgba(249,115,22,0.12);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(249,115,22,0.06), transparent);
        }
        section#risk_mitigation h2 { color: rgb(194 65 12); } /* orange-700 */

        section#swot .glass-effect {
          border-top: 4px solid rgb(217 70 239); /* fuchsia-500 */
          box-shadow: 0 8px 24px rgba(217,70,239,0.10);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(217,70,239,0.06), transparent);
        }
        section#swot h2 { color: rgb(162 28 175); } /* fuchsia-700 */

        section#success_validation .glass-effect {
          border-top: 4px solid rgb(59 130 246); /* blue-500 */
          box-shadow: 0 8px 24px rgba(59,130,246,0.10);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(59,130,246,0.06), transparent);
        }
        section#success_validation h2 { color: rgb(37 99 235); } /* blue-600 */

        section#funding .glass-effect {
          border-top: 4px solid rgb(239 68 68); /* red-500 */
          box-shadow: 0 8px 24px rgba(239,68,68,0.12);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(239,68,68,0.06), transparent);
        }
        section#funding h2 { color: rgb(185 28 28); } /* red-700 */

        section#partnerships .glass-effect {
          border-top: 4px solid rgb(34 197 94); /* green-500 */
          box-shadow: 0 8px 24px rgba(34,197,94,0.10);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(34,197,94,0.06), transparent);
        }
        section#partnerships h2 { color: rgb(21 128 61); } /* green-700 */

        section#recommendations_next .glass-effect {
          border-top: 4px solid rgb(100 116 139); /* slate-500 */
          box-shadow: 0 8px 24px rgba(100,116,139,0.10);
          background-image: radial-gradient(1200px 200px at 0% -10%, rgba(100,116,139,0.06), transparent);
        }
        section#recommendations_next h2 { color: rgb(71 85 105); } /* slate-600 */
      `}</style>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header - improved responsiveness */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(backToReportsUrl)}
              className="shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                {analysis.business_idea}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-slate-600">
                  {isArabic ? 'تم إكمال التحليل في' : 'Analysis completed on'} {analysis.created_at ? format(new Date(analysis.created_at), "MMMM d, yyyy") : ''}
                </p>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {isArabic ? 'العربية' : 'English'}
                </Badge>
                {analysis.country && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {analysis.country}
                  </Badge>
                )}
                {isPremium && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white flex items-center gap-1">
                    ✨ {isArabic ? 'متميز' : 'Premium'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {/* Premium Feature: Export Options */}
          <div className="flex items-center gap-2">
            {/* Share Button */}
            <Button
                            onClick={() => setShowShareModal(true)}
                            variant="outline"
                            className="gap-2 border-amber-400 hover:bg-amber-50 text-amber-600"
                          >
                            <Share2 className="w-4 h-4 text-amber-600" />
                            {isArabic ? 'مشاركة' : 'Share'}
            </Button>
            
            {isPremium ? (
              <>
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  variant="outline"
                  className="gap-2"
                >
                  <Printer className="w-4 h-4" />
                  {isExporting ? (isArabic ? 'جارٍ...' : 'Printing...') : (isArabic ? 'طباعة' : 'Print')}
                </Button>
                <Button
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="gap-2 gradient-primary text-white"
                >
                  <Download className="w-4 h-4" />
                  {isDownloadingPdf ? (isArabic ? 'جارٍ...' : 'Downloading...') : 'PDF'}
                </Button>
                <Button
                  onClick={handleDownloadCsv}
                  disabled={isDownloadingCsv}
                  variant="outline"
                  className="gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {isDownloadingCsv ? (isArabic ? 'جارٍ...' : 'Downloading...') : 'CSV'}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate(createPageUrl("Credits"))}
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {isArabic ? 'فتح التصدير (متميز)' : 'Unlock Export (Premium)'}
              </Button>
            )}
          </div>
        </div>

        {/* Share Modal */}
        <ShareReportModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          analysisId={analysis?.id}
          analysisTitle={analysis?.business_idea}
          ownerEmail={currentUser?.email}
          isArabic={isArabic}
        />

        {/* Tabbed Analysis Results */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto gap-1 bg-slate-100/80 p-1 rounded-xl mb-6">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">{isArabic ? "نظرة عامة" : "Overview"}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="market" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">{isArabic ? "السوق" : "Market"}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="business" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg"
            >
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">{isArabic ? "الأعمال" : "Business"}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="technical" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white rounded-lg"
            >
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">{isArabic ? "التقني" : "Technical"}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="financial" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-lg"
            >
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">{isArabic ? "المالي" : "Financial"}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="strategy" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">{isArabic ? "الاستراتيجية" : "Strategy"}</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview - Key Metrics */}
          <TabsContent value="overview" className="space-y-6">
            <LazyTabContent isLoaded={loadedTabs.overview} isLoading={tabLoading.overview} isArabic={isArabic} hasError={tabError.overview} onRetry={() => retryTab('overview')}>
            {/* Key Metrics Card */}
            <Card className="glass-effect border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Target className="w-7 h-7" />
                  {isArabic ? "المؤشرات الرئيسية" : "Key Metrics"}
                </h2>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Market Fit */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">{isArabic ? "ملاءمة السوق" : "Market Fit"}</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {tabData.overview?.market_fit_score || analysis.step3_market_opportunity?.market_fit_score || businessReport.overall_viability_score || report.score || 75}%
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-emerald-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${tabData.overview?.market_fit_score || analysis.step3_market_opportunity?.market_fit_score || businessReport.overall_viability_score || report.score || 75}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Time to Build */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">{isArabic ? "وقت البناء" : "Time to Build"}</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {tabData.overview?.time_to_build_months || analysis.step9_development_plan?.estimated_months || fp.timeline_pricing?.total_months || 3} {isArabic ? "أشهر" : "months"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">{isArabic ? "للوصول إلى MVP" : "to reach MVP"}</p>
                  </div>

                  {/* Competitors */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">{isArabic ? "المنافسون" : "Competitors"}</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {tabData.overview?.competitors_count || analysis.step6_competition?.competitor_count || businessReport.competitor_matrix?.length || 5}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">{isArabic ? "منافسون في السوق" : "competitors in market"}</p>
                  </div>

                  {/* Starting Cost */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">{isArabic ? "تكلفة البدء" : "Starting Cost"}</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${tabData.overview?.starting_cost_usd || analysis.step10_financials_risks_swot?.cost_breakdown?.total_startup_cost || fp.cost_breakdown?.total || report.financial_projections?.startup_costs?.total || '5,000'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">{isArabic ? "رأس المال المطلوب" : "required capital"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Value Proposition - Separate Card */}
            <Card className="glass-effect border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  {isArabic ? "القيمة المقترحة" : "Value Proposition"}
                </h2>
              </div>
              <CardContent className="p-6">
                <p className="text-lg text-slate-700 leading-relaxed">
                  {tabData.overview?.value_proposition || analysis.step1_problem_solution?.value_proposition || report.business_strategy?.value_proposition || businessReport.problem_solution_framework?.value_proposition || (isArabic ? "حل مبتكر يلبي احتياجات السوق ويوفر قيمة فريدة للعملاء المستهدفين." : "An innovative solution that addresses market needs and provides unique value to target customers.")}
                </p>
              </CardContent>
            </Card>
            </LazyTabContent>
          </TabsContent>

          {/* Tab 2: Market & Competition */}
          <TabsContent value="market" className="space-y-6">
            <LazyTabContent isLoaded={loadedTabs.market} isLoading={tabLoading.market} isArabic={isArabic} hasError={tabError.market} onRetry={() => retryTab('market')}>
            
            {tabData.market ? (
              <MarketSection data={tabData.market} isArabic={isArabic} />
            ) : (
              <>
                <section id="market_opportunity">
                  <MarketOpportunity
                    report={{
                      market_opportunity: analysis.step3_market_opportunity?.market_opportunity ?? report.market_analysis?.market_gap ?? businessReport.market_opportunity,
                      market_size: analysis.step4_market_size || report.market_analysis || {},
                      local_demand_assessment: analysis.step5_local_demand?.local_demand_assessment || report.market_analysis?.growth_potential,
                      competition_analysis: analysis.step6_competition?.competition_analysis || report.market_analysis?.competition,
                      infrastructure_readiness: analysis.step3_market_opportunity?.infrastructure_readiness
                    }}
                    isArabic={isArabic}
                  />
                </section>

                <section id="competitors">
                  {isPremium ? (
                    <CompetitorMatrix businessReport={businessReport} isArabic={isArabic} />
                  ) : (
                    <Card className="glass-effect border-2 border-purple-300">
                      <CardContent className="p-6 text-center">
                        <Badge className="bg-purple-600 text-white mb-4">{isArabic ? "متميز" : "PREMIUM"}</Badge>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{isArabic ? "تحليل المنافسين الشامل" : "Comprehensive Competitor Analysis"}</h3>
                        <p className="text-slate-600 mb-4">{isArabic ? "قم بالترقية لرؤية تحليل مفصل للمنافسين" : "Upgrade to see detailed competitor analysis"}</p>
                        <UpgradePrompt isArabic={isArabic} variant="inline" feature={isArabic ? "تحليل المنافسين" : "Competitor Analysis"} userCredits={userCredits} onUpgrade={handleUpgradeToPremium} isUpgrading={isUpgrading} />
                      </CardContent>
                    </Card>
                  )}
                </section>

                <section id="competitors_syrian">
                  {isPremium ? (
                    <SyrianCompetitors businessReport={businessReport} isArabic={isArabic} />
                  ) : (
                    <Card className="glass-effect border-2 border-rose-300">
                      <CardContent className="p-6 text-center">
                        <Badge className="bg-rose-600 text-white mb-4">{isArabic ? "متميز" : "PREMIUM"}</Badge>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{isArabic ? "تحليل السوق السوري والإقليمي" : "Syrian & Regional Market Analysis"}</h3>
                        <p className="text-slate-600 mb-4">{isArabic ? "قم بالترقية لرؤية بيانات السوق السوري" : "Upgrade to see Syrian market data"}</p>
                        <UpgradePrompt isArabic={isArabic} variant="inline" feature={isArabic ? "بيانات السوق السوري" : "Syrian Market Data"} userCredits={userCredits} onUpgrade={handleUpgradeToPremium} isUpgrading={isUpgrading} />
                      </CardContent>
                    </Card>
                  )}
                </section>

                <section id="target_audience">
                  <TargetAudience
                    report={{ problem_solution_framework: { target_audience: analysis.step2_target_audience || { target_description: report.market_analysis?.target_segments?.join(', ') || '', demographics: report.market_analysis?.target_segments || [] } } }}
                    isArabic={isArabic}
                  />
                </section>
              </>
            )}
            </LazyTabContent>
          </TabsContent>

          {/* Tab 3: Business Model */}
          <TabsContent value="business" className="space-y-6">
            <LazyTabContent isLoaded={loadedTabs.business} isLoading={tabLoading.business} isArabic={isArabic} hasError={tabError.business} onRetry={() => retryTab('business')}>
            {tabData.business ? (
              <BusinessSection data={tabData.business} isArabic={isArabic} />
            ) : (
              <>
                <section id="business_model_revenue">
                  <BusinessModelRevenue
                    report={{ business_model: analysis.step7_goto_market_revenue?.business_model || report.business_strategy?.business_model, revenue_streams: analysis.step7_goto_market_revenue?.revenue_streams || report.business_strategy?.revenue_streams }}
                    isArabic={isArabic}
                  />
                </section>

                <section id="go_to_market">
                  <GoToMarket
                    report={{ go_to_market: analysis.step7_goto_market_revenue?.go_to_market || report.go_to_market }}
                    isArabic={isArabic}
                  />
                </section>

                <section id="partnerships">
                  <Partnerships
                    report={{ partnerships_opportunities: fp.partnerships_opportunities || report.business_strategy?.partnerships }}
                    isArabic={isArabic}
                  />
                </section>
              </>
            )}
            </LazyTabContent>
          </TabsContent>

          {/* Tab 4: Technical */}
          <TabsContent value="technical" className="space-y-6">
            <LazyTabContent isLoaded={loadedTabs.technical} isLoading={tabLoading.technical} isArabic={isArabic} hasError={tabError.technical} onRetry={() => retryTab('technical')}>
            {tabData.technical ? (
              <TechnicalSection data={tabData.technical} isArabic={isArabic} />
            ) : (
              <>
                <section id="tech_stack_suggestions">
                  <TechStackSuggestions
                    suggestionsData={analysis.step8_tech_stack_suggestions || { technology_stack_suggestions: technicalReport.technology_stack ? [technicalReport.technology_stack] : [], recommended_option_index: 0, recommended_rationale: report.technical_strategy?.architecture || "" }}
                    isArabic={isArabic}
                  />
                </section>

                <section id="ai_tools">
                  {isPremium ? (
                    <AIToolsSuggestions technicalReport={technicalReport} isArabic={isArabic} />
                  ) : (
                    <Card className="glass-effect border-2 border-purple-300">
                      <CardContent className="p-6 text-center">
                        <Badge className="bg-purple-600 text-white mb-4">{isArabic ? "متميز" : "PREMIUM"}</Badge>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{isArabic ? "توصيات أدوات الذكاء الاصطناعي" : "AI Tools Recommendations"}</h3>
                        <p className="text-slate-600 mb-4">{isArabic ? "قم بالترقية لرؤية توصيات الذكاء الاصطناعي" : "Upgrade to see AI tool recommendations"}</p>
                        <UpgradePrompt isArabic={isArabic} variant="inline" feature={isArabic ? "أدوات الذكاء الاصطناعي" : "AI Tools"} userCredits={userCredits} onUpgrade={handleUpgradeToPremium} isUpgrading={isUpgrading} />
                      </CardContent>
                    </Card>
                  )}
                </section>

                <section id="technical_impl">
                  <TechnicalImplementation
                    report={analysis.step8_technical_implementation || { architecture_overview: report.technical_strategy?.architecture || '', mvp_features: technicalReport.mvp_core_features || [], technology_stack: technicalReport.technology_stack || {}, scalability: report.technical_strategy?.scalability || '', security_considerations: report.technical_strategy?.security || '' }}
                    isArabic={isArabic}
                  />
                </section>

                <section id="dev_plan">
                  <DevelopmentPlan
                    report={analysis.step9_development_plan || report.development_roadmap || {}}
                    isArabic={isArabic}
                  />
                </section>
              </>
            )}
            </LazyTabContent>
          </TabsContent>

          {/* Tab 5: Financial */}
          <TabsContent value="financial" className="space-y-6">
            <LazyTabContent isLoaded={loadedTabs.financial} isLoading={tabLoading.financial} isArabic={isArabic} hasError={tabError.financial} onRetry={() => retryTab('financial')}>
            {tabData.financial ? (
              <FinancialSection data={tabData.financial} isArabic={isArabic} />
            ) : (
              <>
                <section id="financial_proj">
                  <FinancialProjections
                    report={{ country_pricing_basis: fp.country_pricing_basis || analysis.location, pricing_country: fp.pricing_country || analysis.location, pricing_currency: fp.pricing_currency || 'USD', cost_breakdown: fp.cost_breakdown || report.financial_projections?.startup_costs, timeline_pricing: fp.timeline_pricing || report.financial_projections?.monthly_expenses }}
                    isArabic={isArabic}
                  />
                </section>

                <section id="funding">
                  <FundingRecommendations
                    report={{ funding_recommendations: fp.funding_recommendations || report.financial_projections?.funding_recommendations }}
                    isArabic={isArabic}
                  />
                </section>
              </>
            )}
            </LazyTabContent>
          </TabsContent>

          {/* Tab 6: Strategy & Risks */}
          <TabsContent value="strategy" className="space-y-6">
            <LazyTabContent isLoaded={loadedTabs.strategy} isLoading={tabLoading.strategy} isArabic={isArabic} hasError={tabError.strategy} onRetry={() => retryTab('strategy')}>
            {tabData.strategy ? (
              <StrategySection data={tabData.strategy} isArabic={isArabic} />
            ) : (
              <>
                <section id="swot">
                  <SwotSimple
                    report={{ swot_analysis: fp.swot_analysis || report.swot }}
                    isArabic={isArabic}
                  />
                </section>

                <section id="risk_mitigation">
                  <RiskMitigation
                    businessReport={{ risks_and_mitigation: fp.risks_and_mitigation || report.risk_assessment }}
                    technicalReport={technicalReport}
                    isArabic={isArabic}
                  />
                </section>

                <section id="success_validation">
                  <SuccessMetricsValidation
                    report={{ success_metrics: fp.success_metrics || report.recommendations?.success_metrics || [], validation_methodology: fp.validation_methodology }}
                    isArabic={isArabic}
                  />
                </section>

                <section id="recommendations_next">
                  <RecommendationsNext
                    report={{ recommendation_summary: fp.recommendation_summary || report.recommendations }}
                    isArabic={isArabic}
                  />
                </section>
              </>
            )}
            </LazyTabContent>
          </TabsContent>
        </Tabs>

        {/* Report Footer */}
        <section>
          <ReportFooter
            analysis={analysis}
            isArabic={isArabic}
          />
        </section>

        {/* Moved rating widget to the end */}
        <Card className="glass-effect border-0 shadow-lg no-print">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {isArabic ? "قيِّم هذا التقرير" : "Rate this report"}
                </h3>
                <p className="text-sm text-slate-600">
                  {isArabic ? "ساعدنا على التحسين بترك تقييمك وملاحظاتك." : "Help us improve by leaving your rating and feedback."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <StarRating
                  value={rating || 0}
                  onChange={setRating}
                  disabled={!canRate}
                  size={24}
                />
                <span className="text-sm text-slate-600">
                  {rating ? `${rating}/5` : (isArabic ? "بدون تقييم" : "No rating")}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <Textarea
                placeholder={isArabic ? "اكتب ملاحظاتك هنا (اختياري)" : "Write your feedback here (optional)"}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={!canRate}
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={handleSaveRating}
                  disabled={!canRate || savingRating}
                  className="gap-2"
                  variant="outline"
                >
                  {savingRating ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ التقييم" : "Save rating")}
                </Button>
              </div>
            </div>

            {!canRate && rating != null && (
              <p className="text-xs text-slate-500 mt-2">
                {isArabic ? "عرض تقييم المالك." : "Viewing owner's rating."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Floating AI Assistant - Only for Premium Reports */}
        {isPremium && (
          <FloatingAIAssistant 
            analysis={analysis} 
            isArabic={isArabic}
            onRegenerate={async (chatContext) => {
              // Navigate to regeneration with chat context
              const params = new URLSearchParams({
                regenerate: analysis.id,
                context: encodeURIComponent(chatContext.substring(0, 2000))
              });
              navigate(createPageUrl(`NewAnalysis?${params.toString()}`));
            }}
          />
        )}
      </div>
    </div>
  );
}