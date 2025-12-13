import React, { useState, useEffect } from "react";
import { auth, api, Analysis, Payment, User, AI } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Shield, Search, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AuditLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 50;

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();
      if (user.role !== 'admin') {
        navigate(createPageUrl("Dashboard"));
        toast.error("You don't have permission to view audit logs");
        return;
      }

      const allLogs = await api.AuditLog.filter({}, "-created_date", 1000);
      setLogs(allLogs);
    } catch (error) {
      console.error("Error loading logs:", error);
      window.location.href = "/login";
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case "credit_purchase":
      case "payment_approved":
        return "bg-green-100 text-green-800";
      case "credit_usage":
        return "bg-blue-100 text-blue-800";
      case "credit_adjustment":
        return "bg-purple-100 text-purple-800";
      case "payment_rejected":
        return "bg-red-100 text-red-800";
      case "payment_submitted":
        return "bg-amber-100 text-amber-800";
      case "role_assigned":
        return "bg-indigo-100 text-indigo-800";
      case "analysis_created":
        return "bg-cyan-100 text-cyan-800";
      case "user_registered":
      case "user_login":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-slate-100 text-slate-800";
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

  const exportToCSV = () => {
    const headers = ["Date", "Action", "User", "Performed By", "Description", "Metadata"];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_date), "yyyy-MM-dd HH:mm:ss"),
      log.action_type,
      log.user_email,
      log.performed_by || "System",
      log.description,
      JSON.stringify(log.metadata || {})
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

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchQuery.trim() ||
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performed_by?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action_type === actionFilter;

    return matchesSearch && matchesAction;
  });

  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

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
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-800">
              Audit Logs
            </h1>
            <p className="text-slate-600 mt-1">Monitor all significant user actions and admin activities</p>
          </div>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{logs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Last 24h</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {logs.filter(l => new Date(l.created_date) > new Date(Date.now() - 86400000)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Admin Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {logs.filter(l => l.performed_by && l.performed_by !== l.user_email).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Credit Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {logs.filter(l => ['credit_purchase', 'credit_usage', 'credit_adjustment'].includes(l.action_type)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-2 border-slate-200">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by email, description..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={actionFilter}
                onValueChange={(val) => {
                  setActionFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
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
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="border-2 border-slate-200">
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
                        <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                          {format(new Date(log.created_date), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionColor(log.action_type)}>
                            {getActionLabel(log.action_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {log.user_email}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {log.performed_by || "System"}
                        </TableCell>
                        <TableCell className="text-sm max-w-md">
                          {log.description}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:text-blue-700">
                                View metadata
                              </summary>
                              <pre className="mt-2 p-2 bg-slate-50 rounded text-xs overflow-auto max-w-xs">
                                {JSON.stringify(log.metadata, null, 2)}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <div className="text-sm text-slate-600">
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
      </div>
    </div>
  );
}