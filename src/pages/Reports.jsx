import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { auth, Analysis } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageLoader from "@/components/common/PageLoader";
import EmptyList from "@/components/common/EmptyList";
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
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Eye,
  Plus,
  FileText,
  Clock,
  AlertCircle,
  Trash2,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { canAccessAdmin } from "@/components/utils/permissions";
import PageHeader from "@/components/common/PageHeader";
import FilterBar, {
  FILTER_CARD_CLASS,
  SEARCH_INPUT_CLASS,
  SEARCH_WRAPPER_CLASS,
  SearchInput,
  SELECT_TRIGGER_CLASS,
} from "@/components/common/FilterBar";

function ReportCard({
  analysis,
  isOwnReports,
  viewingEmail,
  isDeleting,
  onDelete,
  isArabic,
}) {
  return (
    <Card className="border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden bg-card rounded-lg bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <h3 className="text-lg font-bold text-foreground line-clamp-2">
              {analysis.business_idea}
            </h3>

            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="w-4 h-4" />
              <span>
                {analysis.created_at
                  ? format(
                      new Date(analysis.created_at),
                      "MMM d, yyyy 'at' h:mm a"
                    )
                  : ""}
              </span>
            </div>

            {/* {analysis.country && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4" />
                <span>{analysis.country}</span>
              </div>
            )} */}

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {analysis.is_premium ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  Premium
                </span>
              ) : (
                <span className="text-muted-foreground text-sm font-medium">
                  Free
                </span>
              )}
              {analysis.voucher && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full">
                  {isArabic ? 'مرتبط بـ' : 'Linked to'} {analysis.voucher.ngo_name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isOwnReports && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(analysis)}
                disabled={isDeleting}
                className="h-10 w-10  rounded-lg"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 " />
                ) : (
                  <Trash2 className="w-4 h-4 " />
                )}
              </Button>
            )}

            {analysis.status === "completed" ? (
              <Link
                to={createPageUrl(
                  `AnalysisResult?id=${analysis.id}${
                    !isOwnReports && viewingEmail
                      ? `&user=${encodeURIComponent(viewingEmail)}`
                      : ""
                  }`
                )}
              >
                <Button className="gap-2 h-10 px-5 gradient-primary text-white rounded-lg">
                  <Eye className="w-4 h-4" />
                  {isArabic ? "عرض التقرير" : "View Report"}
                </Button>
              </Link>
            ) : analysis.status === "analyzing" ? (
              <Button
                variant="outline"
                disabled
                className="gap-2 h-10 px-5 rounded-lg"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                {isArabic ? "قيد المعالجة..." : "Processing..."}
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled
                className="gap-2 h-10 px-5 rounded-lg text-muted-foreground"
              >
                <AlertCircle className="w-4 h-4" />
                {analysis.status === "failed"
                  ? isArabic
                    ? "فشل"
                    : "Failed"
                  : isArabic
                  ? "مسودة"
                  : "Draft"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState(null);

  const isArabic =
    i18n.language === "ar" || currentUser?.preferred_language === "arabic";

  const loadAnalyses = async (
    userEmail,
    admin,
    myEmailParam,
    selectedUserPresent = false
  ) => {
    setIsLoading(true);
    try {
      let fetchedAnalyses = [];
      if (admin && selectedUserPresent) {
        const { data } = await Analysis.list();
        fetchedAnalyses = data?.items || [];
      } else {
        const data = await Analysis.filter(
          { user_email: userEmail },
          "-created_at"
        );
        fetchedAnalyses = data;
      }
      setAnalyses(fetchedAnalyses.filter((a) => a.is_deleted !== true));
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

        await loadAnalyses(
          emailToLoad,
          userIsAdmin,
          user.email,
          selectedUserPresent
        );
      } catch (error) {
        window.location.href = "/login";
      }
    };
    checkAuthAndLoadData();
  }, []);

  const handleDelete = (analysis) => {
    setAnalysisToDelete(analysis);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!analysisToDelete) return;
    setDeletingId(analysisToDelete.id);
    setDeleteDialogOpen(false);
    try {
      await Analysis.update(analysisToDelete.id, {
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      });
      toast.success(t("reports.deleteSuccess"));
      await loadAnalyses(viewingEmail, isAdmin, myEmail, hasSelectedUser);
    } catch (e) {
      console.error("Error deleting analysis:", e);
      toast.error(t("reports.deleteFailed"));
    } finally {
      setDeletingId(null);
      setAnalysisToDelete(null);
    }
  };

  const filteredAnalyses = analyses.filter((analysis) => {
    const matchesSearch = analysis.business_idea
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesPremium =
      premiumFilter === "all" ||
      (premiumFilter === "premium" && analysis.is_premium) ||
      (premiumFilter === "free" && !analysis.is_premium);
    return matchesSearch && matchesPremium;
  });

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <PageHeader
          title={
            viewingEmail && !isOwnReports
              ? `${t("reports.titleOther")} - ${viewingEmail}`
              : t("reports.title")
          }
          description={t("reports.subtitle")}
          // backUrl={createPageUrl("Dashboard")}
          icon={FileText}
          isArabic={isArabic}
          actions={
            <Link to={createPageUrl("NewAnalysis")}>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105">
                <Plus className="w-4 h-4" />
                {t("reports.newAnalysis")}
              </Button>
            </Link>
          }
        />

        <FilterBar>
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("reports.searchPlaceholder")}
            isArabic={isArabic}
          />
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={premiumFilter} onValueChange={setPremiumFilter}>
              <SelectTrigger className={`w-40 ${SELECT_TRIGGER_CLASS}`}>
                <SelectValue placeholder={t("reports.filterByType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("reports.all")}</SelectItem>
                <SelectItem value="premium">{t("reports.premium")}</SelectItem>
                <SelectItem value="free">{t("reports.free")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FilterBar>

        {isLoading ? (
          <PageLoader isArabic={isArabic} />
        ) : filteredAnalyses.length === 0 ? (
          <EmptyList
            title={
              searchQuery || premiumFilter !== "all"
                ? t("reports.noMatchingReports")
                : t("reports.noReportsYet")
            }
            description={
              searchQuery || premiumFilter !== "all"
                ? t("reports.adjustFilters")
                : t("reports.startFirstAnalysis")
            }
            icon={FileText}
            isArabic={isArabic}
            actionIcon={Plus}
            navigationPath="NewAnalysis"
            actionTitle={
              !searchQuery && premiumFilter === "all"
                ? t("reports.createFirstAnalysis")
                : null
            }           
          />
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredAnalyses.map((analysis, index) => (
                <motion.div
                  key={analysis.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <ReportCard
                    analysis={analysis}
                    isOwnReports={isOwnReports}
                    viewingEmail={viewingEmail}
                    isDeleting={deletingId === analysis.id}
                    onDelete={handleDelete}
                    isArabic={isArabic}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={isArabic ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isArabic ? "text-right" : ""}>
              {isArabic ? "تأكيد الحذف" : "Confirm Delete"}
            </AlertDialogTitle>
            <AlertDialogDescription className={isArabic ? "text-right" : ""}>
              {isArabic
                ? "هل أنت متأكد من حذف هذا التقرير؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure you want to delete this report? This action cannot be undone."}
              {analysisToDelete && (
                <span className="block mt-2 font-medium text-foreground">
                  "{analysisToDelete.business_idea?.substring(0, 100)}
                  {analysisToDelete.business_idea?.length > 100 ? "..." : ""}"
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter
            className={isArabic ? "flex-row-reverse gap-2" : ""}
          >
            <AlertDialogCancel onClick={() => setAnalysisToDelete(null)}>
              {isArabic ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isArabic ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
