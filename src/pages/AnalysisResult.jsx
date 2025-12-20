import React, { useState, useEffect, useCallback } from "react";
import { Analysis, User, auth, api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import UpgradePrompt from "../components/credits/UpgradePrompt";
import ShareReportModal from "../components/sharing/ShareReportModal";
import { canAccessAdmin } from "@/components/utils/permissions";

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
      const blob = new Blob([data], { type: "application/pdf" });
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

        {/* Removed: Sticky quick navigation bar with section buttons */}

        {/* Ordered sections */}
        <section id="exec_summary" className="scroll-mt-28 print:scroll-mt-0">
          <ExecutiveSummary
            analysis={analysis}
            businessReport={businessReport}
            technicalReport={technicalReport}
            isArabic={isArabic}
          />
        </section>

        <section id="problem_solution" className="scroll-mt-28 print:scroll-mt-0">
          <ProblemSolutionFramework
            report={{ 
              problem_solution_framework: analysis.step1_problem_solution || {
                core_problem: report.business_strategy?.value_proposition || '',
                solution_approach: report.executive_summary || analysis.executive_summary || '',
                value_proposition: report.business_strategy?.value_proposition || '',
                target_audience: { target_description: report.market_analysis?.target_segments?.join(', ') || '' }
              }
            }}
            isArabic={isArabic}
          />
        </section>

        <section id="market_opportunity" className="scroll-mt-28 print:scroll-mt-0">
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

        {/* Premium Feature: Competitors detailed section */}
        <section id="competitors" className="scroll-mt-28 print:scroll-mt-0">
          {isPremium ? (
            <CompetitorMatrix businessReport={businessReport} isArabic={isArabic} />
          ) : (
            <div className="relative glass-effect border-2 border-purple-300 rounded-xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-indigo-50 opacity-60"></div>
              <div className="relative p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {isArabic ? "تحليل المنافسين الشامل" : "Comprehensive Competitor Analysis"}
                      </h2>
                      <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-full">
                        {isArabic ? "متميز" : "PREMIUM"}
                      </span>
                    </div>
                    <p className="text-slate-700 text-lg mb-4 leading-relaxed">
                      {isArabic 
                        ? "احصل على تحليل مفصل لأكثر من 15 منافس، يشمل نقاط القوة والضعف، استراتيجيات التسعير، حصص السوق، والميزات التنافسية."
                        : "Get detailed analysis of 15+ competitors including their strengths, weaknesses, pricing strategies, market share, and competitive advantages."
                      }
                    </p>
                    <div className="grid md:grid-cols-2 gap-3 mb-4">
                      {[
                        isArabic ? "تحليل 15+ منافس" : "15+ Competitor Analysis",
                        isArabic ? "نقاط القوة والضعف" : "Strengths & Weaknesses",
                        isArabic ? "استراتيجيات التسعير" : "Pricing Strategies",
                        isArabic ? "حصص السوق" : "Market Share Data"
                      ].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-slate-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gradient-to-r from-purple-100 to-indigo-100 border-2 border-purple-300 rounded-xl p-4 shadow-inner">
                      <p className="text-base font-bold text-purple-800 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {isArabic 
                          ? "رصيد واحد فقط يفتح جميع الميزات المتميزة في هذا التقرير"
                          : "Only 1 credit unlocks ALL premium features in this report"
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <UpgradePrompt 
                  isArabic={isArabic} 
                  variant="inline"
                  feature={isArabic ? "تحليل المنافسين الكامل" : "Full Competitor Analysis"}
                  userCredits={userCredits}
                  onUpgrade={handleUpgradeToPremium}
                  isUpgrading={isUpgrading}
                />
              </div>
            </div>
          )}
        </section>

        {/* Premium Feature: Syrian competitors section (from user-supplied file) */}
        <section id="competitors_syrian" className="scroll-mt-28 print:scroll-mt-0">
          {isPremium ? (
            <SyrianCompetitors businessReport={businessReport} isArabic={isArabic} />
          ) : (
            <div className="relative glass-effect border-2 border-rose-300 rounded-xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-pink-50 opacity-60"></div>
              <div className="relative p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                        {isArabic ? "تحليل السوق السوري والإقليمي" : "Syrian & Regional Market Analysis"}
                      </h2>
                      <span className="px-3 py-1 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-bold rounded-full">
                        {isArabic ? "متميز" : "PREMIUM"}
                      </span>
                    </div>
                    <p className="text-slate-700 text-lg mb-4 leading-relaxed">
                      {isArabic 
                        ? "بيانات حصرية عن السوق السوري والإقليمي، تشمل المنافسين المحليين، اتجاهات السوق، والفرص الفريدة."
                        : "Exclusive data about the Syrian and regional market, including local competitors, market trends, and unique opportunities."
                      }
                    </p>
                    <div className="grid md:grid-cols-2 gap-3 mb-4">
                      {[
                        isArabic ? "المنافسون المحليون" : "Local Competitors",
                        isArabic ? "اتجاهات السوق" : "Market Trends",
                        isArabic ? "التحديات الإقليمية" : "Regional Challenges",
                        isArabic ? "فرص فريدة" : "Unique Opportunities"
                      ].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-slate-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gradient-to-r from-purple-100 to-indigo-100 border-2 border-purple-300 rounded-xl p-4 shadow-inner">
                      <p className="text-base font-bold text-purple-800 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {isArabic 
                          ? "رصيد واحد فقط يفتح جميع الميزات المتميزة في هذا التقرير"
                          : "Only 1 credit unlocks ALL premium features in this report"
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <UpgradePrompt 
                  isArabic={isArabic} 
                  variant="inline"
                  feature={isArabic ? "بيانات السوق السوري" : "Syrian Market Data"}
                  userCredits={userCredits}
                  onUpgrade={handleUpgradeToPremium}
                  isUpgrading={isUpgrading}
                />
              </div>
            </div>
          )}
        </section>

        <section id="target_audience" className="scroll-mt-28 print:scroll-mt-0">
          <TargetAudience
            report={{ 
              problem_solution_framework: { 
                target_audience: analysis.step2_target_audience || {
                  target_description: report.market_analysis?.target_segments?.join(', ') || '',
                  demographics: report.market_analysis?.target_segments || []
                }
              } 
            }}
            isArabic={isArabic}
          />
        </section>

        <section id="business_model_revenue" className="scroll-mt-28 print:scroll-mt-0">
          <BusinessModelRevenue
            report={{
              business_model: analysis.step7_goto_market_revenue?.business_model || report.business_strategy?.business_model,
              revenue_streams: analysis.step7_goto_market_revenue?.revenue_streams || report.business_strategy?.revenue_streams
            }}
            isArabic={isArabic}
          />
        </section>

        <section id="go_to_market" className="scroll-mt-28 print:scroll-mt-0">
          <GoToMarket
            report={{ go_to_market: analysis.step7_goto_market_revenue?.go_to_market || report.go_to_market }}
            isArabic={isArabic}
          />
        </section>

        {/* Step 8a - Technology Stack Suggestions */}
        <section id="tech_stack_suggestions" className="scroll-mt-28 print:scroll-mt-0">
          <TechStackSuggestions
            suggestionsData={analysis.step8_tech_stack_suggestions || {
              technology_stack_suggestions: technicalReport.technology_stack ? [technicalReport.technology_stack] : [],
              recommended_option_index: 0,
              recommended_rationale: report.technical_strategy?.architecture || ""
            }}
            isArabic={isArabic}
          />
        </section>

        {/* Premium Feature: AI Tools suggestions from step 8b if present */}
        <section id="ai_tools" className="scroll-mt-28 print:scroll-mt-0">
          {isPremium ? (
            <AIToolsSuggestions
              technicalReport={technicalReport}
              isArabic={isArabic}
            />
          ) : (
            <div className="relative glass-effect border-2 border-purple-300 rounded-xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-violet-50 opacity-60"></div>
              <div className="relative p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                        {isArabic ? "توصيات أدوات الذكاء الاصطناعي المتقدمة" : "Advanced AI Tools & Predictions"}
                      </h2>
                      <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xs font-bold rounded-full">
                        {isArabic ? "متميز" : "PREMIUM"}
                      </span>
                    </div>
                    <p className="text-slate-700 text-lg mb-4 leading-relaxed">
                      {isArabic 
                        ? "توصيات مفصلة لأدوات الذكاء الاصطناعي والتعلم الآلي المناسبة لمشروعك، مع تحليل للتكامل والتكاليف."
                        : "Detailed recommendations for AI and machine learning tools suitable for your project, with integration analysis and costs."
                      }
                    </p>
                    <div className="grid md:grid-cols-2 gap-3 mb-4">
                      {[
                        isArabic ? "أدوات الذكاء الاصطناعي" : "AI Tool Recommendations",
                        isArabic ? "تحليل التكامل" : "Integration Analysis",
                        isArabic ? "نماذج التنبؤ" : "Prediction Models",
                        isArabic ? "تقدير التكاليف" : "Cost Estimates"
                      ].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-slate-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gradient-to-r from-purple-100 to-indigo-100 border-2 border-purple-300 rounded-xl p-4 shadow-inner">
                      <p className="text-base font-bold text-purple-800 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {isArabic 
                          ? "رصيد واحد فقط يفتح جميع الميزات المتميزة في هذا التقرير"
                          : "Only 1 credit unlocks ALL premium features in this report"
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <UpgradePrompt 
                  isArabic={isArabic} 
                  variant="inline"
                  feature={isArabic ? "توقعات الذكاء الاصطناعي المتقدمة" : "Advanced AI Predictions"}
                  userCredits={userCredits}
                  onUpgrade={handleUpgradeToPremium}
                  isUpgrading={isUpgrading}
                />
              </div>
            </div>
          )}
        </section>

        <section id="technical_impl" className="scroll-mt-28 print:scroll-mt-0">
          <TechnicalImplementation
            report={analysis.step8_technical_implementation || {
              architecture_overview: report.technical_strategy?.architecture || '',
              mvp_features: technicalReport.mvp_core_features || [],
              technology_stack: technicalReport.technology_stack || {},
              scalability: report.technical_strategy?.scalability || '',
              security_considerations: report.technical_strategy?.security || ''
            }}
            isArabic={isArabic}
          />
        </section>

        <section id="dev_plan" className="scroll-mt-28 print:scroll-mt-0">
          <DevelopmentPlan
            report={analysis.step9_development_plan || report.development_roadmap || {}}
            isArabic={isArabic}
          />
        </section>

        <section id="financial_proj" className="scroll-mt-28 print:scroll-mt-0">
          <FinancialProjections
            report={{
              country_pricing_basis: fp.country_pricing_basis || analysis.location,
              pricing_country: fp.pricing_country || analysis.location,
              pricing_currency: fp.pricing_currency || 'USD',
              cost_breakdown: fp.cost_breakdown || report.financial_projections?.startup_costs,
              timeline_pricing: fp.timeline_pricing || report.financial_projections?.monthly_expenses
            }}
            isArabic={isArabic}
          />
        </section>

        <section id="risk_mitigation" className="scroll-mt-28 print:scroll-mt-0">
          <RiskMitigation
            businessReport={{ risks_and_mitigation: fp.risks_and_mitigation || report.risk_assessment }}
            technicalReport={technicalReport}
            isArabic={isArabic}
          />
        </section>

        <section id="swot" className="scroll-mt-28 print:scroll-mt-0">
          <SwotSimple
            report={{ swot_analysis: fp.swot_analysis || report.swot }}
            isArabic={isArabic}
          />
        </section>

        <section id="success_validation" className="scroll-mt-28 print:scroll-mt-0">
          <SuccessMetricsValidation
            report={{
              success_metrics: fp.success_metrics || report.recommendations?.success_metrics || [],
              validation_methodology: fp.validation_methodology
            }}
            isArabic={isArabic}
          />
        </section>

        <section id="funding" className="scroll-mt-28 print:scroll-mt-0">
          <FundingRecommendations
            report={{ funding_recommendations: fp.funding_recommendations || report.financial_projections?.funding_recommendations }}
            isArabic={isArabic}
          />
        </section>

        <section id="partnerships" className="scroll-mt-28 print:scroll-mt-0">
          <Partnerships
            report={{ partnerships_opportunities: fp.partnerships_opportunities || report.business_strategy?.partnerships }}
            isArabic={isArabic}
          />
        </section>

        <section id="recommendations_next" className="scroll-mt-28 print:scroll-mt-0">
          <RecommendationsNext
            report={{ recommendation_summary: fp.recommendation_summary || report.recommendations }}
            isArabic={isArabic}
          />
        </section>

        {/* New: Standardized footer */}
        <section className="scroll-mt-28 print:scroll-mt-0">
          <ReportFooter
            analysis={analysis}
            businessReport={businessReport}
            technicalReport={technicalReport}
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