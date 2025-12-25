import React, { useState, useEffect } from "react";
import { auth, Payment, User, Transaction, PaymentMethod } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Eye, Clock, Banknote, Search, Filter, Download } from "lucide-react";
import { exportToExcel, getPaymentsExportColumns } from "@/components/utils/excelExport";
import PageHeader from "@/components/common/PageHeader";
import FilterBar, { SearchInput, SELECT_TRIGGER_CLASS } from "@/components/common/FilterBar";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hasPermission, hasAnyPermission, PERMISSIONS } from "@/components/utils/permissions";
import { auditLogger } from "@/components/utils/auditLogger";
import { notifyPaymentApproved, notifyPaymentRejected } from "@/components/utils/notificationHelper";

export default function AdminPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewImageUrl, setViewImageUrl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' or 'reject'
  const [viewPaymentDetails, setViewPaymentDetails] = useState(null);

  useEffect(() => {
    loadPayments();
  }, [navigate]);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();
      if (!hasPermission(user, PERMISSIONS.VIEW_PAYMENTS)) {
        navigate(createPageUrl("Dashboard"));
        toast.error("You don't have permission to view payments");
        return;
      }

      const allPayments = await Payment.list();
      setPayments(allPayments);

      // Load payment methods for filter
      const methods = await PaymentMethod.list();
      setPaymentMethods(methods);
    } catch (error) {
      console.error("Error loading payments:", error);
      if (error?.status === 401 || error?.data?.error === 'Not authenticated') {
        window.location.href = '/login';
      } else {
        toast.error("Failed to load payments. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (payment) => {
    const user = await auth.me();
    if (!hasPermission(user, PERMISSIONS.MANAGE_PAYMENTS)) {
      toast.error("You don't have permission to manage payments");
      return;
    }

    setIsProcessing(true);
    try {
      await Payment.approve(payment.id);
      
      toast.success("Payment approved and credits added!");
      setSelectedPayment(null);
      setConfirmAction(null);
      setAdminNotes("");
      loadPayments();
    } catch (error) {
      console.error("Error approving payment:", error);
      toast.error("Failed to approve payment: " + (error.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (payment) => {
    const user = await auth.me();
    if (!hasPermission(user, PERMISSIONS.MANAGE_PAYMENTS)) {
      toast.error("You don't have permission to manage payments");
      return;
    }

    setIsProcessing(true);
    try {
      await Payment.reject(payment.id, adminNotes || 'Payment rejected');
      
      toast.success("Payment rejected");
      setSelectedPayment(null);
      setConfirmAction(null);
      setAdminNotes("");
      loadPayments();
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast.error("Failed to reject payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'approved': return 'bg-orange-100 text-orange-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = !searchQuery.trim() || 
      p.unique_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesPackage = packageFilter === "all" || p.package_id === packageFilter;
    const matchesMethod = methodFilter === "all" || p.payment_method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesPackage && matchesMethod;
  });

  const pendingPayments = filteredPayments.filter(p => p.status === 'pending');
  const processedPayments = filteredPayments.filter(p => p.status !== 'pending');

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
          title="Payment Management"
          description="Review and approve cash payment requests"
          backUrl={createPageUrl("Dashboard")}
          icon={Banknote}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const success = exportToExcel(filteredPayments, getPaymentsExportColumns(), 'payments', 'Payments');
                if (success) toast.success('Payments exported to Excel');
                else toast.error('No data to export');
              }}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          }
        />

        <FilterBar>
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Payment ID or Email..."
            className="md:min-w-[300px]"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={`w-[140px] ${SELECT_TRIGGER_CLASS}`}>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={packageFilter} onValueChange={setPackageFilter}>
            <SelectTrigger className={`w-[140px] ${SELECT_TRIGGER_CLASS}`}>
              <SelectValue placeholder="All Packages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Packages</SelectItem>
              <SelectItem value="single">Single Credit</SelectItem>
              <SelectItem value="bundle">Bundle Package</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className={`w-[180px] ${SELECT_TRIGGER_CLASS}`}>
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment Methods</SelectItem>
              {paymentMethods.map((method) => (
                <SelectItem key={method.id} value={method.name_en}>
                  {method.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBar>

        {/* Pending Payments */}
        <Card className="glass-effect border-2 border-amber-300 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Clock className="w-5 h-5" />
              Pending Payments ({pendingPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPayments.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No pending payments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map((payment) => (
                  <div key={payment.id} className="bg-white rounded-lg border border-amber-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        {payment.unique_id && (
                          <p className="text-xs font-mono font-semibold text-purple-600 mb-1">
                            {payment.unique_id}
                          </p>
                        )}
                        <p className="font-semibold text-slate-800">{payment.user_email}</p>
                        <p className="text-sm text-slate-600">
                          {payment.credits} credits - ${payment.amount_usd}
                        </p>
                        {payment.discount_code && (
                          <p className="text-sm text-orange-600 font-medium">
                            Discount: {payment.discount_code} (-${payment.discount_amount || 0})
                          </p>
                        )}
                        <p className="text-xs text-slate-500">
                          Submitted on {format(new Date(payment.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      {payment.payment_proof && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewImageUrl(payment.payment_proof)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Invoice
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setSelectedPayment(payment)}
                        className="gap-2 bg-orange-600 hover:bg-orange-700"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processed Payments */}
        <Card className="glass-effect border border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Payment History ({processedPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedPayments.map((payment) => (
                <div key={payment.id} className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    {payment.unique_id && (
                      <p className="text-xs font-mono font-semibold text-purple-600 mb-1">
                        {payment.unique_id}
                      </p>
                    )}
                    <p className="font-medium text-slate-800">{payment.user_email}</p>
                    <p className="text-sm text-slate-600">
                      {payment.credits} credits - ${payment.amount_usd}
                    </p>
                    {payment.discount_code && (
                      <p className="text-sm text-orange-600 font-medium">
                        Discount: {payment.discount_code} (-${payment.discount_amount || 0})
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      {format(new Date(payment.created_at), "MMM d, yyyy")}
                      {payment.approved_at && ` • Processed: ${format(new Date(payment.approved_at), "MMM d, yyyy")}`}
                    </p>
                    {payment.admin_notes && (
                      <p className="text-xs text-slate-500 italic mt-1">Note: {payment.admin_notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewPaymentDetails(payment)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => {
        setSelectedPayment(null);
        setConfirmAction(null);
      }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {confirmAction ? `Confirm ${confirmAction === 'approve' ? 'Approval' : 'Rejection'}` : 'Review Payment'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayment && !confirmAction && (
            <>
              <div className="space-y-4 py-4">
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  {selectedPayment.unique_id && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-600">Payment ID:</span>
                      <span className="text-sm font-mono font-semibold text-purple-600">{selectedPayment.unique_id}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">User:</span>
                    <span className="text-sm text-slate-800">{selectedPayment.user_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Amount:</span>
                    <span className="text-sm text-slate-800">${selectedPayment.amount_usd}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Credits:</span>
                    <span className="text-sm text-slate-800">{selectedPayment.credits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Date:</span>
                    <span className="text-sm text-slate-800">
                      {format(new Date(selectedPayment.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  {selectedPayment.discount_code && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Discount Code:</span>
                        <span className="text-sm font-semibold text-orange-600">{selectedPayment.discount_code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Discount Amount:</span>
                        <span className="text-sm font-semibold text-orange-600">-${selectedPayment.discount_amount || 0}</span>
                      </div>
                      {selectedPayment.original_amount && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-slate-600">Original Amount:</span>
                          <span className="text-sm text-slate-500 line-through">${selectedPayment.original_amount}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {selectedPayment.payment_proof && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Invoice Image:</p>
                    <img
                      src={selectedPayment.payment_proof}
                      alt="Invoice"
                      className="w-full rounded-lg border border-slate-200"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Admin Notes (optional):
                  </label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any notes about this payment..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirmAction('reject')}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => setConfirmAction('approve')}
                  disabled={isProcessing}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve & Add Credits
                </Button>
              </DialogFooter>
            </>
          )}

          {selectedPayment && confirmAction && (
            <>
              <div className="py-4">
                <div className={`rounded-lg p-4 ${confirmAction === 'approve' ? 'bg-orange-50 border border-orange-200' : 'bg-red-50 border border-red-200'}`}>
                  <h3 className={`font-semibold mb-2 ${confirmAction === 'approve' ? 'text-orange-900' : 'text-red-900'}`}>
                    {confirmAction === 'approve' ? 'Approve Payment?' : 'Reject Payment?'}
                  </h3>
                  <p className={`text-sm ${confirmAction === 'approve' ? 'text-orange-800' : 'text-red-800'}`}>
                    {confirmAction === 'approve' 
                      ? `This will add ${selectedPayment.credits} credits to ${selectedPayment.user_email}'s account and create a transaction record for $${selectedPayment.amount_usd}.`
                      : `This will reject the payment request from ${selectedPayment.user_email} for ${selectedPayment.credits} credits ($${selectedPayment.amount_usd}). The user will be notified.`
                    }
                  </p>
                  {adminNotes && (
                    <div className="mt-3 pt-3 border-t border-opacity-20" style={{borderColor: confirmAction === 'approve' ? '#c2410c' : '#991b1b'}}>
                      <p className="text-xs font-medium mb-1" style={{color: confirmAction === 'approve' ? '#c2410c' : '#991b1b'}}>
                        Admin Notes:
                      </p>
                      <p className="text-sm">{adminNotes}</p>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirmAction(null)}
                  disabled={isProcessing}
                >
                  Back
                </Button>
                <Button
                  onClick={() => confirmAction === 'approve' ? handleApprove(selectedPayment) : handleReject(selectedPayment)}
                  disabled={isProcessing}
                  className={confirmAction === 'approve' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {isProcessing ? 'Processing...' : `Confirm ${confirmAction === 'approve' ? 'Approval' : 'Rejection'}`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Image View Dialog */}
      <Dialog open={!!viewImageUrl} onOpenChange={() => setViewImageUrl(null)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Invoice Image</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <img
              src={viewImageUrl}
              alt="Invoice"
              className="w-full rounded-lg border border-slate-200"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={!!viewPaymentDetails} onOpenChange={() => setViewPaymentDetails(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Payment Details
            </DialogTitle>
          </DialogHeader>
          
          {viewPaymentDetails && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                {viewPaymentDetails.unique_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Payment ID:</span>
                    <span className="text-sm font-mono font-semibold text-purple-600">{viewPaymentDetails.unique_id}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Status:</span>
                  <Badge className={getStatusColor(viewPaymentDetails.status)}>
                    {viewPaymentDetails.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">User:</span>
                  <span className="text-sm text-slate-800">{viewPaymentDetails.user_email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Amount (USD):</span>
                  <span className="text-sm font-semibold text-slate-800">${viewPaymentDetails.amount_usd}</span>
                </div>
                {viewPaymentDetails.currency_code && viewPaymentDetails.currency_code !== 'USD' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">Payment Currency:</span>
                      <span className="text-sm font-semibold text-blue-600">{viewPaymentDetails.currency_code}</span>
                    </div>
                    {viewPaymentDetails.currency_amount && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Amount ({viewPaymentDetails.currency_code}):</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {viewPaymentDetails.currency_amount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {viewPaymentDetails.exchange_rate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Exchange Rate:</span>
                        <span className="text-sm text-slate-500">
                          1 USD = {viewPaymentDetails.exchange_rate.toLocaleString()} {viewPaymentDetails.currency_code}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Credits:</span>
                  <span className="text-sm font-semibold text-slate-800">{viewPaymentDetails.credits} credits</span>
                </div>
                {viewPaymentDetails.payment_method && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Payment Method:</span>
                    <span className="text-sm text-slate-800">{viewPaymentDetails.payment_method}</span>
                  </div>
                )}
                {viewPaymentDetails.discount_code && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">Discount Code:</span>
                      <span className="text-sm font-semibold text-orange-600">{viewPaymentDetails.discount_code}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">Discount Amount:</span>
                      <span className="text-sm font-semibold text-orange-600">-${viewPaymentDetails.discount_amount || 0}</span>
                    </div>
                    {viewPaymentDetails.original_amount && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Original Amount:</span>
                        <span className="text-sm text-slate-500 line-through">${viewPaymentDetails.original_amount}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Submitted:</span>
                  <span className="text-sm text-slate-800">
                    {format(new Date(viewPaymentDetails.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                {viewPaymentDetails.approved_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Processed:</span>
                    <span className="text-sm text-slate-800">
                      {format(new Date(viewPaymentDetails.approved_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                )}
                {viewPaymentDetails.approved_by && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Processed By:</span>
                    <span className="text-sm text-slate-800">{viewPaymentDetails.approved_by}</span>
                  </div>
                )}
              </div>

              {viewPaymentDetails.admin_notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-800 mb-1">Admin Notes:</p>
                  <p className="text-sm text-amber-700">{viewPaymentDetails.admin_notes}</p>
                </div>
              )}

              {viewPaymentDetails.payment_proof && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Invoice Image:</p>
                  <img
                    src={viewPaymentDetails.payment_proof}
                    alt="Invoice"
                    className="w-full rounded-lg border border-slate-200"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPaymentDetails(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}