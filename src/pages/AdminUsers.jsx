import React, { useState, useEffect } from "react";
import { auth, User, Analysis, Role } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, Mail, Calendar, FileText, SortDesc, SortAsc, 
  CreditCard, UserCheck, Tag, Receipt, History, Eye, Shield
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { hasPermission, PERMISSIONS } from "@/components/utils/permissions";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/common/PageHeader";
import FilterBar, { SearchInput, SELECT_TRIGGER_CLASS } from "@/components/common/FilterBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminUsers() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [analysisCount, setAnalysisCount] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");

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
      const usersList = Array.isArray(usersResp) ? usersResp : (usersResp?.data || usersResp?.items || []);
      setUsers(usersList);

      const rolesResp = await Role.list();
      const rolesList = Array.isArray(rolesResp) ? rolesResp : (rolesResp?.data || rolesResp?.items || []);
      setRoles(rolesList);

      const allAnalyses = await Analysis.listAll();
      const countMap = {};
      allAnalyses.forEach(a => {
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
    if (typeof user.role === 'object' && user.role?.name) {
      return user.role.name;
    }
    if (user.role_id) {
      const role = roles.find(r => r.id === user.role_id);
      return role?.name || 'user';
    }
    return user.role || 'user';
  };

  const getRoleColor = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'super_admin':
      case 'owner':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery.trim() || 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const roleName = getRoleName(u);
    const matchesRole = roleFilter === "all" || roleName === roleFilter;

    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  const handleAction = (action, user) => {
    const email = encodeURIComponent(user.email);
    switch (action) {
      case 'transactions':
        navigate(createPageUrl("AdminCredits") + `?tab=transactions&user=${email}`);
        break;
      case 'reports':
        navigate(createPageUrl("AdminReports") + `?user=${email}`);
        break;
      case 'profile':
        navigate(createPageUrl("UserProfile") + `?user=${email}`);
        break;
      case 'referrals':
        navigate(createPageUrl("AdminReferrals") + `?user=${email}`);
        break;
      case 'discounts':
        navigate(createPageUrl("AdminDiscounts") + `?user=${email}`);
        break;
      case 'payment_requests':
        navigate(createPageUrl("AdminPayments") + `?user=${email}`);
        break;
      case 'payment_history':
        navigate(createPageUrl("AdminCredits") + `?tab=transactions&user=${email}&type=purchase`);
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 p-6" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="All Users"
          description={`${filteredUsers.length} users`}
          backUrl={createPageUrl("Dashboard")}
          icon={Users}
          isArabic={isArabic}
        />

        <FilterBar className="mb-6">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            isArabic={isArabic}
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className={`w-[160px] ${SELECT_TRIGGER_CLASS}`}>
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map(role => (
                <SelectItem key={role.id} value={role.name}>
                  {role.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
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

        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">No users found</h3>
              <p className="text-slate-500 dark:text-slate-500">Try adjusting your search or filters</p>
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
                            {(user.display_name || user.full_name || user.email)?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                {user.display_name || user.full_name || 'No Name'}
                              </h3>
                              <Badge className={getRoleColor(roleName)}>
                                <Shield className="w-3 h-3 mr-1" />
                                {roleName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            Joined: {format(new Date(user.created_at), "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4 text-slate-400" />
                            {totalAnalysis} {totalAnalysis === 1 ? 'report' : 'reports'}
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4 text-slate-400" />
                            {user.credits || 0} credits
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Eye className="w-4 h-4" />
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleAction('profile', user)}>
                              <UserCheck className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('reports', user)}>
                              <FileText className="w-4 h-4 mr-2" />
                              View Reports
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('transactions', user)}>
                              <History className="w-4 h-4 mr-2" />
                              View Transactions
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('referrals', user)}>
                              <Users className="w-4 h-4 mr-2" />
                              View Referrals
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('discounts', user)}>
                              <Tag className="w-4 h-4 mr-2" />
                              View Discounts
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('payment_requests', user)}>
                              <Receipt className="w-4 h-4 mr-2" />
                              Payment Requests
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('payment_history', user)}>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Payment History
                            </DropdownMenuItem>
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
    </div>
  );
}
