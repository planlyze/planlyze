import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { NGO } from '@/api/client';
import { hasPermission, PERMISSIONS } from '@/components/utils/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, CheckCircle, XCircle, Clock, Eye, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminNGORequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const isArabic = user?.language === 'ar';
  const canView = hasPermission(user, PERMISSIONS.VIEW_NGO_REQUESTS) || hasPermission(user, PERMISSIONS.MANAGE_NGO_REQUESTS);
  const canManage = hasPermission(user, PERMISSIONS.MANAGE_NGO_REQUESTS);

  useEffect(() => {
    if (!canView) {
      navigate('/Dashboard');
      return;
    }
    fetchRequests();
  }, [statusFilter, canView]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await NGO.getAllRequests(statusFilter);
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch NGO requests:', error);
      toast.error(isArabic ? 'فشل تحميل الطلبات' : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    setUpdating(true);
    try {
      await NGO.updateRequest(id, { status, admin_notes: adminNotes });
      toast.success(isArabic ? 'تم تحديث الحالة بنجاح' : 'Status updated successfully');
      setShowDetailDialog(false);
      fetchRequests();
    } catch (error) {
      toast.error(error.message || (isArabic ? 'فشل تحديث الحالة' : 'Failed to update status'));
    } finally {
      setUpdating(false);
    }
  };

  const openDetails = (req) => {
    setSelectedRequest(req);
    setAdminNotes(req.admin_notes || '');
    setShowDetailDialog(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />{isArabic ? 'موافق' : 'Approved'}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />{isArabic ? 'مرفوض' : 'Rejected'}</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />{isArabic ? 'قيد الانتظار' : 'Pending'}</Badge>;
    }
  };

  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      req.organization_name?.toLowerCase().includes(query) ||
      req.user_email?.toLowerCase().includes(query) ||
      req.contact_name?.toLowerCase().includes(query)
    );
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isArabic ? 'طلبات المنظمات غير الربحية' : 'NGO Requests'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isArabic ? 'إدارة طلبات حسابات المنظمات' : 'Manage NGO account requests'}
            </p>
          </div>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-yellow-500 text-white text-lg px-3 py-1">
            {pendingCount} {isArabic ? 'قيد الانتظار' : 'Pending'}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={isArabic ? 'بحث...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={isArabic ? 'كل الحالات' : 'All Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? 'كل الحالات' : 'All Status'}</SelectItem>
                <SelectItem value="pending">{isArabic ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                <SelectItem value="approved">{isArabic ? 'موافق' : 'Approved'}</SelectItem>
                <SelectItem value="rejected">{isArabic ? 'مرفوض' : 'Rejected'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {isArabic ? 'لا توجد طلبات' : 'No requests found'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isArabic ? 'اسم المنظمة' : 'Organization'}</TableHead>
                  <TableHead>{isArabic ? 'المستخدم' : 'User'}</TableHead>
                  <TableHead>{isArabic ? 'جهة الاتصال' : 'Contact'}</TableHead>
                  <TableHead>{isArabic ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{isArabic ? 'الإجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.organization_name}</TableCell>
                    <TableCell>{req.user_email}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{req.contact_name}</p>
                        <p className="text-gray-500">{req.contact_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openDetails(req)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isArabic ? 'تفاصيل الطلب' : 'Request Details'}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{isArabic ? 'اسم المنظمة' : 'Organization'}</p>
                  <p className="font-medium">{selectedRequest.organization_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{isArabic ? 'النوع' : 'Type'}</p>
                  <p className="font-medium">{selectedRequest.organization_type || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{isArabic ? 'جهة الاتصال' : 'Contact'}</p>
                  <p className="font-medium">{selectedRequest.contact_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{isArabic ? 'البريد' : 'Email'}</p>
                  <p className="font-medium">{selectedRequest.contact_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{isArabic ? 'الهاتف' : 'Phone'}</p>
                  <p className="font-medium">{selectedRequest.contact_phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{isArabic ? 'الموقع' : 'Website'}</p>
                  <p className="font-medium">{selectedRequest.website || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">{isArabic ? 'المستخدم' : 'User'}</p>
                  <p className="font-medium">{selectedRequest.user_email}</p>
                </div>
                {selectedRequest.description && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">{isArabic ? 'الوصف' : 'Description'}</p>
                    <p className="font-medium">{selectedRequest.description}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">{isArabic ? 'ملاحظات الإدارة' : 'Admin Notes'}</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={isArabic ? 'أضف ملاحظات...' : 'Add notes...'}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm">
                  {isArabic ? 'الحالة الحالية:' : 'Current Status:'} {getStatusBadge(selectedRequest.status)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              {isArabic ? 'إغلاق' : 'Close'}
            </Button>
            {canManage && selectedRequest?.status !== 'rejected' && (
              <Button
                variant="destructive"
                onClick={() => handleStatusChange(selectedRequest.id, 'rejected')}
                disabled={updating}
              >
                <XCircle className="w-4 h-4 mr-1" />
                {isArabic ? 'رفض' : 'Reject'}
              </Button>
            )}
            {canManage && selectedRequest?.status !== 'approved' && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusChange(selectedRequest.id, 'approved')}
                disabled={updating}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {isArabic ? 'موافقة' : 'Approve'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}