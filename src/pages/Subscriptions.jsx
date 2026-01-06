import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { auth, Transaction, Payment } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageLoader from "@/components/common/PageLoader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, Check, Banknote, ChevronLeft, ChevronRight, Search, Eye, X, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import PageHeader from "@/components/common/PageHeader";

export default function Subscriptions() {
  const { t, i18n } = useTranslation();
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
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const txPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();
      setCurrentUser(user);
      
      const txs = await Transaction.filter({ user_email: user.email });
      const sortedTxs = Array.isArray(txs) ? txs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 50) : [];
      setTransactions(sortedTxs);

      const allPaymentsData = await Payment.filter({ user_email: user.email });
      const sortedPayments = Array.isArray(allPaymentsData) ? allPaymentsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [];
      setAllPayments(sortedPayments);
    } catch (error) {
      console.error("Error loading subscription data:", error);
      window.location.href = "/login";
    } finally {
      setIsLoading(false);
    }
  };

  const isArabic = i18n.language === 'ar' || currentUser?.preferred_language === 'arabic';

  if (isLoading) {
    return <PageLoader isArabic={isArabic} />;
  }

  return (
     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8" dir={isArabic ? 'rtl' : 'ltr'}>
     
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
          
           <PageHeader
                  title={t('subscriptions.title')}
                  description={t('subscriptions.subtitle')}
                  // backUrl={createPageUrl("Dashboard")}
                  icon={FileText}
                  isArabic={isArabic}
                />
          
        {/* Tabs at the top */}
        <Tabs value={historyTab} onValueChange={setHistoryTab} className="animate-in fade-in slide-in-from-top-4 duration-500"  dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="flex items-center gap-4 mb-6">
            
            <TabsList>
              <TabsTrigger value="payments">
                <Banknote className={`w-5 h-5 ${isArabic ? 'ml-2' : 'mr-2'}`} />
                {t('subscriptions.paymentRequests')}
              </TabsTrigger>
              <TabsTrigger value="transactions">
                <Clock className={`w-5 h-5 ${isArabic ? 'ml-2' : 'mr-2'}`} />
                {t('subscriptions.transactions')}
              </TabsTrigger>
            </TabsList>
          </div>

          

          {/* Payment Requests Tab */}
          <TabsContent value="payments" className="mt-6">
            <Card className="glass-effect border-2 border-slate-200 dark:border-gray-700 shadow-xl dark:bg-gray-800">
              <CardHeader className="border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-white" />
                    </div>
                    {t('subscriptions.paymentRequestsHistory')}
                  </CardTitle>
                  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger className="w-48 h-11 border-2 border-slate-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-colors dark:bg-gray-700 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('subscriptions.allStatus')}</SelectItem>
                      <SelectItem value="pending">{t('subscriptions.pending')}</SelectItem>
                      <SelectItem value="approved">{t('subscriptions.approved')}</SelectItem>
                      <SelectItem value="rejected">{t('subscriptions.rejected')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500" />
                  <Input
                    placeholder={t('subscriptions.searchByPaymentId')}
                    value={paymentSearchQuery}
                    onChange={(e) => setPaymentSearchQuery(e.target.value)}
                    className="pl-11 h-12 border-2 border-slate-300 dark:border-gray-600 focus:border-purple-400 dark:focus:border-purple-500 transition-colors dark:bg-gray-700 dark:text-white"
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
                      <Banknote className="w-16 h-16 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
                      <p className="text-slate-500 dark:text-gray-400 text-lg">{t('subscriptions.noPaymentRequests')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filtered.map((payment) => (
                        <div
                          key={payment.id}
                          className={`p-5 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                            payment.status === 'pending' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 hover:border-amber-400' :
                            payment.status === 'approved' ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 hover:border-green-400' :
                            'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 hover:border-red-400'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {payment.unique_id && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg mb-3">
                                  <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300">
                                    {payment.unique_id}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-3 mb-2">
                                <p className="text-lg font-bold text-slate-800 dark:text-white">
                                  {payment.credits} {t('credits.credits')}
                                </p>
                                <span className="text-slate-400 dark:text-gray-500">•</span>
                                <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                                  ${payment.amount_usd}
                                </p>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-gray-400 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {t('subscriptions.submitted')}: {payment.created_at && format(new Date(payment.created_at), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                              {payment.approved_at && (
                                <p className="text-sm text-slate-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                                  <Check className="w-4 h-4" />
                                  {t('subscriptions.processed')}: {format(new Date(payment.approved_at), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              )}
                              {payment.admin_notes && (
                                <p className="text-sm text-slate-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 px-3 py-2 rounded-lg mt-3 border border-slate-200 dark:border-gray-600">
                                  <span className="font-semibold">{t('subscriptions.note')}:</span> {payment.admin_notes}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={`px-4 py-2 text-sm font-semibold shadow-sm ${
                                payment.status === 'pending' ? 'bg-amber-500 text-white border-amber-600' :
                                payment.status === 'approved' ? 'bg-green-500 text-white border-green-600' :
                                'bg-red-500 text-white border-red-600'
                              }`}>
                                {payment.status === 'pending' ? t('subscriptions.pending') :
                                 payment.status === 'approved' ? t('subscriptions.approved') :
                                 t('subscriptions.rejected')}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setIsDetailsOpen(true);
                                }}
                                className="gap-2 border-slate-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 dark:bg-gray-700"
                              >
                                <Eye className="w-4 h-4" />
                                {isArabic ? "عرض التفاصيل" : "View Details"}
                              </Button>
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
            <Card className="glass-effect border-2 border-slate-200 dark:border-gray-700 shadow-xl dark:bg-gray-800">
              <CardHeader className="border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    {t('subscriptions.transactionHistory')}
                  </CardTitle>
                  <Select value={txTypeFilter} onValueChange={(val) => { setTxTypeFilter(val); setTxCurrentPage(1); }}>
                    <SelectTrigger className="w-48 h-11 border-2 border-slate-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-colors dark:bg-gray-700 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('subscriptions.allTypes')}</SelectItem>
                      <SelectItem value="purchase">{t('subscriptions.purchase')}</SelectItem>
                      <SelectItem value="usage">{t('subscriptions.usage')}</SelectItem>
                      <SelectItem value="bonus">{t('subscriptions.bonus')}</SelectItem>
                      <SelectItem value="refund">{t('subscriptions.refund')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500" />
                  <Input
                    placeholder={t('subscriptions.searchByTransactionId')}
                    value={txSearchQuery}
                    onChange={(e) => { setTxSearchQuery(e.target.value); setTxCurrentPage(1); }}
                    className="pl-11 h-12 border-2 border-slate-300 dark:border-gray-600 focus:border-purple-400 dark:focus:border-purple-500 transition-colors dark:bg-gray-700 dark:text-white"
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
                            className="flex items-center justify-between p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border-2 border-slate-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex-1">
                              {tx.unique_id && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700 rounded-lg mb-3">
                                  <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
                                    {tx.unique_id}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-semibold text-lg text-slate-800 dark:text-white">
                                  {tx.type === 'purchase' && t('subscriptions.creditPurchase')}
                                  {tx.type === 'usage' && t('subscriptions.creditUsed')}
                                  {tx.type === 'bonus' && t('subscriptions.bonusCredit')}
                                  {tx.type === 'refund' && t('subscriptions.refund')}
                                </p>
                                <Badge className={`px-3 py-1 font-semibold ${
                                  tx.type === 'purchase' ? 'bg-green-500 text-white border-green-600' :
                                  tx.type === 'usage' ? 'bg-blue-500 text-white border-blue-600' :
                                  tx.type === 'bonus' ? 'bg-purple-500 text-white border-purple-600' :
                                  'bg-red-500 text-white border-red-600'
                                }`}>
                                  {t(`subscriptions.${tx.type}`)}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-gray-400 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {tx.created_at && format(new Date(tx.created_at), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                            <div className="text-right pl-4">
                              <p className={`text-2xl font-bold ${tx.credits > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {tx.credits > 0 ? '+' : ''}{tx.credits}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">
                                {t('credits.credits')}
                              </p>
                              {tx.amount_usd && (
                                <p className="text-sm text-slate-500 dark:text-gray-500 font-semibold mt-1">${tx.amount_usd}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {paginated.length === 0 && (
                          <div className="text-center py-16">
                            <Clock className="w-16 h-16 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
                            <p className="text-slate-500 dark:text-gray-400 text-lg">{t('subscriptions.noTransactions')}</p>
                          </div>
                        )}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-6 border-t-2 dark:border-gray-700 mt-6">
                          <div className="text-sm text-slate-600 dark:text-gray-400 font-medium">
                            {t('subscriptions.showing', { start: start + 1, end: Math.min(end, filtered.length), total: filtered.length })}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="default"
                              onClick={() => setTxCurrentPage(p => Math.max(1, p - 1))}
                              disabled={txCurrentPage === 1}
                              className="border-2 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 disabled:opacity-50 dark:bg-gray-700"
                            >
                              <ChevronLeft className="w-4 h-4 mr-1" />
                              {t('subscriptions.previous')}
                            </Button>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-gray-700 rounded-lg border-2 border-slate-200 dark:border-gray-600 font-semibold dark:text-white">
                              {t('subscriptions.page', { current: txCurrentPage, total: totalPages })}
                            </div>
                            <Button
                              variant="outline"
                              size="default"
                              onClick={() => setTxCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={txCurrentPage === totalPages}
                              className="border-2 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 disabled:opacity-50 dark:bg-gray-700"
                            >
                              {t('subscriptions.next')}
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

      {/* Payment Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700" dir={isArabic ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl text-slate-800 dark:text-white">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                <Banknote className="w-6 h-6 text-white" />
              </div>
              {isArabic ? "تفاصيل الدفع" : "Payment Details"}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6 py-4">
              {/* Payment ID */}
              {selectedPayment.unique_id && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg">
                  <span className="text-sm font-mono font-bold text-purple-700 dark:text-purple-300">
                    {selectedPayment.unique_id}
                  </span>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className="text-slate-600 dark:text-gray-400 font-medium">{isArabic ? "الحالة:" : "Status:"}</span>
                <Badge className={`px-4 py-2 text-sm font-semibold ${
                  selectedPayment.status === 'pending' ? 'bg-amber-500 text-white' :
                  selectedPayment.status === 'approved' ? 'bg-green-500 text-white' :
                  'bg-red-500 text-white'
                }`}>
                  {selectedPayment.status === 'pending' ? t('subscriptions.pending') :
                   selectedPayment.status === 'approved' ? t('subscriptions.approved') :
                   t('subscriptions.rejected')}
                </Badge>
              </div>

              {/* Payment Info */}
              <div className="bg-slate-50 dark:bg-gray-700 rounded-xl p-5 border-2 border-slate-200 dark:border-gray-600 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-gray-400">{isArabic ? "الأرصدة:" : "Credits:"}</span>
                  <span className="font-bold text-purple-700 dark:text-purple-400">{selectedPayment.credits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-gray-400">{isArabic ? "المبلغ:" : "Amount:"}</span>
                  <span className="font-bold text-purple-700 dark:text-purple-400">${selectedPayment.amount_usd}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-gray-400">{isArabic ? "طريقة الدفع:" : "Payment Method:"}</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{selectedPayment.payment_method || '-'}</span>
                </div>
                {selectedPayment.discount_code && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-gray-400">{isArabic ? "كود الخصم:" : "Discount Code:"}</span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">{selectedPayment.discount_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-gray-400">{isArabic ? "مبلغ الخصم:" : "Discount Amount:"}</span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">-${selectedPayment.discount_amount || 0}</span>
                    </div>
                    {selectedPayment.original_amount && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-gray-400">{isArabic ? "المبلغ الأصلي:" : "Original Amount:"}</span>
                        <span className="font-medium text-slate-500 dark:text-gray-500 line-through">${selectedPayment.original_amount}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-gray-400">{isArabic ? "تاريخ الإرسال:" : "Submitted:"}</span>
                  <span className="font-medium text-slate-700 dark:text-gray-300">
                    {selectedPayment.created_at && format(new Date(selectedPayment.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                {selectedPayment.approved_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-gray-400">{isArabic ? "تاريخ المعالجة:" : "Processed:"}</span>
                    <span className="font-medium text-slate-700 dark:text-gray-300">
                      {format(new Date(selectedPayment.approved_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              {selectedPayment.admin_notes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border-2 border-amber-200 dark:border-amber-700">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">
                    {isArabic ? "ملاحظات الإدارة:" : "Admin Notes:"}
                  </p>
                  <p className="text-slate-700 dark:text-gray-300">{selectedPayment.admin_notes}</p>
                </div>
              )}

              {/* Payment Proof Image */}
              {selectedPayment.payment_proof && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                    {isArabic ? "صورة الإيصال:" : "Receipt Image:"}
                  </p>
                  <div className="border-2 border-slate-200 dark:border-gray-600 rounded-xl overflow-hidden">
                    <img 
                      src={selectedPayment.payment_proof} 
                      alt="Payment proof" 
                      className="w-full max-h-96 object-contain bg-slate-100 dark:bg-gray-700"
                    />
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                <Button onClick={() => setIsDetailsOpen(false)} variant="outline" className="px-6 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  {isArabic ? "إغلاق" : "Close"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}