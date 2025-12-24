import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { auth, api, Analysis, Payment, User, AI } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Eye,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Trash2,
  Loader2,
  MapPin,
  Sparkles,
  Download,
  Share2,
  Globe
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import StarRating from "@/components/common/StarRating";
import { motion, AnimatePresence } from "framer-motion";
import ShareReportModal from "@/components/sharing/ShareReportModal";
import { canAccessAdmin } from "@/components/utils/permissions";

const statusIcons = {
  draft: Clock,
  analyzing: AlertCircle,
  completed: CheckCircle2,
  failed: AlertCircle
};

const statusColors = {
  draft: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
  analyzing: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
  completed: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300",
  failed: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
};

export default function Reports() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [premiumFilter, setPremiumFilter] = useState("all");
  const [viewingEmail, setViewingEmail] = useState(null);
  const [isOwnReports, setIsOwnReports] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myEmail, setMyEmail] = useState(null);
  const [hasSelectedUser, setHasSelectedUser] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedAnalysisForShare, setSelectedAnalysisForShare] = useState(null);
  const [exportingId, setExportingId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState(null);
  
  const isArabic = i18n.language === 'ar' || currentUser?.preferred_language === 'arabic';

  // Function to load analyses, now capable of handling admin views
  const loadAnalyses = async (userEmail, admin, myEmailParam, selectedUserPresent = false) => {
    setIsLoading(true);
    try {
      let fetchedAnalyses = [];
      // If current user is an admin and a specific user was selected in the URL, always fetch via admin function
      if (admin && selectedUserPresent) {
        const { data } = await Analysis.list();        
        fetchedAnalyses = data?.items || [];
      } else {
        // Otherwise, load reports using standard filter for the specified user email
        const data = await Analysis.filter({ user_email: userEmail }, "-created_at");
        fetchedAnalyses = data;
      }
      // Exclude soft-deleted analyses from the fetched list
      setAnalyses(fetchedAnalyses.filter(a => a.is_deleted !== true));
    } catch (error) {
      console.error("Error loading analyses:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const user = await auth.me();
        setCurrentUser(user);
        const userIsAdmin = canAccessAdmin(user);
        setIsAdmin(userIsAdmin);
        setMyEmail(user.email);

        const urlParams = new URLSearchParams(window.location.search);
        const userParam = urlParams.get("user");
        const selectedUserPresent = userIsAdmin && !!userParam;
        setHasSelectedUser(selectedUserPresent);

        const emailToLoad = selectedUserPresent ? userParam.trim() : user.email;
        setViewingEmail(emailToLoad);
        setIsOwnReports(emailToLoad === user.email);

        await loadAnalyses(emailToLoad, userIsAdmin, user.email, selectedUserPresent);
      } catch (error) {
        window.location.href = "/login";
      }
    };
    checkAuthAndLoadData();
  }, [navigate]);

  const handleDelete = (analysis) => {
    setAnalysisToDelete(analysis);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!analysisToDelete) return;
    setDeletingId(analysisToDelete.id);
    setDeleteDialogOpen(false);
    try {
      await Analysis.update(analysisToDelete.id, { is_deleted: true, deleted_at: new Date().toISOString() });
      toast.success(t('reports.deleteSuccess'));
      await loadAnalyses(viewingEmail, isAdmin, myEmail, hasSelectedUser);
    } catch (e) {
      console.error("Error deleting analysis:", e);
      toast.error(t('reports.deleteFailed'));
    } finally {
      setDeletingId(null);
      setAnalysisToDelete(null);
    }
  };

  const handleExport = async (analysis) => {
    setExportingId(analysis.id);
    try {
      const reportData = await api.get("/analyses/export");
      const blob = new Blob([Buffer.from(data.pdf, 'base64')], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${analysis.business_idea.substring(0, 30)}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success(t('reports.exportSuccess'));
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error(t('reports.exportFailed'));
    } finally {
      setExportingId(null);
    }
  };

  const handleShare = (analysis) => {
    setSelectedAnalysisForShare(analysis);
    setShareModalOpen(true);
  };

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = analysis.business_idea.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPremium = premiumFilter === "all" || 
      (premiumFilter === "premium" && analysis.is_premium) ||
      (premiumFilter === "free" && !analysis.is_premium);

    return matchesSearch && matchesPremium;
  });

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-purple-50/20 to-orange-50/10 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="shadow-md hover:shadow-xl transition-all duration-300 border-2 border-slate-300 dark:border-gray-600 hover:border-purple-500 bg-white dark:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </motion.div>
          <div className="flex-1">
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold text-orange-600 dark:text-orange-500"
            >
              {viewingEmail && !isOwnReports ? (
                `${t('reports.titleOther')} - ${viewingEmail}`
              ) : t('reports.title')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-600 dark:text-slate-400 mt-2 text-lg"
            >
              {t('reports.subtitle')}
            </motion.p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to={createPageUrl("NewAnalysis")}>
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-2xl transition-all duration-300 px-6 py-6 text-base">
                <Plus className={`w-5 h-5 ${isArabic ? 'ml-2' : 'mr-2'}`} />
                {t('reports.newAnalysis')}
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="glass-effect border-2 border-slate-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <motion.div 
                  className="flex-1"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="relative">
                    <motion.div
                      animate={{ 
                        scale: searchQuery ? [1, 1.2, 1] : 1,
                        color: searchQuery ? '#7c3aed' : '#94a3b8'
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <Search className={`w-5 h-5 absolute ${isArabic ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2`} />
                    </motion.div>
                    <Input
                      placeholder={t('reports.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`${isArabic ? 'pr-12' : 'pl-12'} h-12 border-2 border-slate-300 dark:border-gray-600 focus:border-purple-500 hover:border-purple-400 transition-all text-base bg-white dark:bg-gray-700 dark:text-white shadow-sm`}
                    />
                  </div>
                </motion.div>
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Filter className="w-5 h-5 text-purple-600" />
                  </motion.div>
                  <Select value={premiumFilter} onValueChange={setPremiumFilter}>
                    <SelectTrigger className="w-48 h-12 border-2 border-slate-300 dark:border-gray-600 hover:border-purple-500 focus:border-purple-500 transition-all text-base bg-white dark:bg-gray-700 dark:text-white shadow-sm">
                      <SelectValue placeholder={t('reports.filterByType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('reports.all')}</SelectItem>
                      <SelectItem value="premium">{t('reports.premium')}</SelectItem>
                      <SelectItem value="free">{t('reports.free')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="glass-effect border-2 border-slate-200 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-3 flex-1">
                      <Skeleton className="h-8 w-3/4 bg-slate-200 rounded-lg" />
                      <Skeleton className="h-5 w-1/2 bg-slate-200 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-7 w-24 bg-slate-200 rounded-lg" />
                      <Skeleton className="h-7 w-20 bg-slate-200 rounded-lg" />
                    </div>
                  </div>
                  <div className="flex gap-4 mb-6">
                    <Skeleton className="h-5 w-32 bg-slate-200 rounded-lg" />
                    <Skeleton className="h-5 w-28 bg-slate-200 rounded-lg" />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Skeleton className="h-11 w-28 bg-slate-200 rounded-lg" />
                    <Skeleton className="h-11 w-32 bg-slate-200 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-effect border-2 border-slate-200 dark:border-gray-700 shadow-xl overflow-hidden relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="text-center py-20 relative">
                <motion.div 
                  className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-6 shadow-lg"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <FileText className="w-12 h-12 text-purple-600" />
                </motion.div>
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-slate-800 dark:text-white mb-3"
                >
                  {searchQuery || premiumFilter !== "all" 
                    ? t('reports.noMatchingReports')
                    : t('reports.noReportsYet')}
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-600 dark:text-slate-400 text-lg mb-8 max-w-md mx-auto"
                >
                  {searchQuery || premiumFilter !== "all"
                    ? t('reports.adjustFilters')
                    : t('reports.startFirstAnalysis')
                  }
                </motion.p>
                {(!searchQuery && premiumFilter === "all") && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link to={createPageUrl("NewAnalysis")}>
                      <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg">
                        <Plus className={`w-5 h-5 ${isArabic ? 'ml-2' : 'mr-2'}`} />
                        {t('reports.createFirstAnalysis')}
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {filteredAnalyses.map((analysis, index) => {
                const StatusIcon = statusIcons[analysis.status] || AlertCircle;
                const isDeleting = deletingId === analysis.id;
                return (
                  <motion.div
                    key={analysis.id}
                    layout
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ 
                      delay: index * 0.1,
                      duration: 0.5,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ 
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <Card 
                      className="border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800 rounded-xl"
                    >
                      <CardContent className="p-6 relative">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-2">
                              {analysis.business_idea}
                            </h3>
                            
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                              <Clock className="w-4 h-4" />
                              <span>
                                {analysis.created_at ? format(new Date(analysis.created_at), "MMM d, yyyy 'at' h:mm a") : ''}
                              </span>
                            </div>
                            
                            {analysis.country && (
                              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                <MapPin className="w-4 h-4" />
                                <span>{analysis.country}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 pt-1">
                              {analysis.is_premium ? (
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                                  <Sparkles className="w-4 h-4" />
                                  Premium
                                </span>
                              ) : (
                                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                  Free
                                </span>
                              )}
                            </div>
                            
                            <div className="pt-1">
                              <Badge className={`${statusColors[analysis.status]} px-3 py-1 text-xs font-medium`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isOwnReports && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(analysis)}
                                disabled={isDeleting}
                                className="h-10 w-10 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 rounded-lg"
                              >
                                {isDeleting ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                                ) : (
                                  <Trash2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                )}
                              </Button>
                            )}
                            
                            {analysis.status === 'completed' ? (
                              <Link 
                                to={createPageUrl(
                                  `AnalysisResult?id=${analysis.id}${!isOwnReports && viewingEmail ? `&user=${encodeURIComponent(viewingEmail)}` : ''}`
                                )}
                              >
                                <Button className="gap-2 h-10 px-5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg">
                                  <Eye className="w-4 h-4" />
                                  {isArabic ? "عرض التقرير" : "View Report"}
                                </Button>
                              </Link>
                            ) : analysis.status === 'analyzing' ? (
                              <Button variant="outline" disabled className="gap-2 h-10 px-5 rounded-lg">
                                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                                {isArabic ? "قيد المعالجة..." : "Processing..."}
                              </Button>
                            ) : (
                              <Button variant="outline" disabled className="gap-2 h-10 px-5 rounded-lg text-slate-500">
                                <AlertCircle className="w-4 h-4" />
                                {analysis.status === 'failed' ? (isArabic ? 'فشل' : 'Failed') : (isArabic ? 'مسودة' : 'Draft')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {selectedAnalysisForShare && (
        <ShareReportModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedAnalysisForShare(null);
          }}
          analysisId={selectedAnalysisForShare.id}
          analysisTitle={selectedAnalysisForShare.business_idea}
          ownerEmail={selectedAnalysisForShare.created_by}
          isArabic={isArabic}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={isArabic ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isArabic ? 'text-right' : ''}>
              {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription className={isArabic ? 'text-right' : ''}>
              {isArabic 
                ? 'هل أنت متأكد من حذف هذا التقرير؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this report? This action cannot be undone.'}
              {analysisToDelete && (
                <span className="block mt-2 font-medium text-slate-700 dark:text-slate-300">
                  "{analysisToDelete.business_idea?.substring(0, 100)}{analysisToDelete.business_idea?.length > 100 ? '...' : ''}"
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isArabic ? 'flex-row-reverse gap-2' : ''}>
            <AlertDialogCancel onClick={() => setAnalysisToDelete(null)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isArabic ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
      );
      }