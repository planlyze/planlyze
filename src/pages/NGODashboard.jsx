import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { NGO } from '@/api/client';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock, Building2, CheckCircle, XCircle, Clock, Send, Plus, Pencil, Trash2, Ticket, Calendar, Settings, Loader2, Eye, FileText, Star, Archive, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function NGODashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ngoStatus, setNgoStatus] = useState(null);
  const [ngoRequest, setNgoRequest] = useState(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    description: ''
  });

  const [vouchers, setVouchers] = useState([]);
  const [stats, setStats] = useState(null);
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [voucherForm, setVoucherForm] = useState({
    name: '',
    description: '',
    activation_start: '',
    activation_end: '',
    linked_ideas_count: ''
  });
  const [voucherSubmitting, setVoucherSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const isArabic = user?.language === 'ar';

  useEffect(() => {
    fetchNGOStatus();
  }, []);

  const fetchNGOStatus = async () => {
    try {
      const response = await NGO.getMyRequest();
      setNgoStatus(response.status);
      setNgoRequest(response.request);
      if (response.status === 'approved') {
        fetchVouchers();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to fetch NGO status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await NGO.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch NGO stats:', error);
    }
  };

  const fetchVouchers = async () => {
    try {
      const data = await NGO.getVouchers();
      setVouchers(data);
    } catch (error) {
      console.error('Failed to fetch vouchers:', error);
    }
  };

  const viewVoucherAnalyses = (voucher) => {
    navigate(`/ngo-dashboard/voucher/${voucher.id}`);
  };

  const openVoucherDialog = (voucher = null) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setVoucherForm({
        name: voucher.name || '',
        description: voucher.description || '',
        activation_start: voucher.activation_start || '',
        activation_end: voucher.activation_end || '',
        linked_ideas_count: voucher.linked_ideas_count ?? ''
      });
    } else {
      setEditingVoucher(null);
      setVoucherForm({
        name: '',
        description: '',
        activation_start: '',
        activation_end: '',
        linked_ideas_count: ''
      });
    }
    setShowVoucherDialog(true);
  };

  const handleVoucherSubmit = async (e) => {
    e.preventDefault();
    if (!voucherForm.name) {
      toast.error(isArabic ? 'اسم القسيمة مطلوب' : 'Voucher name is required');
      return;
    }
    
    setVoucherSubmitting(true);
    try {
      const payload = {
        name: voucherForm.name,
        description: voucherForm.description || null,
        activation_start: voucherForm.activation_start || null,
        activation_end: voucherForm.activation_end || null,
        linked_ideas_count: voucherForm.linked_ideas_count ? parseInt(voucherForm.linked_ideas_count) : null
      };
      
      if (editingVoucher) {
        await NGO.updateVoucher(editingVoucher.id, payload);
        toast.success(isArabic ? 'تم تحديث القسيمة بنجاح' : 'Voucher updated successfully');
      } else {
        await NGO.createVoucher(payload);
        toast.success(isArabic ? 'تم إنشاء القسيمة بنجاح' : 'Voucher created successfully');
      }
      setShowVoucherDialog(false);
      fetchVouchers();
    } catch (error) {
      toast.error(error.message || (isArabic ? 'فشل حفظ القسيمة' : 'Failed to save voucher'));
    } finally {
      setVoucherSubmitting(false);
    }
  };

  const handleDeleteVoucher = async (id) => {
    try {
      await NGO.deleteVoucher(id);
      toast.success(isArabic ? 'تم حذف القسيمة بنجاح' : 'Voucher deleted successfully');
      setDeleteConfirmId(null);
      fetchVouchers();
    } catch (error) {
      toast.error(error.message || (isArabic ? 'فشل حذف القسيمة' : 'Failed to delete voucher'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.organization_name || !formData.contact_name || !formData.contact_email || !formData.contact_phone) {
      toast.error(isArabic ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await NGO.submitRequest(formData);
      toast.success(isArabic ? 'تم إرسال طلبك بنجاح!' : 'Your request has been submitted successfully!');
      setShowRequestDialog(false);
      fetchNGOStatus();
    } catch (error) {
      toast.error(error.message || (isArabic ? 'فشل إرسال الطلب' : 'Failed to submit request'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (ngoStatus === 'approved') {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
        <PageHeader
          title={isArabic ? 'لوحة تحكم المنظمة غير الربحية' : 'NGO Dashboard'}
          description={isArabic ? 'مرحباً بك في لوحة تحكم منظمتك' : 'Welcome to your organization dashboard'}
          icon={Building2}
          isArabic={isArabic}
          actions={
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle className="w-4 h-4 mr-1" />
                {isArabic ? 'معتمد' : 'Approved'}
              </Badge>
              <Button variant="outline" size="icon" onClick={() => setShowSettingsDialog(true)}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Ticket className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats?.total_vouchers ?? vouchers.length}</p>
                  <p className="text-sm text-gray-500">{isArabic ? 'إجمالي القسائم' : 'Total Vouchers'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats?.active_vouchers ?? vouchers.filter(v => v.is_active).length}</p>
                  <p className="text-sm text-gray-500">{isArabic ? 'القسائم النشطة' : 'Active Vouchers'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats?.total_reports ?? 0}</p>
                  <p className="text-sm text-gray-500">{isArabic ? 'إجمالي التقارير' : 'Total Reports'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats?.favourite_reports ?? 0}</p>
                  <p className="text-sm text-gray-500">{isArabic ? 'التقارير المفضلة' : 'Favourites'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-lg">
                  <Archive className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{stats?.archived_reports ?? 0}</p>
                  <p className="text-sm text-gray-500">{isArabic ? 'التقارير المؤرشفة' : 'Archived'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                {isArabic ? 'قسائم المشاريع' : 'Project Vouchers'}
              </CardTitle>
              <CardDescription>
                {isArabic ? 'إدارة قسائم مشاريع منظمتك' : 'Manage your organization project vouchers'}
              </CardDescription>
            </div>
            <Button onClick={() => openVoucherDialog()} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              {isArabic ? 'إضافة قسيمة' : 'Add Voucher'}
            </Button>
          </CardHeader>
          <CardContent>
            {vouchers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{isArabic ? 'لا توجد قسائم بعد' : 'No vouchers yet'}</p>
                <p className="text-sm">{isArabic ? 'أنشئ أول قسيمة لمشاريعك' : 'Create your first project voucher'}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isArabic ? 'الرمز' : 'Code'}</TableHead>
                    <TableHead>{isArabic ? 'الاسم' : 'Name'}</TableHead>
                    <TableHead>{isArabic ? 'الوصف' : 'Description'}</TableHead>
                    <TableHead>{isArabic ? 'تاريخ التفعيل' : 'Activation'}</TableHead>
                    <TableHead>{isArabic ? 'الحد' : 'Limit'}</TableHead>
                    <TableHead>{isArabic ? 'التقارير' : 'Reports'}</TableHead>
                    <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead>{isArabic ? 'الإجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell>
                        <code className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded font-mono text-sm">
                          {voucher.code}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">{voucher.name}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-gray-600">{voucher.description || '-'}</TableCell>
                      <TableCell>
                        {voucher.activation_start || voucher.activation_end ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-4 h-4" />
                            {voucher.activation_start || '...'} - {voucher.activation_end || '...'}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{voucher.linked_ideas_count ?? '-'}</TableCell>
                      <TableCell>
                        {(voucher.reports_count || 0) > 0 ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => viewVoucherAnalyses(voucher)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {voucher.reports_count}
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-sm">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={voucher.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                          {voucher.is_active ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'غير نشط' : 'Inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openVoucherDialog(voucher)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleteConfirmId(voucher.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{isArabic ? 'إعدادات المنظمة' : 'Organization Settings'}</DialogTitle>
              <DialogDescription>
                {isArabic ? 'معلومات منظمتك وجهة الاتصال' : 'Your organization and contact information'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-500">{isArabic ? 'معلومات المنظمة' : 'Organization Info'}</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{isArabic ? 'الاسم:' : 'Name:'}</span>
                    <span className="font-medium">{ngoRequest?.organization_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{isArabic ? 'النوع:' : 'Type:'}</span>
                    <span className="font-medium">{ngoRequest?.organization_type || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{isArabic ? 'الموقع:' : 'Website:'}</span>
                    <span className="font-medium">{ngoRequest?.website || '-'}</span>
                  </div>
                  {ngoRequest?.description && (
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-500">{isArabic ? 'الوصف:' : 'Description:'}</span>
                      <span className="font-medium">{ngoRequest.description}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium text-sm text-gray-500">{isArabic ? 'معلومات الاتصال' : 'Contact Info'}</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{isArabic ? 'الاسم:' : 'Name:'}</span>
                    <span className="font-medium">{ngoRequest?.contact_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{isArabic ? 'البريد:' : 'Email:'}</span>
                    <span className="font-medium">{ngoRequest?.contact_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{isArabic ? 'الهاتف:' : 'Phone:'}</span>
                    <span className="font-medium">{ngoRequest?.contact_phone}</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                {isArabic ? 'إغلاق' : 'Close'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showVoucherDialog} onOpenChange={setShowVoucherDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingVoucher 
                  ? (isArabic ? 'تعديل القسيمة' : 'Edit Voucher') 
                  : (isArabic ? 'إضافة قسيمة جديدة' : 'Add New Voucher')}
              </DialogTitle>
              <DialogDescription>
                {isArabic ? 'أدخل تفاصيل قسيمة المشروع' : 'Enter the project voucher details'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleVoucherSubmit} className="space-y-4">
              <div>
                <Label>{isArabic ? 'اسم القسيمة *' : 'Voucher Name *'}</Label>
                <Input
                  value={voucherForm.name}
                  onChange={(e) => setVoucherForm({...voucherForm, name: e.target.value})}
                  placeholder={isArabic ? 'أدخل اسم القسيمة' : 'Enter voucher name'}
                  required
                />
              </div>
              <div>
                <Label>{isArabic ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  value={voucherForm.description}
                  onChange={(e) => setVoucherForm({...voucherForm, description: e.target.value})}
                  placeholder={isArabic ? 'وصف القسيمة' : 'Voucher description'}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isArabic ? 'تاريخ البداية' : 'Start Date'}</Label>
                  <Input
                    type="date"
                    value={voucherForm.activation_start}
                    onChange={(e) => setVoucherForm({...voucherForm, activation_start: e.target.value})}
                  />
                </div>
                <div>
                  <Label>{isArabic ? 'تاريخ النهاية' : 'End Date'}</Label>
                  <Input
                    type="date"
                    value={voucherForm.activation_end}
                    onChange={(e) => setVoucherForm({...voucherForm, activation_end: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>{isArabic ? 'عدد الأفكار المرتبطة' : 'Linked Ideas Count'}</Label>
                <Input
                  type="number"
                  min="0"
                  value={voucherForm.linked_ideas_count}
                  onChange={(e) => setVoucherForm({...voucherForm, linked_ideas_count: e.target.value})}
                  placeholder={isArabic ? 'اختياري' : 'Optional'}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowVoucherDialog(false)}>
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={voucherSubmitting} className="bg-orange-500 hover:bg-orange-600">
                  {voucherSubmitting 
                    ? (isArabic ? 'جاري الحفظ...' : 'Saving...') 
                    : (isArabic ? 'حفظ' : 'Save')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}</DialogTitle>
              <DialogDescription>
                {isArabic ? 'هل أنت متأكد من حذف هذه القسيمة؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this voucher? This action cannot be undone.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteVoucher(deleteConfirmId)}>
                {isArabic ? 'حذف' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" dir={isArabic ? 'rtl' : 'ltr'}>
      <PageHeader
        title={isArabic ? 'لوحة تحكم المنظمات غير الربحية' : 'NGO Dashboard'}
        description={
          ngoStatus === 'pending' 
            ? (isArabic ? 'طلبك قيد المراجعة' : 'Your request is pending review')
            : ngoStatus === 'rejected'
            ? (isArabic ? 'تم رفض طلبك' : 'Your request was rejected')
            : (isArabic ? 'تقدم للحصول على حساب منظمة غير ربحية' : 'Apply to become an NGO')
        }
        icon={ngoStatus === 'pending' ? Clock : ngoStatus === 'rejected' ? XCircle : Lock}
        isArabic={isArabic}
      />

      <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            {ngoStatus === 'pending' ? (
              <Clock className="w-8 h-8 text-yellow-600" />
            ) : ngoStatus === 'rejected' ? (
              <XCircle className="w-8 h-8 text-red-600" />
            ) : (
              <Lock className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <CardTitle className="text-xl">
            {ngoStatus === 'pending' 
              ? (isArabic ? 'طلبك قيد المراجعة' : 'Your Request is Pending')
              : ngoStatus === 'rejected'
              ? (isArabic ? 'تم رفض طلبك' : 'Your Request was Rejected')
              : (isArabic ? 'لوحة تحكم المنظمات غير الربحية' : 'NGO Dashboard')}
          </CardTitle>
          <CardDescription>
            {ngoStatus === 'pending' 
              ? (isArabic ? 'سيتم مراجعة طلبك من قبل الإدارة قريباً' : 'Your request will be reviewed by admin soon')
              : ngoStatus === 'rejected'
              ? (isArabic ? 'يمكنك التقدم مرة أخرى لاحقاً' : 'You can apply again later')
              : (isArabic ? 'تقدم بطلب للحصول على حساب منظمة غير ربحية للوصول إلى مزايا خاصة' : 'Apply to become an NGO to access special features and benefits')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {ngoStatus === 'pending' && ngoRequest && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-left">
              <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                {isArabic ? 'تفاصيل الطلب:' : 'Request Details:'}
              </p>
              <p><strong>{isArabic ? 'اسم المنظمة:' : 'Organization:'}</strong> {ngoRequest.organization_name}</p>
              <p><strong>{isArabic ? 'تاريخ التقديم:' : 'Submitted:'}</strong> {new Date(ngoRequest.created_at).toLocaleDateString()}</p>
            </div>
          )}
          
          {ngoStatus === 'rejected' && ngoRequest?.admin_notes && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
              <p className="font-medium text-red-800 dark:text-red-200 mb-2">
                {isArabic ? 'ملاحظات الإدارة:' : 'Admin Notes:'}
              </p>
              <p className="text-red-700 dark:text-red-300">{ngoRequest.admin_notes}</p>
            </div>
          )}

          {(!ngoStatus || ngoStatus === 'rejected') && (
            <Button onClick={() => setShowRequestDialog(true)} className="bg-orange-500 hover:bg-orange-600">
              <Send className="w-4 h-4 mr-2" />
              {isArabic ? 'تقديم طلب' : 'Submit Request'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isArabic ? 'طلب حساب منظمة غير ربحية' : 'NGO Account Request'}</DialogTitle>
            <DialogDescription>
              {isArabic ? 'أدخل معلومات منظمتك وجهة الاتصال' : 'Enter your organization and contact information'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-500">{isArabic ? 'معلومات المنظمة' : 'Organization Info'}</h4>
              <div>
                <Label>{isArabic ? 'اسم المنظمة *' : 'Organization Name *'}</Label>
                <Input
                  value={formData.organization_name}
                  onChange={(e) => setFormData({...formData, organization_name: e.target.value})}
                  placeholder={isArabic ? 'أدخل اسم المنظمة' : 'Enter organization name'}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isArabic ? 'نوع المنظمة' : 'Organization Type'}</Label>
                  <Select value={formData.organization_type} onValueChange={(v) => setFormData({...formData, organization_type: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder={isArabic ? 'اختر النوع' : 'Select type'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="charity">{isArabic ? 'خيرية' : 'Charity'}</SelectItem>
                      <SelectItem value="nonprofit">{isArabic ? 'غير ربحية' : 'Non-profit'}</SelectItem>
                      <SelectItem value="foundation">{isArabic ? 'مؤسسة' : 'Foundation'}</SelectItem>
                      <SelectItem value="social_enterprise">{isArabic ? 'مشروع اجتماعي' : 'Social Enterprise'}</SelectItem>
                      <SelectItem value="other">{isArabic ? 'أخرى' : 'Other'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isArabic ? 'الموقع الإلكتروني' : 'Website'}</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    placeholder="https://"
                  />
                </div>
              </div>
              <div>
                <Label>{isArabic ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={isArabic ? 'وصف مختصر عن منظمتك' : 'Brief description about your organization'}
                  rows={2}
                />
              </div>
            </div>
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium text-sm text-gray-500">{isArabic ? 'معلومات الاتصال' : 'Contact Info'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isArabic ? 'اسم جهة الاتصال *' : 'Contact Name *'}</Label>
                  <Input
                    value={formData.contact_name}
                    onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>{isArabic ? 'البريد الإلكتروني *' : 'Contact Email *'}</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>{isArabic ? 'رقم الهاتف *' : 'Phone Number *'}</Label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  placeholder={isArabic ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowRequestDialog(false)}>
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={submitting} className="bg-orange-500 hover:bg-orange-600">
                {submitting ? (isArabic ? 'جاري الإرسال...' : 'Submitting...') : (isArabic ? 'إرسال الطلب' : 'Submit Request')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
