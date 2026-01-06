import React, { useState, useEffect } from "react";
import { auth, Analysis, Transaction, SystemSettings } from "@/api/client";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl, safeFormatDate } from "@/utils";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  Eye,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import OnboardingGuide, { OnboardingTrigger } from "@/components/onboarding/OnboardingGuide";
import PageLoader from "@/components/common/PageLoader";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [premiumAnalyses, setPremiumAnalyses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [premiumReportCost, setPremiumReportCost] = useState(1);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const user = await auth.me();
        setCurrentUser(user);
        await loadAnalyses(user.email);
        
        try {
          const response = await SystemSettings.get('premium_report_cost');
          const cost = parseInt(response?.data?.value || response?.value || '1', 10);
          setPremiumReportCost(cost >= 1 ? cost : 1);
        } catch (e) {
          console.error("Failed to fetch premium report cost:", e);
        }
      } catch (error) {
        window.location.href = "/login";
      }
    };
    checkAuthAndLoadData();
  }, [navigate]);

  const loadAnalyses = async (userEmail) => {
    setIsLoading(true);
    try {
      const data = await Analysis.filter({ user_email: userEmail });
      setAnalyses(data.filter(a => a.is_deleted !== true));


      setPremiumAnalyses(data.filter(a => a.is_deleted !== true && a.is_premium === true));
      
      const txs = await Transaction.filter({ user_email: userEmail });
      setTransactions(txs.slice(0, 5));
    } catch (error) {
      console.error("Error loading analyses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isArabic = currentUser?.preferred_language === 'arabic' || currentUser?.language === 'ar';

  if (isLoading || !currentUser) {
    return <PageLoader isArabic={isArabic} />;
  }

  const creditsUsed = premiumAnalyses.length * premiumReportCost;
  const creditWord = isArabic ? "رصيد" : (premiumReportCost === 1 ? "credit" : "credits");
  
  const stats = [
    {
      title: isArabic ? "الأرصدة المتبقية" : "Credits Available",
      value: currentUser?.credits || 0,
      icon: Wallet,
      color: "orange",
      bgGradient: "from-orange-500 to-orange-600",
      tooltip: isArabic 
        ? `عدد الأرصدة المتاحة لديك. كل تحليل متميز يستهلك ${premiumReportCost} ${creditWord}.` 
        : `The number of credits you have available. Each premium analysis uses ${premiumReportCost} ${creditWord}.`
    },
    {
      title: isArabic ? "إجمالي التقارير" : "Total Reports",
      value: analyses.length,
      icon: FileText,
      color: "purple",
      bgGradient: "from-purple-500 to-purple-600",
      tooltip: isArabic 
        ? "إجمالي عدد التقارير التي أنشأتها، بما في ذلك التقارير المجانية والمتميزة." 
        : "Total number of reports you've created, including both free and premium analyses."
    },
    {
      title: isArabic ? "الأرصدة المستخدمة" : "Credits Used",
      value: creditsUsed,
      icon: TrendingUp,
      color: "gray",
      bgGradient: "from-gray-600 to-gray-700",
      tooltip: isArabic 
        ? `عدد الأرصدة التي استخدمتها للتحليلات المتميزة (${premiumAnalyses.length} تقرير × ${premiumReportCost} رصيد).` 
        : `Number of credits you've used for premium analyses (${premiumAnalyses.length} reports × ${premiumReportCost} ${creditWord}).`
    }
  ];

  const recentAnalyses = analyses.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8" dir={isArabic ? 'rtl' : 'ltr'}>
      <OnboardingGuide />
      <motion.div 
        className="max-w-7xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className={`${isArabic ? 'text-right' : 'text-left'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {isArabic ? 'مرحباً،' : 'Welcome back,'}{' '}
                <span className="text-orange-500">{currentUser?.full_name?.split(' ')[0] || 'User'}</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {isArabic ? 'إليك نظرة عامة على نشاطك.' : "Here's an overview of your activity."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <OnboardingTrigger className="hidden md:flex" />
              <Link to={createPageUrl("NewAnalysis")}>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105">
                  <Plus className="w-5 h-5 mr-2" />
                  {isArabic ? "تحليل جديد" : "New Analysis"}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        <TooltipProvider>
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800">
                  <div className={`h-1 bg-gradient-to-r ${stat.bgGradient}`}></div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-center">
                              <p className="text-sm">{stat.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      </div>
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center shadow-lg`}>
                        <stat.icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TooltipProvider>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 to-orange-500 text-white overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">
                      {isArabic ? "جاهز لتحليل فكرتك؟" : "Ready to analyze your idea?"}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {isArabic 
                        ? "احصل على تقرير شامل مع تحليل السوق والمنافسين واستراتيجية العمل." 
                        : "Get a comprehensive report with market analysis, competitors, and business strategy."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-6 text-white/80">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      <span className="text-sm">{isArabic ? "تحليل السوق" : "Market Analysis"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      <span className="text-sm">{isArabic ? "خطة العمل" : "Business Plan"}</span>
                    </div>
                  </div>
                  <Link to={createPageUrl("NewAnalysis")}>
                    <Button className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-6 rounded-full shadow-lg hover:shadow-xl transition-all">
                      {isArabic ? "ابدأ الآن" : "Start Now"}
                      <ArrowRight className={`w-4 h-4 ml-2 ${isArabic ? 'rotate-180' : ''}`} />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg h-full bg-white dark:bg-gray-800">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    {isArabic ? "أحدث التقارير" : "Recent Reports"}
                  </CardTitle>
                  <Link to={createPageUrl("Reports")}>
                    <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30">
                      {isArabic ? "عرض الكل" : "View All"}
                      <ArrowRight className={`w-4 h-4 ml-1 ${isArabic ? 'rotate-180' : ''}`} />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {recentAnalyses.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {isArabic ? "لا توجد تقارير بعد" : "No Reports Yet"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {isArabic ? "ابدأ أول تحليل لترى النتائج هنا" : "Start your first analysis to see results here"}
                    </p>
                    <Link to={createPageUrl("NewAnalysis")}>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full">
                        <Plus className="w-4 h-4 mr-2" />
                        {isArabic ? "ابدأ أول تحليل" : "Start First Analysis"}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {recentAnalyses.map((analysis, index) => (
                        <motion.div
                          key={analysis.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {analysis.is_premium && (
                                  <Sparkles className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                )}
                                <h4 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {analysis.business_idea}
                                </h4>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {safeFormatDate(analysis.created_at)}
                              </p>
                            </div>
                            {analysis.status === 'completed' && (
                              <Link to={createPageUrl(`AnalysisResult?id=${analysis.id}`)}>
                                <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg h-full bg-white dark:bg-gray-800">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    {isArabic ? "أحدث المعاملات" : "Recent Transactions"}
                  </CardTitle>
                  <Link to={createPageUrl("Credits")}>
                    <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30">
                      {isArabic ? "عرض الكل" : "View All"}
                      <ArrowRight className={`w-4 h-4 ml-1 ${isArabic ? 'rotate-180' : ''}`} />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {transactions.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {isArabic ? "لا توجد معاملات بعد" : "No Transactions Yet"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {isArabic ? "قم بشراء أرصدة لبدء التحليل" : "Purchase credits to start analyzing"}
                    </p>
                    <Link to={createPageUrl("Credits")}>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full">
                        <Wallet className="w-4 h-4 mr-2" />
                        {isArabic ? "شراء أرصدة" : "Buy Credits"}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {transactions.map((tx, index) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.type === 'credit' || tx.type === 'purchase' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            }`}>
                              {tx.type === 'credit' || tx.type === 'purchase' ? '+' : '-'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {tx.description || tx.type}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {safeFormatDate(tx.created_at)}
                              </p>
                            </div>
                          </div>
                          <span className={`font-bold ${
                            tx.type === 'credit' || tx.type === 'purchase' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {tx.type === 'credit' || tx.type === 'purchase' ? '+' : '-'}{tx.amount}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
