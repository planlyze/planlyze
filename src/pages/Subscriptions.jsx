import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Transaction } from "@/entities/Transaction";
import { Payment } from "@/entities/Payment";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, Check, Banknote, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";

export default function Subscriptions() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [historyTab, setHistoryTab] = useState("payments");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentSearchQuery, setPaymentSearchQuery] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("all");
  const [txSearchQuery, setTxSearchQuery] = useState("");
  const [txCurrentPage, setTxCurrentPage] = useState(1);
  const txPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const txs = await Transaction.filter({ user_email: user.email }, "-created_date", 50);
      setTransactions(txs);

      const allPaymentsData = await Payment.filter({ user_email: user.email }, "-created_date");
      setAllPayments(allPaymentsData);
    } catch (error) {
      console.error("Error loading subscription data:", error);
      await User.loginWithRedirect(window.location.href);
    } finally {
      setIsLoading(false);
    }
  };

  const isArabic = currentUser?.preferred_language === 'arabic';

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-white to-orange-50">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-80 gradient-primary opacity-20 rounded-xl" />
          <Skeleton className="h-96 w-full gradient-primary opacity-20 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-white to-orange-50" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="shadow-md hover:shadow-lg transition-all duration-300 border-slate-300 hover:border-purple-400"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-orange-600">
              {isArabic ? "الاشتراكات والمدفوعات" : "Subscriptions & Payments"}
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              {isArabic ? "تتبع طلبات الدفع والمعاملات" : "Track your payment requests and transaction history"}
            </p>
          </div>
        </div>

        {/* History Tabs */}
        <Tabs value={historyTab} onValueChange={setHistoryTab} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-slate-100 rounded-xl">
            <TabsTrigger 
              value="payments" 
              className="data-[state=inactive]:text-slate-600 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg font-semibold text-base transition-all duration-300"
            >
              <Banknote className="w-5 h-5 mr-2" />
              {isArabic ? "طلبات الدفع" : "Payment Requests"}
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="data-[state=inactive]:text-slate-600 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg font-semibold text-base transition-all duration-300"
            >
              <Clock className="w-5 h-5 mr-2" />
              {isArabic ? "المعاملات" : "Transactions"}
            </TabsTrigger>
          </TabsList>

          {/* Payment Requests Tab */}
          <TabsContent value="payments" className="mt-6">
            <Card className="glass-effect border-2 border-slate-200 shadow-xl">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-white" />
                    </div>
                    {isArabic ? "سجل طلبات الدفع" : "Payment Requests History"}
                  </CardTitle>
                  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger className="w-48 h-11 border-2 border-slate-300 hover:border-purple-400 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isArabic ? "جميع الحالات" : "All Status"}</SelectItem>
                      <SelectItem value="pending">{isArabic ? "قيد المراجعة" : "Pending"}</SelectItem>
                      <SelectItem value="approved">{isArabic ? "موافق عليه" : "Approved"}</SelectItem>
                      <SelectItem value="rejected">{isArabic ? "مرفوض" : "Rejected"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder={isArabic ? "البحث برقم الطلب..." : "Search by Payment ID..."}
                    value={paymentSearchQuery}
                    onChange={(e) => setPaymentSearchQuery(e.target.value)}
                    className="pl-11 h-12 border-2 border-slate-300 focus:border-purple-400 transition-colors"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  let filtered = paymentStatusFilter === "all" ? allPayments : allPayments.filter(p => p.status === paymentStatusFilter);
                  if (paymentSearchQuery.trim()) {
                    const query = paymentSearchQuery.toLowerCase();
                    filtered = filtered.filter(p => p.unique_id?.toLowerCase().includes(query));
                  }
                  
                  return filtered.length === 0 ? (
                    <div className="text-center py-16">
                      <Banknote className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500 text-lg">{isArabic ? "لا توجد طلبات دفع" : "No payment requests found"}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filtered.map((payment) => (
                        <div
                          key={payment.id}
                          className={`p-5 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                            payment.status === 'pending' ? 'bg-amber-50 border-amber-300 hover:border-amber-400' :
                            payment.status === 'approved' ? 'bg-green-50 border-green-300 hover:border-green-400' :
                            'bg-red-50 border-red-300 hover:border-red-400'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {payment.unique_id && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 border border-purple-300 rounded-lg mb-3">
                                  <span className="text-xs font-mono font-bold text-purple-700">
                                    {payment.unique_id}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-3 mb-2">
                                <p className="text-lg font-bold text-slate-800">
                                  {payment.credits} {isArabic ? "رصيد" : "credits"}
                                </p>
                                <span className="text-slate-400">•</span>
                                <p className="text-lg font-semibold text-purple-600">
                                  ${payment.amount_usd}
                                </p>
                              </div>
                              <p className="text-sm text-slate-600 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {isArabic ? "مُرسَل في" : "Submitted"}: {format(new Date(payment.created_date), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                              {payment.approved_at && (
                                <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                                  <Check className="w-4 h-4" />
                                  {isArabic ? "مُعالج في" : "Processed"}: {format(new Date(payment.approved_at), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              )}
                              {payment.admin_notes && (
                                <p className="text-sm text-slate-700 bg-white/60 px-3 py-2 rounded-lg mt-3 border border-slate-200">
                                  <span className="font-semibold">{isArabic ? "ملاحظة:" : "Note:"}</span> {payment.admin_notes}
                                </p>
                              )}
                            </div>
                            <div>
                              <Badge className={`px-4 py-2 text-sm font-semibold shadow-sm ${
                                payment.status === 'pending' ? 'bg-amber-500 text-white border-amber-600' :
                                payment.status === 'approved' ? 'bg-green-500 text-white border-green-600' :
                                'bg-red-500 text-white border-red-600'
                              }`}>
                                {payment.status === 'pending' ? (isArabic ? 'قيد المراجعة' : 'Pending') :
                                 payment.status === 'approved' ? (isArabic ? 'موافق عليه' : 'Approved') :
                                 (isArabic ? 'مرفوض' : 'Rejected')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="mt-6">
            <Card className="glass-effect border-2 border-slate-200 shadow-xl">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    {isArabic ? "سجل المعاملات" : "Transaction History"}
                  </CardTitle>
                  <Select value={txTypeFilter} onValueChange={(val) => { setTxTypeFilter(val); setTxCurrentPage(1); }}>
                    <SelectTrigger className="w-48 h-11 border-2 border-slate-300 hover:border-purple-400 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isArabic ? "جميع الأنواع" : "All Types"}</SelectItem>
                      <SelectItem value="purchase">{isArabic ? "شراء" : "Purchase"}</SelectItem>
                      <SelectItem value="usage">{isArabic ? "استخدام" : "Usage"}</SelectItem>
                      <SelectItem value="bonus">{isArabic ? "مجاني" : "Bonus"}</SelectItem>
                      <SelectItem value="refund">{isArabic ? "استرداد" : "Refund"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder={isArabic ? "البحث برقم المعاملة..." : "Search by Transaction ID..."}
                    value={txSearchQuery}
                    onChange={(e) => { setTxSearchQuery(e.target.value); setTxCurrentPage(1); }}
                    className="pl-11 h-12 border-2 border-slate-300 focus:border-purple-400 transition-colors"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  let filtered = txTypeFilter === "all" ? transactions : transactions.filter(tx => tx.type === txTypeFilter);
                  if (txSearchQuery.trim()) {
                    const query = txSearchQuery.toLowerCase();
                    filtered = filtered.filter(tx => tx.unique_id?.toLowerCase().includes(query));
                  }
                  const start = (txCurrentPage - 1) * txPerPage;
                  const end = start + txPerPage;
                  const paginated = filtered.slice(start, end);
                  const totalPages = Math.ceil(filtered.length / txPerPage);

                  return (
                    <>
                      <div className="space-y-4">
                        {paginated.map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex-1">
                              {tx.unique_id && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 border border-indigo-300 rounded-lg mb-3">
                                  <span className="text-xs font-mono font-bold text-indigo-700">
                                    {tx.unique_id}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-semibold text-lg text-slate-800">
                                  {tx.type === 'purchase' && (isArabic ? 'شراء أرصدة' : 'Credit Purchase')}
                                  {tx.type === 'usage' && (isArabic ? 'استخدام رصيد' : 'Credit Used')}
                                  {tx.type === 'bonus' && (isArabic ? 'رصيد مجاني' : 'Bonus Credit')}
                                  {tx.type === 'refund' && (isArabic ? 'استرداد' : 'Refund')}
                                </p>
                                <Badge className={`px-3 py-1 font-semibold ${
                                  tx.type === 'purchase' ? 'bg-green-500 text-white border-green-600' :
                                  tx.type === 'usage' ? 'bg-blue-500 text-white border-blue-600' :
                                  tx.type === 'bonus' ? 'bg-purple-500 text-white border-purple-600' :
                                  'bg-red-500 text-white border-red-600'
                                }`}>
                                  {tx.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {format(new Date(tx.created_date), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                            <div className="text-right pl-4">
                              <p className={`text-2xl font-bold ${tx.credits > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.credits > 0 ? '+' : ''}{tx.credits}
                              </p>
                              <p className="text-sm text-slate-600 font-medium">
                                {isArabic ? 'رصيد' : 'credits'}
                              </p>
                              {tx.amount_usd && (
                                <p className="text-sm text-slate-500 font-semibold mt-1">${tx.amount_usd}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {paginated.length === 0 && (
                          <div className="text-center py-16">
                            <Clock className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 text-lg">{isArabic ? "لا توجد معاملات" : "No transactions found"}</p>
                          </div>
                        )}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-6 border-t-2 mt-6">
                          <div className="text-sm text-slate-600 font-medium">
                            {isArabic ? `عرض ${start + 1}-${Math.min(end, filtered.length)} من ${filtered.length}` : `Showing ${start + 1}-${Math.min(end, filtered.length)} of ${filtered.length}`}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="default"
                              onClick={() => setTxCurrentPage(p => Math.max(1, p - 1))}
                              disabled={txCurrentPage === 1}
                              className="border-2 hover:border-purple-400 disabled:opacity-50"
                            >
                              <ChevronLeft className="w-4 h-4 mr-1" />
                              {isArabic ? "السابق" : "Previous"}
                            </Button>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg border-2 border-slate-200 font-semibold">
                              {isArabic ? `صفحة ${txCurrentPage} من ${totalPages}` : `Page ${txCurrentPage} of ${totalPages}`}
                            </div>
                            <Button
                              variant="outline"
                              size="default"
                              onClick={() => setTxCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={txCurrentPage === totalPages}
                              className="border-2 hover:border-purple-400 disabled:opacity-50"
                            >
                              {isArabic ? "التالي" : "Next"}
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}