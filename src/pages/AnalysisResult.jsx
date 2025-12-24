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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { jsPDF } from "jspdf";
import { useAuth } from "@/lib/AuthContext";

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
import TechStackSuggestions from "../components/results/TechStackSuggestions";
import AIToolsSuggestions from "../components/results/AIToolsSuggestions";
import CompetitorMatrix from "../components/results/CompetitorMatrix";
import SyrianCompetitors from "../components/results/SyrianCompetitors";
import MarketSection from "../components/results/MarketSection";
import BusinessSection from "../components/results/BusinessSection";
import TechnicalSection from "../components/results/TechnicalSection";
import FinancialSection from "../components/results/FinancialSection";
import StrategySection from "../components/results/StrategySection";
import LockedContent from "../components/results/LockedContent";
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
  const { refreshUser } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
  const [exportProgress, setExportProgress] = useState({ show: false, step: '', progress: 0 });
  const [canRate, setCanRate] = useState(false);
  const [rating, setRating] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [savingRating, setSavingRating] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState("market");
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
      
      if (response.data?.data) {
        setTabData(prev => ({ ...prev, [tabName]: response.data.data }));
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

  const handleDownloadPdf = async () => {
    if (!analysis) return;
    setIsDownloadingPdf(true);
    setExportProgress({ show: true, step: isArabic ? 'جارٍ تحضير التقرير...' : 'Preparing report...', progress: 5 });

    const sanitize = (s) => {
      const base = String(s || "Report").trim().replace(/[/\\?%*:|"<>]/g, "_").replace(/\s+/g, "_");
      return base.substring(0, 80);
    };
    const filename = `${sanitize(analysis.business_idea)}_Planlyze.pdf`;
    const tabs = ['overview', 'market', 'business', 'technical', 'financial', 'strategy'];
    const allTabData = { ...tabData };

    try {
      // Load all tab content if not already loaded
      for (let i = 0; i < tabs.length; i++) {
        const tabName = tabs[i];
        const progressPercent = 10 + Math.round((i / tabs.length) * 50);
        setExportProgress({ 
          show: true, 
          step: isArabic ? `جارٍ تحميل ${tabName}...` : `Loading ${tabName} section...`, 
          progress: progressPercent 
        });

        if (!allTabData[tabName]) {
          const cachedData = analysis[`tab_${tabName}`];
          if (cachedData) {
            allTabData[tabName] = cachedData;
          } else {
            try {
              const lang = analysis?.report_language === 'arabic' ? 'ar' : 'en';
              const response = await api.post('/ai/generate-tab-content', {
                analysis_id: analysis.id,
                tab_name: tabName,
                language: lang
              });
              if (response.data?.data) {
                allTabData[tabName] = response.data.data;
              }
            } catch (err) {
              console.error(`Error loading ${tabName}:`, err);
            }
          }
        }
      }

      setExportProgress({ show: true, step: isArabic ? 'جارٍ إنشاء PDF...' : 'Generating PDF...', progress: 70 });

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      const addPage = () => {
        pdf.addPage();
        yPos = margin;
      };

      const checkPageBreak = (neededHeight) => {
        if (yPos + neededHeight > pageHeight - margin) {
          addPage();
        }
      };

      const addTitle = (text, fontSize = 18) => {
        checkPageBreak(15);
        pdf.setFontSize(fontSize);
        pdf.setTextColor(79, 70, 229);
        pdf.text(text, margin, yPos);
        yPos += fontSize * 0.5 + 5;
      };

      const addSubtitle = (text, fontSize = 14) => {
        checkPageBreak(12);
        pdf.setFontSize(fontSize);
        pdf.setTextColor(51, 65, 85);
        pdf.text(text, margin, yPos);
        yPos += fontSize * 0.4 + 4;
      };

      const addText = (text, fontSize = 10) => {
        if (!text) return;
        pdf.setFontSize(fontSize);
        pdf.setTextColor(71, 85, 105);
        const lines = pdf.splitTextToSize(String(text), contentWidth);
        lines.forEach(line => {
          checkPageBreak(6);
          pdf.text(line, margin, yPos);
          yPos += 5;
        });
        yPos += 3;
      };

      const addBulletList = (items, indent = 5) => {
        if (!items || !Array.isArray(items)) return;
        items.forEach(item => {
          checkPageBreak(6);
          pdf.setFontSize(10);
          pdf.setTextColor(71, 85, 105);
          const lines = pdf.splitTextToSize(`• ${item}`, contentWidth - indent);
          lines.forEach((line, idx) => {
            pdf.text(line, margin + (idx === 0 ? 0 : indent), yPos);
            yPos += 5;
          });
        });
        yPos += 3;
      };

      // Cover Page
      pdf.setFillColor(79, 70, 229);
      pdf.rect(0, 0, pageWidth, 60, 'F');
      pdf.setFontSize(28);
      pdf.setTextColor(255, 255, 255);
      pdf.text('PLANLYZE', margin, 35);
      pdf.setFontSize(12);
      pdf.text(isArabic ? 'تقرير تحليل الأعمال' : 'Business Analysis Report', margin, 48);
      
      yPos = 80;
      pdf.setFontSize(20);
      pdf.setTextColor(30, 41, 59);
      const titleLines = pdf.splitTextToSize(analysis.business_idea || 'Business Report', contentWidth);
      titleLines.forEach(line => {
        pdf.text(line, margin, yPos);
        yPos += 10;
      });

      yPos += 10;
      pdf.setFontSize(11);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`${isArabic ? 'التاريخ:' : 'Date:'} ${format(new Date(analysis.created_at), 'MMMM d, yyyy')}`, margin, yPos);
      yPos += 7;
      if (analysis.industry) pdf.text(`${isArabic ? 'المجال:' : 'Industry:'} ${analysis.industry}`, margin, yPos);
      yPos += 7;
      if (analysis.country) pdf.text(`${isArabic ? 'الموقع:' : 'Location:'} ${analysis.country}`, margin, yPos);

      setExportProgress({ show: true, step: isArabic ? 'جارٍ إضافة الأقسام...' : 'Adding sections...', progress: 80 });

      // Overview Section
      addPage();
      addTitle(isArabic ? 'نظرة عامة' : 'Overview');
      const overview = allTabData.overview || analysis.report || {};
      if (overview.value_proposition) {
        addSubtitle(isArabic ? 'القيمة المقترحة' : 'Value Proposition');
        addText(overview.value_proposition);
      }
      if (overview.market_fit_score !== undefined) {
        addSubtitle(isArabic ? 'المقاييس الرئيسية' : 'Key Metrics');
        addText(`${isArabic ? 'نسبة ملاءمة السوق:' : 'Market Fit Score:'} ${overview.market_fit_score}%`);
        if (overview.time_to_build_months) addText(`${isArabic ? 'وقت البناء:' : 'Time to Build:'} ${overview.time_to_build_months} ${isArabic ? 'شهر' : 'months'}`);
        if (overview.competitors_count) addText(`${isArabic ? 'عدد المنافسين:' : 'Competitors:'} ${overview.competitors_count}`);
        if (overview.starting_cost_usd) addText(`${isArabic ? 'تكلفة البداية:' : 'Starting Cost:'} $${overview.starting_cost_usd?.toLocaleString()}`);
      }
      if (overview.executive_summary) {
        addSubtitle(isArabic ? 'الملخص التنفيذي' : 'Executive Summary');
        addText(overview.executive_summary);
      }

      // Market Section
      addPage();
      addTitle(isArabic ? 'تحليل السوق' : 'Market Analysis');
      const market = allTabData.market || {};
      if (market.target_audiences && Array.isArray(market.target_audiences)) {
        addSubtitle(isArabic ? 'الجمهور المستهدف' : 'Target Audiences');
        market.target_audiences.forEach((audience) => {
          addText(`• ${audience.segment || audience.name}: ${audience.description || ''}`);
        });
      }
      if (market.key_problems && Array.isArray(market.key_problems)) {
        addSubtitle(isArabic ? 'المشاكل الرئيسية' : 'Key Problems');
        market.key_problems.forEach((problem) => {
          addText(`• ${problem.problem || problem.title || (typeof problem === 'string' ? problem : '')}`);
        });
      }
      if (market.syrian_competitors && Array.isArray(market.syrian_competitors)) {
        addSubtitle(isArabic ? 'المنافسون' : 'Competitors');
        addBulletList(market.syrian_competitors.map(c => typeof c === 'string' ? c : c.name || JSON.stringify(c)));
      }
      if (market.swot) {
        addSubtitle('SWOT');
        if (market.swot.strengths && Array.isArray(market.swot.strengths)) {
          addText(isArabic ? 'نقاط القوة:' : 'Strengths:');
          addBulletList(market.swot.strengths);
        }
        if (market.swot.weaknesses && Array.isArray(market.swot.weaknesses)) {
          addText(isArabic ? 'نقاط الضعف:' : 'Weaknesses:');
          addBulletList(market.swot.weaknesses);
        }
        if (market.swot.opportunities && Array.isArray(market.swot.opportunities)) {
          addText(isArabic ? 'الفرص:' : 'Opportunities:');
          addBulletList(market.swot.opportunities);
        }
        if (market.swot.threats && Array.isArray(market.swot.threats)) {
          addText(isArabic ? 'التهديدات:' : 'Threats:');
          addBulletList(market.swot.threats);
        }
      }

      // Business Section (Go-to-Market Strategy)
      addPage();
      addTitle(isArabic ? 'استراتيجية الدخول للسوق' : 'Go-to-Market Strategy');
      const business = allTabData.business || {};
      if (business.go_to_market_strategy) {
        if (business.go_to_market_strategy.marketing_strategy?.overview) {
          addSubtitle(isArabic ? 'استراتيجية التسويق' : 'Marketing Strategy');
          addText(business.go_to_market_strategy.marketing_strategy.overview);
        }
        if (business.go_to_market_strategy.validation_steps && Array.isArray(business.go_to_market_strategy.validation_steps)) {
          addSubtitle(isArabic ? 'خطوات التحقق' : 'Validation Steps');
          business.go_to_market_strategy.validation_steps.forEach((step) => {
            addText(`• ${step.step || step}: ${step.description || ''}`);
          });
        }
      }
      if (business.distribution_channels && Array.isArray(business.distribution_channels)) {
        addSubtitle(isArabic ? 'قنوات التوزيع' : 'Distribution Channels');
        business.distribution_channels.forEach((channel) => {
          addText(`• ${channel.channel_name || channel}: ${channel.details || ''}`);
        });
      }
      if (business.kpis && Array.isArray(business.kpis)) {
        addSubtitle(isArabic ? 'مؤشرات الأداء الرئيسية' : 'Key Performance Indicators');
        business.kpis.forEach((kpi) => {
          addText(`• ${kpi.metric || kpi}: ${kpi.target || ''}`);
        });
      }

      // Technical Section
      addPage();
      addTitle(isArabic ? 'التنفيذ التقني' : 'Technical Implementation');
      const technical = allTabData.technical || {};
      if (technical.technical_stack) {
        if (technical.technical_stack.recommended_stack && Array.isArray(technical.technical_stack.recommended_stack)) {
          addSubtitle(isArabic ? 'التقنيات المقترحة' : 'Recommended Tech Stack');
          technical.technical_stack.recommended_stack.forEach((tech) => {
            addText(`• ${tech.category}: ${tech.technology}`);
          });
        }
        if (technical.technical_stack.estimated_time) {
          addText(`${isArabic ? 'الوقت المقدر:' : 'Estimated Time:'} ${technical.technical_stack.estimated_time}`);
        }
        if (technical.technical_stack.languages && Array.isArray(technical.technical_stack.languages)) {
          addText(`${isArabic ? 'لغات البرمجة:' : 'Languages:'} ${technical.technical_stack.languages.join(', ')}`);
        }
      }
      if (technical.development_plan && Array.isArray(technical.development_plan)) {
        addSubtitle(isArabic ? 'خطة التطوير' : 'Development Plan');
        technical.development_plan.forEach((phase) => {
          addText(`${phase.version || phase.name || ''}`);
          if (phase.features && Array.isArray(phase.features)) {
            phase.features.forEach((f) => {
              addText(`  • ${f.feature || f}`);
            });
          }
        });
      }
      if (technical.mvp) {
        addSubtitle('MVP');
        if (technical.mvp.core_features && Array.isArray(technical.mvp.core_features)) {
          addBulletList(technical.mvp.core_features);
        }
      }

      // Financial Section
      addPage();
      addTitle(isArabic ? 'التحليل المالي' : 'Financial Analysis');
      const financial = allTabData.financial || {};
      if (financial.revenue_streams && Array.isArray(financial.revenue_streams)) {
        addSubtitle(isArabic ? 'مصادر الإيرادات' : 'Revenue Streams');
        financial.revenue_streams.forEach((stream) => {
          addText(`• ${stream.name || stream}: ${stream.description || ''}`);
        });
      }
      if (financial.pricing_strategy) {
        addSubtitle(isArabic ? 'استراتيجية التسعير' : 'Pricing Strategy');
        if (financial.pricing_strategy.model) addText(`${isArabic ? 'النموذج:' : 'Model:'} ${financial.pricing_strategy.model}`);
        if (financial.pricing_strategy.tiers && Array.isArray(financial.pricing_strategy.tiers)) {
          financial.pricing_strategy.tiers.forEach((tier) => {
            addText(`• ${tier.name}: ${tier.price}`);
          });
        }
      }
      if (financial.funding_opportunities && Array.isArray(financial.funding_opportunities)) {
        addSubtitle(isArabic ? 'فرص التمويل' : 'Funding Opportunities');
        financial.funding_opportunities.forEach((fund) => {
          addText(`• ${fund.type || fund}: ${fund.source || ''} - ${fund.amount_range || ''}`);
        });
      }

      // Strategy Section
      addPage();
      addTitle(isArabic ? 'الاستراتيجية وخطة العمل' : 'Strategy & Action Plan');
      const strategy = allTabData.strategy || {};
      if (strategy.risk_assessment && Array.isArray(strategy.risk_assessment)) {
        addSubtitle(isArabic ? 'تقييم المخاطر' : 'Risk Assessment');
        strategy.risk_assessment.forEach((risk) => {
          addText(`• ${risk.risk || risk} (${risk.severity || ''})`);
          if (risk.mitigation) addText(`  ${isArabic ? 'التخفيف:' : 'Mitigation:'} ${risk.mitigation}`);
        });
      }
      if (strategy.action_plan && Array.isArray(strategy.action_plan)) {
        addSubtitle(isArabic ? 'خطة العمل' : 'Action Plan');
        strategy.action_plan.forEach((step) => {
          addText(`${step.step_number || ''}. ${step.title || step}`);
          if (step.description) addText(`   ${step.description}`);
          if (step.timeline) addText(`   ${isArabic ? 'الجدول الزمني:' : 'Timeline:'} ${step.timeline}`);
        });
      }

      setExportProgress({ show: true, step: isArabic ? 'جارٍ الحفظ...' : 'Saving...', progress: 95 });

      // Save PDF
      pdf.save(filename);
      
      setExportProgress({ show: true, step: isArabic ? 'تم!' : 'Done!', progress: 100 });
      setTimeout(() => {
        setExportProgress({ show: false, step: '', progress: 0 });
        toast.success(isArabic ? "تم تنزيل PDF بنجاح" : "PDF downloaded successfully");
      }, 500);

    } catch (error) {
      console.error("Error downloading PDF:", error);
      setExportProgress({ show: false, step: '', progress: 0 });
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
      csvRows.push(['General', 'Premium', analysis.report_type === 'premium' ? 'Yes' : 'No']);
      
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
      await api.post(`/analyses/${analysis.id}/upgrade-premium`);
      
      await refreshUser();
      
      toast.success(analysis.report_language === 'arabic' ? 'تمت الترقية بنجاح!' : 'Successfully upgraded!');
      
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
  const isPremium = analysis.report_type === 'premium';
  
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

        {/* Export Progress Modal */}
        <Dialog open={exportProgress.show} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md" aria-describedby="export-progress-description">
            <div className="flex flex-col items-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                <Download className="w-8 h-8 text-purple-600 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-slate-800">
                  {isArabic ? 'جارٍ إنشاء التقرير' : 'Generating Report'}
                </h3>
                <p id="export-progress-description" className="text-sm text-slate-500">{exportProgress.step}</p>
              </div>
              <div className="w-full space-y-2">
                <Progress value={exportProgress.progress} className="h-2" />
                <p className="text-xs text-center text-slate-400">{exportProgress.progress}%</p>
              </div>
              {exportProgress.progress < 100 && (
                <p className="text-xs text-slate-400 text-center">
                  {isArabic ? 'يرجى الانتظار، هذا قد يستغرق بضع ثوانٍ...' : 'Please wait, this may take a few seconds...'}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Tabbed Analysis Results */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto gap-1 bg-slate-100/80 p-1 rounded-xl mb-6">
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
            <TabsTrigger 
              value="rating" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">{isArabic ? "التقييم" : "Rating"}</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Market & Competition */}
          <TabsContent value="market" className="space-y-6">
            <LazyTabContent isLoaded={loadedTabs.market} isLoading={tabLoading.market} isArabic={isArabic} hasError={tabError.market} onRetry={() => retryTab('market')}>
            
            {tabData.market ? (
              <MarketSection data={tabData.market} isArabic={isArabic} isPremium={isPremium} onUnlock={handleUpgradeToPremium} isUnlocking={isUpgrading} />
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
              <TechnicalSection data={tabData.technical} isArabic={isArabic} isPremium={isPremium} onUnlock={handleUpgradeToPremium} isUnlocking={isUpgrading} />
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
              <StrategySection data={tabData.strategy} isArabic={isArabic} isPremium={isPremium} onUnlock={handleUpgradeToPremium} isUnlocking={isUpgrading} />
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

          {/* Tab 6: Rating */}
          <TabsContent value="rating" className="space-y-6">
            <Card className="glass-effect border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-500 to-amber-500 p-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Sparkles className="w-7 h-7" />
                  {isArabic ? "قيِّم هذا التقرير" : "Rate this Report"}
                </h2>
              </div>
              <CardContent className="p-6">
                <p className="text-slate-600 mb-6">
                  {isArabic ? "ساعدنا على التحسين بترك تقييمك وملاحظاتك." : "Help us improve by leaving your rating and feedback."}
                </p>

                <div className="flex items-center gap-4 mb-6">
                  <StarRating
                    value={rating || 0}
                    onChange={setRating}
                    disabled={!canRate}
                    size={32}
                  />
                  <span className="text-lg font-semibold text-slate-700">
                    {rating ? `${rating}/5` : (isArabic ? "بدون تقييم" : "No rating")}
                  </span>
                </div>

                <div className="space-y-4">
                  <Textarea
                    placeholder={isArabic ? "اكتب ملاحظاتك هنا (اختياري)" : "Write your feedback here (optional)"}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    disabled={!canRate}
                    className="min-h-[120px]"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveRating}
                      disabled={!canRate || savingRating}
                      className="gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
                    >
                      {savingRating ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ التقييم" : "Save Rating")}
                    </Button>
                  </div>
                </div>

                {!canRate && rating != null && (
                  <p className="text-sm text-slate-500 mt-4 text-center">
                    {isArabic ? "عرض تقييم المالك." : "Viewing owner's rating."}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>



        {/* Floating AI Assistant - Locked for Free Reports */}
        <FloatingAIAssistant 
          analysis={analysis} 
          isArabic={isArabic}
          isLocked={!isPremium}
          onUnlock={handleUpgradeToPremium}
          onRegenerate={async (chatContext) => {
            const params = new URLSearchParams({
              regenerate: analysis.id,
              context: encodeURIComponent(chatContext.substring(0, 2000))
            });
            navigate(createPageUrl(`NewAnalysis?${params.toString()}`));
          }}
        />
      </div>
    </div>
  );
}