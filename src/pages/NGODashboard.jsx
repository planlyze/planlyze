import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { NGO } from '@/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Lock, Building2, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function NGODashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ngoStatus, setNgoStatus] = useState(null);
  const [ngoRequest, setNgoRequest] = useState(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
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

  const isArabic = user?.language === 'ar';

  useEffect(() => {
    fetchNGOStatus();
  }, []);

  const fetchNGOStatus = async () => {
    try {
      const response = await NGO.getMyRequest();
      setNgoStatus(response.status);
      setNgoRequest(response.request);
    } catch (error) {
      console.error('Failed to fetch NGO status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.organization_name || !formData.contact_name || !formData.contact_email) {
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
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (ngoStatus === 'approved') {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isArabic ? 'لوحة تحكم المنظمة غير الربحية' : 'NGO Dashboard'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isArabic ? 'مرحباً بك في لوحة تحكم منظمتك' : 'Welcome to your organization dashboard'}
            </p>
          </div>
          <Badge className="bg-green-100 text-green-700 ml-auto">
            <CheckCircle className="w-4 h-4 mr-1" />
            {isArabic ? 'معتمد' : 'Approved'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? 'معلومات المنظمة' : 'Organization Info'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>{isArabic ? 'الاسم:' : 'Name:'}</strong> {ngoRequest?.organization_name}</p>
                <p><strong>{isArabic ? 'النوع:' : 'Type:'}</strong> {ngoRequest?.organization_type || '-'}</p>
                <p><strong>{isArabic ? 'الموقع:' : 'Website:'}</strong> {ngoRequest?.website || '-'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? 'معلومات الاتصال' : 'Contact Info'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>{isArabic ? 'الاسم:' : 'Name:'}</strong> {ngoRequest?.contact_name}</p>
                <p><strong>{isArabic ? 'البريد:' : 'Email:'}</strong> {ngoRequest?.contact_email}</p>
                <p><strong>{isArabic ? 'الهاتف:' : 'Phone:'}</strong> {ngoRequest?.contact_phone || '-'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? 'الإحصائيات' : 'Statistics'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-gray-500">{isArabic ? 'قريباً' : 'Coming soon'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" dir={isArabic ? 'rtl' : 'ltr'}>
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
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>{isArabic ? 'اسم المنظمة *' : 'Organization Name *'}</Label>
                <Input
                  value={formData.organization_name}
                  onChange={(e) => setFormData({...formData, organization_name: e.target.value})}
                  placeholder={isArabic ? 'أدخل اسم المنظمة' : 'Enter organization name'}
                  required
                />
              </div>
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
              <div className="col-span-2">
                <Label>{isArabic ? 'رقم الهاتف' : 'Phone Number'}</Label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label>{isArabic ? 'وصف المنظمة' : 'Organization Description'}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={isArabic ? 'أخبرنا عن منظمتك وأهدافها' : 'Tell us about your organization and its goals'}
                  rows={3}
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