import React, { useState, useEffect } from "react";
import { auth, AuditLog, ApiRequestLog, User } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ChevronLeft, ChevronRight, Download, Globe, Activity, Search } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { hasPermission, PERMISSIONS } from "@/components/utils/permissions";
import PageHeader from "@/components/common/PageHeader";
import FilterBar, { SearchInput, SELECT_TRIGGER_CLASS } from "@/components/common/FilterBar";
import { exportToExcel, getAuditLogsExportColumns } from "@/components/utils/excelExport";

export default function AuditLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [apiLogs, setApiLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("audit");
  
  const [apiSearchQuery, setApiSearchQuery] = useState("");
  const [apiMethodFilter, setApiMethodFilter] = useState("all");
  const [apiStatusFilter, setApiStatusFilter] = useState("all");
  const [apiCurrentPage, setApiCurrentPage] = useState(1);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const [apiTotal, setApiTotal] = useState(0);
  
  const logsPerPage = 50;

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (activeTab === "api") {
      loadApiLogs();
    }
  }, [activeTab, apiCurrentPage, apiMethodFilter]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();
      if (!hasPermission(user, PERMISSIONS.VIEW_AUDIT_LOGS)) {
        navigate(createPageUrl("Dashboard"));
        toast.error("You don't have permission to view audit logs");
        return;
      }

      const allLogs = await AuditLog.list();
      const sorted = Array.isArray(allLogs) ? allLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [];
      setLogs(sorted);
    } catch (error) {
      console.error("Error loading logs:", error);
      window.location.href = "/login";
    } finally {
      setIsLoading(false);
    }
  };

  const loadApiLogs = async () => {
    setIsLoadingApi(true);
    try {
      const params = {
        page: apiCurrentPage,
        per_page: logsPerPage
      };
      if (apiMethodFilter !== "all") {
        params.method = apiMethodFilter;
      }
      const response = await ApiRequestLog.list(params);
      setApiLogs(Array.isArray(response.data) ? response.data : []);
      setApiTotalPages(response.pagination?.total_pages || 1);
      setApiTotal(response.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading API logs:", error);
      toast.error("Failed to load API request logs");
    } finally {
      setIsLoadingApi(false);
    }
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case "credit_purchase":
      case "payment_approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "credit_usage":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "credit_adjustment":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "payment_rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "payment_submitted":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case "role_assigned":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "analysis_created":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
      case "user_registered":
      case "user_login":
        return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
    }
  };

  const getActionLabel = (actionType) => {
    const labels = {
      credit_purchase: "Credit Purchase",
      credit_usage: "Credit Usage",
      credit_adjustment: "Admin Adjustment",
      payment_approved: "Payment Approved",
      payment_rejected: "Payment Rejected",
      payment_submitted: "Payment Submitted",
      role_assigned: "Role Assigned",
      analysis_created: "Analysis Created",
      user_registered: "User Registered",
      user_login: "User Login"
    };
    return labels[actionType] || actionType;
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (status >= 300 && status < 400) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    if (status >= 400 && status < 500) return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    if (status >= 500) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
  };

  const getMethodColor = (method) => {
    switch (method) {
      case "GET": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "POST": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PUT": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case "DELETE": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "PATCH": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default: return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Action", "User", "Performed By", "Description", "Metadata"];
    const rows = filteredLogs.map(log => [
      log.created_at ? format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss") : "",
      log.action_type,
      log.user_email,
      log.performed_by || "System",
      log.description,
      JSON.stringify(log.meta_data || {})
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Audit logs exported successfully");
  };

  const exportApiLogsToCSV = () => {
    const headers = ["Date", "Method", "Path", "Status", "User", "IP", "Execution Time (ms)"];
    const rows = filteredApiLogs.map(log => [
      log.created_at ? format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss") : "",
      log.method,
      log.path,
      log.response_status,
      log.user_email || "Anonymous",
      log.ip_address,
      log.execution_time_ms
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api-request-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("API request logs exported successfully");
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchQuery.trim() ||
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performed_by?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action_type === actionFilter;

    return matchesSearch && matchesAction;
  });

  const filteredApiLogs = apiLogs.filter(log => {
    const matchesSearch = !apiSearchQuery.trim() ||
      log.path?.toLowerCase().includes(apiSearchQuery.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(apiSearchQuery.toLowerCase()) ||
      log.ip_address?.includes(apiSearchQuery);

    const matchesStatus = apiStatusFilter === "all" || 
      (apiStatusFilter === "2xx" && log.response_status >= 200 && log.response_status < 300) ||
      (apiStatusFilter === "3xx" && log.response_status >= 300 && log.response_status < 400) ||
      (apiStatusFilter === "4xx" && log.response_status >= 400 && log.response_status < 500) ||
      (apiStatusFilter === "5xx" && log.response_status >= 500);

    return matchesSearch && matchesStatus;
  });

  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const apiStartIndex = (apiCurrentPage - 1) * logsPerPage;
  const apiEndIndex = Math.min(apiStartIndex + logsPerPage, apiTotal);
  const paginatedApiLogs = filteredApiLogs;

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          title="Audit Logs"
          description="Monitor all significant user actions and API requests"
          backUrl={createPageUrl("Dashboard")}
          icon={Activity}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const success = exportToExcel(filteredLogs, getAuditLogsExportColumns(), 'audit_logs', 'Audit Logs');
                if (success) toast.success('Audit logs exported to Excel');
                else toast.error('No data to export');
              }}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          }
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="audit" className="gap-2">
              <Activity className="w-4 h-4" />
              Activity Logs
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Globe className="w-4 h-4" />
              API Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{logs.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Last 24h</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {logs.filter(l => l.created_at && new Date(l.created_at) > new Date(Date.now() - 86400000)).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Admin Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {logs.filter(l => l.performed_by && l.performed_by !== l.user_email).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Credit Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {logs.filter(l => ['credit_purchase', 'credit_usage', 'credit_adjustment'].includes(l.action_type)).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <FilterBar>
              <SearchInput
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by email, description..."
              />
              <Select
                value={actionFilter}
                onValueChange={(val) => {
                  setActionFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className={`w-[180px] ${SELECT_TRIGGER_CLASS}`}>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="credit_purchase">Credit Purchase</SelectItem>
                  <SelectItem value="credit_usage">Credit Usage</SelectItem>
                  <SelectItem value="credit_adjustment">Admin Adjustment</SelectItem>
                  <SelectItem value="payment_approved">Payment Approved</SelectItem>
                  <SelectItem value="payment_rejected">Payment Rejected</SelectItem>
                  <SelectItem value="payment_submitted">Payment Submitted</SelectItem>
                  <SelectItem value="role_assigned">Role Assigned</SelectItem>
                  <SelectItem value="analysis_created">Analysis Created</SelectItem>
                  <SelectItem value="user_registered">User Registered</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="gap-2 h-11"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </FilterBar>

            <Card className="border-2 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Activity Log ({filteredLogs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Performed By</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                            No logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {log.created_at && format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                            </TableCell>
                            <TableCell>
                              <Badge className={getActionColor(log.action_type)}>
                                {getActionLabel(log.action_type)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {log.user_email}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                              {log.performed_by || "System"}
                            </TableCell>
                            <TableCell className="text-sm max-w-md">
                              {log.description}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">
                              {log.meta_data && Object.keys(log.meta_data).length > 0 && (
                                <details className="cursor-pointer">
                                  <summary className="text-blue-600 hover:text-blue-700">
                                    View metadata
                                  </summary>
                                  <pre className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs overflow-auto max-w-xs">
                                    {JSON.stringify(log.meta_data, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t mt-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-2 px-3 text-sm">
                        Page {currentPage} of {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
          </TabsContent>

          <TabsContent value="api" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{apiTotal}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Success (2xx)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {apiLogs.filter(l => l.response_status >= 200 && l.response_status < 300).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Client Errors (4xx)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">
                    {apiLogs.filter(l => l.response_status >= 400 && l.response_status < 500).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Server Errors (5xx)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {apiLogs.filter(l => l.response_status >= 500).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by path, email, IP..."
                      value={apiSearchQuery}
                      onChange={(e) => {
                        setApiSearchQuery(e.target.value);
                        setApiCurrentPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={apiMethodFilter}
                    onValueChange={(val) => {
                      setApiMethodFilter(val);
                      setApiCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-32">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={apiStatusFilter}
                    onValueChange={(val) => {
                      setApiStatusFilter(val);
                      setApiCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="2xx">2xx Success</SelectItem>
                      <SelectItem value="3xx">3xx Redirect</SelectItem>
                      <SelectItem value="4xx">4xx Client Error</SelectItem>
                      <SelectItem value="5xx">5xx Server Error</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={exportApiLogsToCSV}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  API Requests ({apiTotal})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingApi ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Path</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Time (ms)</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedApiLogs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                No API request logs found
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedApiLogs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                  {log.created_at && format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getMethodColor(log.method)}>
                                    {log.method}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm font-mono max-w-xs truncate">
                                  {log.path}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(log.response_status)}>
                                    {log.response_status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                  {log.user_email || "Anonymous"}
                                </TableCell>
                                <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                  {log.execution_time_ms?.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-xs text-slate-500">
                                  <details className="cursor-pointer">
                                    <summary className="text-blue-600 hover:text-blue-700">
                                      View details
                                    </summary>
                                    <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs overflow-auto max-w-md space-y-2">
                                      <div><strong>IP:</strong> {log.ip_address}</div>
                                      <div><strong>Full URL:</strong> {log.full_url}</div>
                                      {log.error_message && (
                                        <div className="text-red-600"><strong>Error:</strong> {log.error_message}</div>
                                      )}
                                      {log.request_body && (
                                        <div>
                                          <strong>Request Body:</strong>
                                          <pre className="mt-1 overflow-auto">
                                            {typeof log.request_body === 'string' 
                                              ? log.request_body 
                                              : JSON.stringify(log.request_body, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  </details>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {apiTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t mt-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Showing {apiStartIndex + 1}-{apiEndIndex} of {apiTotal}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setApiCurrentPage(p => Math.max(1, p - 1))}
                            disabled={apiCurrentPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                          </Button>
                          <div className="flex items-center gap-2 px-3 text-sm">
                            Page {apiCurrentPage} of {apiTotalPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setApiCurrentPage(p => Math.min(apiTotalPages, p + 1))}
                            disabled={apiCurrentPage === apiTotalPages}
                          >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
