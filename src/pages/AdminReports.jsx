import React, { useState, useEffect } from "react";
import { auth, Analysis, User } from "@/api/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Star,
  FileText,
  Calendar,
  Mail,
  SortDesc,
  SortAsc,
  Download,
  X,
  Upload,
} from "lucide-react";
import {
  exportToExcel,
  getReportsExportColumns,
} from "@/components/utils/excelExport";
import ImportReportsDialog from "@/components/admin/ImportReportsDialog";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hasPermission, PERMISSIONS } from "@/components/utils/permissions";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import FilterBar, {
  SearchInput,
  SELECT_TRIGGER_CLASS,
} from "@/components/common/FilterBar";

export default function AdminReports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const [currentUser, setCurrentUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [userFilter, setUserFilter] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    const userParam = searchParams.get("user");
    if (userParam) {
      setUserFilter(decodeURIComponent(userParam));
    }
    loadReports();
  }, [navigate, searchParams]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();
      setCurrentUser(user);
      const roleName =
        typeof user.role === "object" ? user.role?.name : user.role || "user";
      if (!["admin", "super_admin", "owner"].includes(roleName)) {
        navigate(createPageUrl("Dashboard"));
        toast.error("You don't have permission to view reports");
        return;
      }

      const allReports = await Analysis.listAll();
      setReports(allReports);

      const allUsers = await User.list();
      const usersMap = {};
      allUsers.forEach((u) => {
        usersMap[u.email] = u;
      });
      setUsers(usersMap);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (isPremium) => {
    return isPremium
      ? "bg-purple-100 text-purple-800"
      : "bg-slate-100 text-slate-800";
  };

  const clearUserFilter = () => {
    setUserFilter("");
    searchParams.delete("user");
    setSearchParams(searchParams);
  };

  const filteredReports = reports
    .filter((r) => {
      const matchesUserFilter = !userFilter || r.user_email === userFilter;

      const matchesSearch =
        !searchQuery.trim() ||
        r.business_idea?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user_email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "premium" && r.is_premium) ||
        (typeFilter === "free" && !r.is_premium);

      const matchesRating =
        ratingFilter === "all" ||
        (ratingFilter === "rated" && r.user_rating) ||
        (ratingFilter === "unrated" && !r.user_rating);

      return matchesUserFilter && matchesSearch && matchesType && matchesRating;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  const renderStars = (rating) => {
    if (!rating)
      return <span className="text-slate-400 text-sm">No rating</span>;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`w-4 h-4 ${
              n <= rating ? "text-yellow-400" : "text-slate-300"
            }`}
            fill={n <= rating ? "rgb(250 204 21)" : "none"}
          />
        ))}
        <span className="text-sm text-slate-600 ml-1">({rating}/5)</span>
      </div>
    );
  };

  const isArabic =
    i18n.language === "ar" || currentUser?.preferred_language === "arabic";

  if (isLoading) {
    return <PageLoader isArabic={isArabic} />;
  }

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <PageHeader
          title="All Reports"
          description={`${filteredReports.length} reports`}
          // backUrl={createPageUrl("Dashboard")}
          icon={FileText}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const success = exportToExcel(
                    filteredReports,
                    getReportsExportColumns(),
                    "reports",
                    "Reports"
                  );
                  if (success) toast.success("Reports exported to Excel");
                  else toast.error("No data to export");
                }}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          }
        />

        <FilterBar className="mb-6">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by business idea or user email..."
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className={`w-[140px] ${SELECT_TRIGGER_CLASS}`}>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="free">Free</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className={`w-[140px] ${SELECT_TRIGGER_CLASS}`}>
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="rated">Has Rating</SelectItem>
              <SelectItem value="unrated">No Rating</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="gap-2 h-11"
          >
            {sortOrder === "desc" ? (
              <>
                <SortDesc className="w-4 h-4" />
                Newest First
              </>
            ) : (
              <>
                <SortAsc className="w-4 h-4" />
                Oldest First
              </>
            )}
          </Button>
        </FilterBar>

        {userFilter && (
          <div className="mb-4 flex items-center gap-2">
            <Badge
              variant="secondary"
              className="gap-2 px-3 py-1.5 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
            >
              <Mail className="w-3 h-3" />
              Showing reports for: {userFilter}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearUserFilter}
                className="h-4 w-4 p-0 ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          </div>
        )}

        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600">
                No reports found
              </h3>
              <p className="text-slate-500">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredReports.map((report) => (
              <Card
                key={report.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() =>
                  navigate(createPageUrl("AnalysisResult") + `?id=${report.id}`)
                }
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        <h3
                          className="font-medium text-slate-800 flex-1 line-clamp-2"
                          title={report.business_idea}
                        >
                          {report.business_idea || "Untitled Report"}
                        </h3>
                        <Badge className={getTypeColor(report.is_premium)}>
                          {report.is_premium ? "Premium" : "Free"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              createPageUrl("UserProfile") +
                                `?id=${users[report.user_email]?.id}`
                            );
                          }}
                          className="flex items-center gap-1 text-orange-600 hover:text-orange-700 hover:underline"
                        >
                          <Mail className="w-4 h-4" />
                          {report.user_email}
                        </button>

                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {format(
                            new Date(report.created_at),
                            "MMM d, yyyy HH:mm"
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {renderStars(report.user_rating)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ImportReportsDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={loadReports}
      />
    </div>
  );
}
