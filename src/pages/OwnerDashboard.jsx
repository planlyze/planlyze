import React, { useState, useEffect } from "react";
import { auth, api, Analysis, Payment, User, AI, Transaction } from "@/api/client";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, BarChart, ArrowLeft, Eye, User as UserIcon, Star, Download, ChevronLeft, ChevronRight, DollarSign, Activity, Sparkles } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { hasPermission, PERMISSIONS } from "@/components/utils/permissions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ActivityCharts from "@/components/admin/ActivityCharts";

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingReports, setIsExportingReports] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAnalyses: 0,
    totalAdmins: 0,
    avgRating: null,
    analysesPerUser: {},
    ratingsPerUser: {},
    activeUsers: 0,
    premiumAnalyses: 0,
    freeAnalyses: 0,
    totalCreditsSold: 0,
    totalRevenue: 0,
    dailyActivity: [],
    monthlySales: [],
    topCountries: [],
    recentTransactions: []
  });

  useEffect(() => {
    loadData();
  }, [currentPage, itemsPerPage, navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await auth.me();
      if (!hasPermission(currentUser, PERMISSIONS.VIEW_OWNER_DASHBOARD)) {
        navigate(createPageUrl("Dashboard"));
        toast.error("You don't have permission to view this dashboard");
        return;
      }

      const skip = (currentPage - 1) * itemsPerPage;

      // Fetch paginated users
      let userData = [];
      let userTotal = 0;
      try {
        const usersResp = await api.get('/api/users'); 
        
        // Handle axios response - data is inside response.data
        const usersData = usersResp?.data || usersResp;
        userData = usersData?.items || usersData || [];
        userTotal = usersData?.total || userData.length;
        
        if (!Array.isArray(userData)) {
          console.error("Users data is not an array, received:", typeof userData);
          userData = [];
        }
      } catch (userError) {
        console.error("Error fetching users:", userError.message || userError);
        userData = [];
      }

      // Fetch ALL analyses for stats calculation (must fetch all for accurate counts)
      let allAnalyses = [];
      try {
        const analysesResp = await Analysis.list();
        
        // Log the raw response to debug
        console.log("Raw analyses response type:", typeof analysesResp);
        console.log("Has data property:", 'data' in (analysesResp || {}));
        
        // Handle multiple possible response structures
        let analysesData;
        
        // Check if response.data exists and is not a string
        if (analysesResp?.data && typeof analysesResp.data === 'object') {
          analysesData = analysesResp.data;
        } else if (analysesResp && typeof analysesResp === 'object' && !analysesResp.data) {
          analysesData = analysesResp;
        } else {
          console.error("Unexpected analyses response structure");
          analysesData = { items: [], total: 0 };
        }
        
        // Extract items array
        if (Array.isArray(analysesData.items)) {
          allAnalyses = analysesData.items;
        } else if (Array.isArray(analysesData)) {
          allAnalyses = analysesData;
        } else {
          console.error("No items array found in analyses response");
          allAnalyses = [];
        }
        
        if (!Array.isArray(allAnalyses)) {
          console.error("Analyses data is not an array, received:", typeof allAnalyses);
          allAnalyses = [];
        }
      } catch (analysisError) {
        console.error("Error fetching analyses:", analysisError.message || analysisError);
        allAnalyses = [];
      }

      setUsers(userData);
      setTotalUsers(userTotal);

      // Filter out soft-deleted analyses for accurate counts
      const activeAnalyses = allAnalyses.filter((a) => a && a.is_deleted !== true);

      // Calculate analyses per user
      const analysesPerUser = {};
      activeAnalyses.forEach((analysis) => {
        const userEmail = (analysis.created_by || "").toLowerCase();
        if (userEmail) {
          analysesPerUser[userEmail] = (analysesPerUser[userEmail] || 0) + 1;
        }
      });

      // Calculate ratings per user
      const ratingsPerUser = {};
      activeAnalyses.forEach((analysis) => {
        if (typeof analysis.user_rating === 'number') {
          const email = (analysis.created_by || "").toLowerCase();
          if (email) {
            if (!ratingsPerUser[email]) {
              ratingsPerUser[email] = { sum: 0, count: 0 };
            }
            ratingsPerUser[email].sum += analysis.user_rating;
            ratingsPerUser[email].count += 1;
          }
        }
      });

      // Calculate overall average rating
      const allRatings = activeAnalyses.filter(a => typeof a.user_rating === 'number');
      const overallAvgRating = allRatings.length > 0 ? 
        (allRatings.reduce((sum, a) => sum + a.user_rating, 0) / allRatings.length) : null;

      // Count admins - fetch all users if needed
      let allUsersForStats = userData;
      if (userTotal > itemsPerPage) {
        try {
          const allUsersResp = await User.list();
          const allUsersData = allUsersResp?.data || allUsersResp;
          allUsersForStats = allUsersData?.items || [];
          
          if (!Array.isArray(allUsersForStats)) {
            console.error("All users data for stats is not an array");
            allUsersForStats = userData;
          }
        } catch (e) {
          console.error("Error fetching all users for stats:", e.message || e);
          allUsersForStats = userData;
        }
      }

      const adminCount = allUsersForStats.filter((u) => u && (u.role === 'admin' || u.role === 'super_admin')).length;

      // Calculate active users (users with at least one analysis or login in last 30 days)
      const thirtyDaysAgo = subDays(new Date(), 30);
      const activeUsers = allUsersForStats.filter((u) => {
        if (!u) return false;
        const hasRecentAnalysis = activeAnalyses.some(a => a.created_by === u.email && new Date(a.created_date) > thirtyDaysAgo);
        const hasRecentLogin = u.last_login && new Date(u.last_login) > thirtyDaysAgo;
        return hasRecentAnalysis || hasRecentLogin;
      }).length;

      // Calculate premium vs free analyses
      const premiumAnalyses = activeAnalyses.filter(a => a.is_premium === true).length;
      const freeAnalyses = activeAnalyses.length - premiumAnalyses;

      // Fetch all transactions for revenue calculation
      let allTransactions = [];
      try {
        const txResp = await Transaction.filter({}, "-created_date", 1000);
        allTransactions = Array.isArray(txResp) ? txResp : [];
      } catch (e) {
        console.error("Error fetching transactions:", e);
      }

      // Calculate total credits sold and revenue
      const purchaseTransactions = allTransactions.filter(tx => tx.type === 'purchase' && tx.status === 'completed');
      const totalCreditsSold = purchaseTransactions.reduce((sum, tx) => sum + (tx.credits || 0), 0);
      const totalRevenue = purchaseTransactions.reduce((sum, tx) => sum + (tx.amount_usd || 0), 0);

      // Calculate daily activity (last 7 days)
      const dailyActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = startOfDay(subDays(new Date(), i));
        const dateStr = format(date, 'MMM dd');
        const nextDay = subDays(new Date(), i - 1);
        
        const newUsers = allUsersForStats.filter(u => {
          const created = new Date(u.created_date);
          return created >= date && created < nextDay;
        }).length;

        const activeUsersDay = allUsersForStats.filter(u => {
          if (!u.last_login) return false;
          const login = new Date(u.last_login);
          return login >= date && login < nextDay;
        }).length;

        dailyActivity.push({ date: dateStr, newUsers, activeUsers: activeUsersDay });
      }

      // Calculate monthly sales (last 6 months)
      const monthlySales = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthTxs = purchaseTransactions.filter(tx => {
          const txDate = new Date(tx.created_date);
          return txDate >= monthStart && txDate <= monthEnd;
        });

        const revenue = monthTxs.reduce((sum, tx) => sum + (tx.amount_usd || 0), 0);
        const credits = monthTxs.reduce((sum, tx) => sum + (tx.credits || 0), 0);

        monthlySales.push({
          month: format(monthStart, 'MMM'),
          revenue: Math.round(revenue),
          credits
        });
      }

      // Calculate top countries
      const countryMap = {};
      allUsersForStats.forEach(u => {
        if (u && u.country) {
          countryMap[u.country] = (countryMap[u.country] || 0) + 1;
        }
      });
      const topCountries = Object.entries(countryMap)
        .map(([country, users]) => ({ country, users }))
        .sort((a, b) => b.users - a.users)
        .slice(0, 5);

      // Get recent transactions
      const recentTransactions = allTransactions.slice(0, 10);

      // Update stats
      setStats({
        totalUsers: userTotal,
        totalAnalyses: activeAnalyses.length,
        totalAdmins: adminCount,
        avgRating: overallAvgRating,
        analysesPerUser,
        ratingsPerUser,
        activeUsers,
        premiumAnalyses,
        freeAnalyses,
        totalCreditsSold,
        totalRevenue: Math.round(totalRevenue),
        dailyActivity,
        monthlySales,
        topCountries,
        recentTransactions
      });

    } catch (error) {
      console.error("Authentication error or data fetch error:", error.message || error);
      window.location.href = "/login";
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportUsers = async () => {
    setIsExporting(true);
    try {
      const usersData = await api.get("/api/users/export");
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planlyze_users_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export users. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportReports = async () => {
    setIsExportingReports(true);
    try {
      const reportsData = await api.get("/api/analyses/export");
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planlyze_reports_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export reports failed:', error);
      alert('Failed to export reports. Please try again.');
    } finally {
      setIsExportingReports(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalUsers);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const statsCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600", bgColor: "bg-blue-50", trend: null },
    { title: "Active Users (30d)", value: stats.activeUsers, icon: Activity, color: "text-emerald-600", bgColor: "bg-emerald-50", trend: null },
    { title: "Total Analyses", value: stats.totalAnalyses, icon: FileText, color: "text-purple-600", bgColor: "bg-purple-50", trend: null },
    { title: "Premium Reports", value: stats.premiumAnalyses, icon: Sparkles, color: "text-orange-600", bgColor: "bg-orange-50", trend: null },
    { title: "Total Revenue", value: `$${stats.totalRevenue}`, icon: DollarSign, color: "text-green-600", bgColor: "bg-green-50", trend: null },
    { title: "Credits Sold", value: stats.totalCreditsSold, icon: Star, color: "text-amber-600", bgColor: "bg-amber-50", trend: null },
    { title: "Avg Rating", value: stats.avgRating ? `${stats.avgRating.toFixed(2)}/5` : "—", icon: Star, color: "text-pink-600", bgColor: "bg-pink-50", trend: null },
    { title: "Admins", value: stats.totalAdmins, icon: Users, color: "text-indigo-600", bgColor: "bg-indigo-50", trend: null }
  ];

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8 bg-slate-200 rounded-lg" />
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Skeleton className="h-96 bg-slate-200 rounded-xl" />
          <Skeleton className="h-96 bg-slate-200 rounded-xl" />
        </div>
        <Skeleton className="h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600">
              Owner Dashboard
            </h1>
            <p className="text-slate-600 mt-1">Manage users and view platform-wide activity.</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportUsers}
              disabled={isExporting}
              variant="outline"
              className="gap-2">
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export Users'}
            </Button>
            <Button
              onClick={handleExportReports}
              disabled={isExportingReports}
              variant="outline"
              className="gap-2">
              <Download className="w-4 h-4" />
              {isExportingReports ? 'Exporting...' : 'Export Reports'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat) =>
            <Card key={stat.title} className="glass-effect border-2 border-slate-200 hover:border-purple-400 shadow-xl transition-all duration-300 hover:shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600">{stat.title}</CardTitle>
                <div className={`p-3 rounded-xl ${stat.bgColor} shadow-sm`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity Charts */}
        <ActivityCharts stats={stats} />

        {/* Users Table */}
        <Card className="glass-effect border-2 border-slate-200 shadow-xl transition-colors">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Users className="w-5 h-5" />
                All Users
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Show:</span>
                <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-2 md:mx-0">
              <Table className="min-w-[840px] md:min-w-0">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-slate-600 px-4 font-medium h-12 align-middle [&:has([role=checkbox])]:pr-0">
                      User
                    </TableHead>
                    <TableHead className="text-slate-600 px-4 font-medium h-12 align-middle [&:has([role=checkbox])]:pr-0">
                      Analyses Created
                    </TableHead>
                    <TableHead className="text-slate-600 px-4 font-medium h-12 align-middle [&:has([role=checkbox])]:pr-0">
                      Avg Rating
                    </TableHead>
                    <TableHead className="hidden md:table-cell text-slate-600 px-4 font-medium h-12 align-middle [&:has([role=checkbox])]:pr-0">
                      Last Login
                    </TableHead>
                    <TableHead className="hidden md:table-cell text-slate-600 px-4 font-medium h-12 align-middle [&:has([role=checkbox])]:pr-0">
                      Joined Date
                    </TableHead>
                    <TableHead className="text-slate-600 px-4 font-medium h-12 align-middle [&:has([role=checkbox])]:pr-0">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const emailKey = (user.email || "").toLowerCase();
                    const userAnalysisCount = stats.analysesPerUser[emailKey] || 0;
                    const r = stats.ratingsPerUser[emailKey];
                    const avg = r?.count ? (r.sum / r.count) : null;
                    return (
                      <TableRow key={user.id} className="align-top hover:bg-transparent">
                        <TableCell>
                          <div className="font-medium text-slate-800 break-words">{user.full_name}</div>
                          <div className="text-sm text-slate-500 break-words max-w-[220px] md:max-w-none">
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-slate-700">
                          {userAnalysisCount}
                        </TableCell>
                        <TableCell>
                          {avg ? (
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              <span className="text-sm text-slate-700">{avg.toFixed(2)}/5 ({r.count})</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {user.last_login ? format(new Date(user.last_login), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {format(new Date(user.created_date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="hidden md:flex flex-wrap gap-2">
                            <Link to={createPageUrl(`UserProfile?user=${encodeURIComponent(user.email)}`)}>
                              <Button variant="outline" size="sm" className="gap-2">
                                <UserIcon className="w-4 h-4" /> View Profile
                              </Button>
                            </Link>
                            <Link to={createPageUrl(`Reports?user=${encodeURIComponent(user.email)}`)}>
                              <Button variant="outline" size="sm" className="gap-2">
                                <Eye className="w-4 h-4" /> View Reports
                              </Button>
                            </Link>
                          </div>
                          <div className="flex md:hidden gap-2">
                            <Link to={createPageUrl(`UserProfile?user=${encodeURIComponent(user.email)}`)}>
                              <Button variant="outline" size="icon" className="h-8 w-8">
                                <UserIcon className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link to={createPageUrl(`Reports?user=${encodeURIComponent(user.email)}`)}>
                              <Button variant="outline" size="icon" className="h-8 w-8">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-slate-600">
                  Showing {startIndex + 1} to {endIndex} of {totalUsers} users
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="flex gap-1">
                    {/* Show first page */}
                    {currentPage > 2 && (
                      <>
                        <Button
                          variant={currentPage === 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          className="w-10"
                        >
                          1
                        </Button>
                        {currentPage > 3 && <span className="px-2 py-1">...</span>}
                      </>
                    )}
                    
                    {/* Show current page and neighbors */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === currentPage || 
                               page === currentPage - 1 || 
                               page === currentPage + 1;
                      })
                      .map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      ))
                    }
                    
                    {/* Show last page */}
                    {currentPage < totalPages - 1 && (
                      <>
                        {currentPage < totalPages - 2 && <span className="px-2 py-1">...</span>}
                        <Button
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          className="w-10"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
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