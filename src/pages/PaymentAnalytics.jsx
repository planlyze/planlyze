import React, { useState, useEffect } from "react";
import { auth, Analysis, Payment, User, Transaction } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  AlertCircle,
  Users,
  Activity,
  Sparkles,
  BarChart2,
} from "lucide-react";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  parseISO,
  eachDayOfInterval,
} from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasPermission, PERMISSIONS } from "@/components/utils/permissions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import PageLoader from "@/components/common/PageLoader";
import PageHeader from "@/components/common/PageHeader";

const COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#6366f1",
];

export default function PaymentAnalytics() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t, i18n } = useTranslation();
  const [currentUser, setCurrentUser] = useState(null);

  // Date filters with presets
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const setDateRange = (days) => {
    setStartDate(format(subDays(new Date(), days), "yyyy-MM-dd"));
    setEndDate(format(new Date(), "yyyy-MM-dd"));
  };

  useEffect(() => {
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();
      setCurrentUser(user);
      if (!hasPermission(user, PERMISSIONS.VIEW_PAYMENTS)) {
        navigate(createPageUrl("Dashboard"));
        toast.error("You don't have permission to view payment analytics");
        return;
      }

      const [txList, paymentsList, usersList, analysesList] = await Promise.all(
        [Transaction.list(), Payment.list(), User.list(), Analysis.list()]
      );

      setTransactions(Array.isArray(txList) ? txList : []);
      setPayments(Array.isArray(paymentsList) ? paymentsList : []);
      setUsers(Array.isArray(usersList) ? usersList : []);
      setAnalyses(
        (Array.isArray(analysesList) ? analysesList : []).filter(
          (a) => a.is_deleted !== true
        )
      );
    } catch (error) {
      console.error("Error loading data:", error);
      window.location.href = "/login";
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data by date range
  const filterByDateRange = (items) => {
    const start = startOfDay(parseISO(startDate));
    const end = endOfDay(parseISO(endDate));

    return items.filter((item) => {
      const itemDate = parseISO(item.created_at);
      return itemDate >= start && itemDate <= end;
    });
  };

  const filteredTransactions = filterByDateRange(
    transactions.filter(
      (t) => t.type === "purchase" && t.status === "completed"
    )
  );
  const filteredPayments = filterByDateRange(payments);
  const filteredUsers = filterByDateRange(users);
  const filteredAnalyses = filterByDateRange(analyses);
  const filteredCreditUsage = filterByDateRange(
    transactions.filter((t) => t.type === "usage")
  );

  // Total revenue
  const totalRevenue = filteredTransactions.reduce(
    (sum, t) => sum + (t.amount_usd || 0),
    0
  );
  const totalCreditsUsed = filteredCreditUsage.reduce(
    (sum, t) => sum + Math.abs(t.credits || 0),
    0
  );

  // Revenue over time
  const revenueOverTime = (() => {
    const dailyRevenue = {};
    filteredTransactions.forEach((tx) => {
      const date = format(parseISO(tx.created_at), "MMM d");
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (tx.amount_usd || 0);
    });
    return Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  })();

  // Payment method breakdown
  const paymentMethodData = (() => {
    const methods = {};
    filteredPayments.forEach((p) => {
      const method = p.payment_method || "Unknown";
      methods[method] = (methods[method] || 0) + 1;
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  })();

  // Package popularity
  const packageData = (() => {
    const packages = {};
    filteredTransactions.forEach((tx) => {
      const pkg = tx.package_type || "Unknown";
      packages[pkg] = (packages[pkg] || 0) + 1;
    });
    return Object.entries(packages).map(([name, value]) => ({ name, value }));
  })();

  // Payment success/failure rates
  const paymentStatusData = (() => {
    const statuses = { approved: 0, pending: 0, rejected: 0 };
    filteredPayments.forEach((p) => {
      if (p.status in statuses) {
        statuses[p.status]++;
      }
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  })();

  // Top users by revenue
  const topUsers = (() => {
    const userRevenue = {};
    filteredTransactions.forEach((tx) => {
      const email = tx.user_email;
      userRevenue[email] = (userRevenue[email] || 0) + (tx.amount_usd || 0);
    });

    return Object.entries(userRevenue)
      .map(([email, revenue]) => {
        const user = users.find((u) => u.email === email);
        return {
          email,
          name: user?.full_name || email,
          revenue,
          transactions: filteredTransactions.filter(
            (t) => t.user_email === email
          ).length,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  })();

  // User Growth Over Time
  const userGrowthData = (() => {
    const start = startOfDay(parseISO(startDate));
    const end = endOfDay(parseISO(endDate));
    const days = eachDayOfInterval({ start, end });

    return days.map((day) => {
      const dayStr = format(day, "MMM d");
      const usersUpToDay = users.filter(
        (u) => parseISO(u.created_at) <= day
      ).length;
      const newUsersOnDay = users.filter((u) => {
        const created = parseISO(u.created_at);
        return format(created, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
      }).length;

      return { date: dayStr, total: usersUpToDay, new: newUsersOnDay };
    });
  })();

  // Credit Usage Trends
  const creditUsageTrends = (() => {
    const start = startOfDay(parseISO(startDate));
    const end = endOfDay(parseISO(endDate));
    const days = eachDayOfInterval({ start, end });

    return days.map((day) => {
      const dayStr = format(day, "MMM d");
      const usageOnDay = transactions
        .filter((t) => {
          if (t.type !== "usage") return false;
          const txDate = parseISO(t.created_at);
          return format(txDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
        })
        .reduce((sum, t) => sum + Math.abs(t.credits || 0), 0);

      const purchaseOnDay = transactions
        .filter((t) => {
          if (t.type !== "purchase" || t.status !== "completed") return false;
          const txDate = parseISO(t.created_at);
          return format(txDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
        })
        .reduce((sum, t) => sum + (t.credits || 0), 0);

      return { date: dayStr, used: usageOnDay, purchased: purchaseOnDay };
    });
  })();

  // Analysis Type Breakdown
  const analysisTypeData = (() => {
    const types = {
      Premium: filteredAnalyses.filter((a) => a.is_premium === true).length,
      Free: filteredAnalyses.filter((a) => a.is_premium !== true).length,
    };

    return Object.entries(types)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  })();

  // Analysis by Industry
  const industryData = (() => {
    const industries = {};
    filteredAnalyses.forEach((a) => {
      const industry = a.industry || a.custom_industry || "Other";
      industries[industry] = (industries[industry] || 0) + 1;
    });

    return Object.entries(industries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  })();

  // Analysis by Status
  const statusData = (() => {
    const statuses = {};
    filteredAnalyses.forEach((a) => {
      const status = a.status || "draft";
      statuses[status] = (statuses[status] || 0) + 1;
    });

    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  })();

  // Stats
  const totalTransactions = filteredTransactions.length;
  const avgTransactionValue =
    totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const approvedPayments = filteredPayments.filter(
    (p) => p.status === "approved"
  ).length;
  const totalPaymentRequests = filteredPayments.length;
  const approvalRate =
    totalPaymentRequests > 0
      ? (approvedPayments / totalPaymentRequests) * 100
      : 0;

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
        {/* Header */}
        <div className="flex items-center gap-4">
          <PageHeader
            title="Analytics Dashboard"
            description="Comprehensive insights into revenue, user growth, and platform usage"
            icon={BarChart2}
          />
        </div>

        {/* Date Range Filter */}
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge
                  onClick={() => setDateRange(7)}
                  className="cursor-pointer hover:bg-purple-700"
                  variant="default"
                >
                  Last 7 Days
                </Badge>
                <Badge
                  onClick={() => setDateRange(30)}
                  className="cursor-pointer hover:bg-purple-700"
                  variant="default"
                >
                  Last 30 Days
                </Badge>
                <Badge
                  onClick={() => setDateRange(90)}
                  className="cursor-pointer hover:bg-purple-700"
                  variant="default"
                >
                  Last 90 Days
                </Badge>
                <Badge
                  onClick={() => {
                    setStartDate(
                      format(
                        new Date(new Date().getFullYear(), 0, 1),
                        "yyyy-MM-dd"
                      )
                    );
                    setEndDate(format(new Date(), "yyyy-MM-dd"));
                  }}
                  className="cursor-pointer hover:bg-purple-700"
                  variant="default"
                >
                  This Year
                </Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Revenue
                </CardTitle>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {totalTransactions} transactions
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">
                  New Users
                </CardTitle>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {filteredUsers.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">in selected period</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Credits Used
                </CardTitle>
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {totalCreditsUsed}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {filteredAnalyses.length} analyses
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Premium Reports
                </CardTitle>
                <Sparkles className="w-5 h-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {filteredAnalyses.filter((a) => a.is_premium).length}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {filteredAnalyses.length > 0
                  ? `${(
                      (filteredAnalyses.filter((a) => a.is_premium).length /
                        filteredAnalyses.length) *
                      100
                    ).toFixed(1)}%`
                  : "0%"}{" "}
                of total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Growth */}
        <Card className="border-2 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  name="Total Users"
                />
                <Line
                  type="monotone"
                  dataKey="new"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="New Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Credit Usage Trends */}
        <Card className="border-2 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Credit Usage Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={creditUsageTrends}>
                <defs>
                  <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient
                    id="colorPurchased"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="purchased"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorPurchased)"
                  name="Credits Purchased"
                />
                <Area
                  type="monotone"
                  dataKey="used"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorUsed)"
                  name="Credits Used"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Over Time */}
        <Card className="border-2 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Revenue Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Payment Method Breakdown */}
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Package Popularity */}
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Popular Packages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={packageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8b5cf6" name="Purchases" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Analysis Type Breakdown */}
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Analysis Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analysisTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analysisTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.name === "Premium" ? "#8b5cf6" : "#06b6d4"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Industry Distribution */}
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Top Industries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={industryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" name="Analyses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Analysis Status */}
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Analysis Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#06b6d4" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Users */}
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top Users by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topUsers.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No data available
                  </p>
                ) : (
                  topUsers.map((user, index) => (
                    <div
                      key={user.email}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                              ? "bg-slate-400"
                              : index === 2
                              ? "bg-orange-600"
                              : "bg-slate-300"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {user.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ${user.revenue.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user.transactions} txn
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
