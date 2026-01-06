import React, { useState, useEffect } from "react";
import { auth, User, Analysis, Role } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  Mail,
  Calendar,
  FileText,
  SortDesc,
  SortAsc,
  CreditCard,
  UserCheck,
  Tag,
  Receipt,
  History,
  Eye,
  Shield,
  HelpCircle,
  Download,
  Upload,
} from "lucide-react";
import {
  exportToExcel,
  getUsersExportColumns,
} from "@/components/utils/excelExport";
import { format } from "date-fns";
import { toast } from "sonner";
import { hasPermission, PERMISSIONS } from "@/components/utils/permissions";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import FilterBar, {
  SearchInput,
  SELECT_TRIGGER_CLASS,
} from "@/components/common/FilterBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ImportUsersDialog from "@/components/admin/ImportUsersDialog";

export default function AdminUsers() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [analysisCount, setAnalysisCount] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [navigate]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const currentUser = await auth.me();
      if (!hasPermission(currentUser, PERMISSIONS.VIEW_USERS)) {
        navigate(createPageUrl("Dashboard"));
        toast.error("You don't have permission to view users");
        return;
      }

      const usersResp = await User.list();
      const usersList = Array.isArray(usersResp)
        ? usersResp
        : usersResp?.data || usersResp?.items || [];
      setUsers(usersList);

      const rolesResp = await Role.list();
      const rolesList = Array.isArray(rolesResp)
        ? rolesResp
        : rolesResp?.data || rolesResp?.items || [];
      setRoles(rolesList);

      const allAnalyses = await Analysis.listAll();
      const countMap = {};
      allAnalyses.forEach((a) => {
        if (a.user_email) {
          countMap[a.user_email] = (countMap[a.user_email] || 0) + 1;
        }
      });
      setAnalysisCount(countMap);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleName = (user) => {
    if (typeof user.role === "object" && user.role?.name) {
      return user.role.name;
    }
    if (user.role_id) {
      const role = roles.find((r) => r.id === user.role_id);
      return role?.name || "user";
    }
    return user.role || "user";
  };

  const getRoleColor = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case "super_admin":
      case "owner":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  const filteredUsers = users
    .filter((u) => {
      const matchesSearch =
        !searchQuery.trim() ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.display_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const roleName = getRoleName(u);
      const matchesRole = roleFilter === "all" || roleName === roleFilter;

      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  const handleAction = (action, user) => {
    const email = encodeURIComponent(user.email);
    switch (action) {
      case "transactions":
        navigate(
          createPageUrl("AdminCredits") + `?tab=transactions&user=${email}`
        );
        break;
      case "reports":
        navigate(createPageUrl("AdminReports") + `?user=${email}`);
        break;
      case "profile":
        navigate(createPageUrl("UserProfile") + `?user=${email}`);
        break;
      case "referrals":
        navigate(createPageUrl("AdminReferrals") + `?user=${email}`);
        break;
      case "discounts":
        navigate(createPageUrl("AdminDiscounts") + `?user=${email}`);
        break;
      case "payment_requests":
        navigate(createPageUrl("AdminPayments") + `?user=${email}`);
        break;
      case "payment_history":
        navigate(
          createPageUrl("AdminCredits") +
            `?tab=transactions&user=${email}&type=purchase`
        );
        break;
      default:
        break;
    }
  };

  const actionDescriptions = {
    profile:
      "View detailed user profile including contact information and account settings",
    reports: "View all business analysis reports created by this user",
    transactions:
      "View credit transaction history including purchases and usage",
    referrals: "View users referred by this person and referral rewards",
    discounts: "View discount codes used or created for this user",
    payment_requests:
      "View pending and completed payment requests from this user",
    payment_history: "View complete payment and purchase history",
  };

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
          title="All Users"
          description={`${filteredUsers.length} users`}
          // backUrl={createPageUrl("Dashboard")}
          icon={Users}
          isArabic={isArabic}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {isArabic ? "استيراد" : "Import"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const success = exportToExcel(
                    filteredUsers,
                    getUsersExportColumns(),
                    "users",
                    "Users"
                  );
                  if (success) toast.success("Users exported to Excel");
                  else toast.error("No data to export");
                }}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {isArabic ? "تصدير" : "Export"}
              </Button>
            </div>
          }
        />

        <FilterBar className="mb-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex-1 min-w-[200px]">
                <SearchInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  isArabic={isArabic}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search users by their name, display name, or email address</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger
                    className={`w-[160px] ${SELECT_TRIGGER_CLASS}`}
                  >
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Filter users by their assigned role (Admin, User, etc.)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                }
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
            </TooltipTrigger>
            <TooltipContent>
              <p>Sort users by registration date</p>
            </TooltipContent>
          </Tooltip>
        </FilterBar>

        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">
                No users found
              </h3>
              <p className="text-slate-500 dark:text-slate-500">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map((user) => {
              const roleName = getRoleName(user);
              const totalAnalysis = analysisCount[user.email] || 0;

              return (
                <Card
                  key={user.id}
                  className="hover:shadow-md transition-shadow bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {(user.display_name ||
                              user.full_name ||
                              user.email)?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                {user.display_name ||
                                  user.full_name ||
                                  "No Name"}
                              </h3>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    className={`${getRoleColor(
                                      roleName
                                    )} cursor-help`}
                                  >
                                    <Shield className="w-3 h-3 mr-1" />
                                    {roleName
                                      .replace("_", " ")
                                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    User's assigned role determines their
                                    permissions
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                Joined:{" "}
                                {format(
                                  new Date(user.created_at),
                                  "MMM d, yyyy"
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Date when the user registered on the platform
                              </p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <FileText className="w-4 h-4 text-slate-400" />
                                {totalAnalysis}{" "}
                                {totalAnalysis === 1 ? "report" : "reports"}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Total number of business analysis reports
                                created
                              </p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <CreditCard className="w-4 h-4 text-slate-400" />
                                {user.credits || 0} credits
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Available credits for generating premium reports
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                View and manage user details, reports, and
                                transactions
                              </p>
                            </TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="end" className="w-56">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuItem
                                  onClick={() => handleAction("profile", user)}
                                  className="cursor-pointer"
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  View Profile
                                  <HelpCircle className="w-3 h-3 ml-auto text-slate-400" />
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>{actionDescriptions.profile}</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuItem
                                  onClick={() => handleAction("reports", user)}
                                  className="cursor-pointer"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  View Reports
                                  <HelpCircle className="w-3 h-3 ml-auto text-slate-400" />
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>{actionDescriptions.reports}</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleAction("transactions", user)
                                  }
                                  className="cursor-pointer"
                                >
                                  <History className="w-4 h-4 mr-2" />
                                  View Transactions
                                  <HelpCircle className="w-3 h-3 ml-auto text-slate-400" />
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>{actionDescriptions.transactions}</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleAction("referrals", user)
                                  }
                                  className="cursor-pointer"
                                >
                                  <Users className="w-4 h-4 mr-2" />
                                  View Referrals
                                  <HelpCircle className="w-3 h-3 ml-auto text-slate-400" />
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>{actionDescriptions.referrals}</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleAction("discounts", user)
                                  }
                                  className="cursor-pointer"
                                >
                                  <Tag className="w-4 h-4 mr-2" />
                                  View Discounts
                                  <HelpCircle className="w-3 h-3 ml-auto text-slate-400" />
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>{actionDescriptions.discounts}</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleAction("payment_requests", user)
                                  }
                                  className="cursor-pointer"
                                >
                                  <Receipt className="w-4 h-4 mr-2" />
                                  Payment Requests
                                  <HelpCircle className="w-3 h-3 ml-auto text-slate-400" />
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>{actionDescriptions.payment_requests}</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleAction("payment_history", user)
                                  }
                                  className="cursor-pointer"
                                >
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Payment History
                                  <HelpCircle className="w-3 h-3 ml-auto text-slate-400" />
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>{actionDescriptions.payment_history}</p>
                              </TooltipContent>
                            </Tooltip>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ImportUsersDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={loadUsers}
      />
    </div>
  );
}
