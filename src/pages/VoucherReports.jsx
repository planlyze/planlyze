import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { NGO } from '@/api/client';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Star, Archive, Unlink, Loader2, TrendingUp, Clock, Users, DollarSign, User, Mail, Phone, Search, Filter, X, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function VoucherReports() {
  const { voucherId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, report: null });
  const [userDialog, setUserDialog] = useState({ open: false, user: null });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavourite, setFilterFavourite] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('none');

  const isArabic = user?.language === 'ar';

  const categories = [...new Set(reports.map(r => r.industry).filter(Boolean))];

  const filteredReports = reports.filter(report => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesIdea = report.business_idea?.toLowerCase().includes(query);
      const matchesUser = report.user?.full_name?.toLowerCase().includes(query) || 
                          report.user?.email?.toLowerCase().includes(query);
      if (!matchesIdea && !matchesUser) return false;
    }
    if (filterFavourite === 'favourite' && !report.is_ngo_favourite) return false;
    if (filterFavourite === 'not_favourite' && report.is_ngo_favourite) return false;
    if (filterCategory !== 'all' && report.industry !== filterCategory) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'market_fit_high': return (b.market_fit_score ?? 0) - (a.market_fit_score ?? 0);
      case 'market_fit_low': return (a.market_fit_score ?? 0) - (b.market_fit_score ?? 0);
      case 'build_time_high': return (b.time_to_build_months ?? 0) - (a.time_to_build_months ?? 0);
      case 'build_time_low': return (a.time_to_build_months ?? 0) - (b.time_to_build_months ?? 0);
      case 'competitors_high': return (b.competitors_count ?? 0) - (a.competitors_count ?? 0);
      case 'competitors_low': return (a.competitors_count ?? 0) - (b.competitors_count ?? 0);
      case 'cost_high': return (b.starting_cost_usd ?? 0) - (a.starting_cost_usd ?? 0);
      case 'cost_low': return (a.starting_cost_usd ?? 0) - (b.starting_cost_usd ?? 0);
      default: return 0;
    }
  });

  const clearFilters = () => {
    setSearchQuery('');
    setFilterFavourite('all');
    setFilterCategory('all');
    setSortBy('none');
  };

  const hasActiveFilters = searchQuery || filterFavourite !== 'all' || filterCategory !== 'all' || sortBy !== 'none';

  useEffect(() => {
    fetchReports();
  }, [voucherId, showArchived]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await NGO.getVoucherAnalyses(voucherId, showArchived);
      setReports(data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error(isArabic ? 'فشل في تحميل التقارير' : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavourite = async (report) => {
    setActionLoading(prev => ({ ...prev, [`fav_${report.id}`]: true }));
    try {
      const result = await NGO.toggleAnalysisFavourite(report.id);
      const newValue = result.is_ngo_favourite;
      setReports(prev => prev.map(r => 
        r.id === report.id ? { ...r, is_ngo_favourite: newValue } : r
      ));
      toast.success(newValue 
        ? (isArabic ? 'تمت إضافة التقرير للمفضلة' : 'Added to favourites')
        : (isArabic ? 'تمت إزالة التقرير من المفضلة' : 'Removed from favourites')
      );
    } catch (error) {
      toast.error(isArabic ? 'فشل في تحديث المفضلة' : 'Failed to update favourite');
    } finally {
      setActionLoading(prev => ({ ...prev, [`fav_${report.id}`]: false }));
    }
  };

  const handleArchive = async () => {
    const report = confirmDialog.report;
    setConfirmDialog({ open: false, type: null, report: null });
    setActionLoading(prev => ({ ...prev, [`archive_${report.id}`]: true }));
    try {
      const result = await NGO.toggleAnalysisArchive(report.id);
      const newValue = result.is_ngo_archived;
      if (!showArchived && newValue) {
        setReports(prev => prev.filter(r => r.id !== report.id));
      } else {
        setReports(prev => prev.map(r => 
          r.id === report.id ? { ...r, is_ngo_archived: newValue } : r
        ));
      }
      toast.success(newValue 
        ? (isArabic ? 'تمت أرشفة التقرير' : 'Report archived')
        : (isArabic ? 'تم إلغاء أرشفة التقرير' : 'Report unarchived')
      );
    } catch (error) {
      toast.error(isArabic ? 'فشل في تحديث الأرشيف' : 'Failed to update archive');
    } finally {
      setActionLoading(prev => ({ ...prev, [`archive_${report.id}`]: false }));
    }
  };

  const handleUnlink = async () => {
    const report = confirmDialog.report;
    setConfirmDialog({ open: false, type: null, report: null });
    setActionLoading(prev => ({ ...prev, [`unlink_${report.id}`]: true }));
    try {
      await NGO.unlinkAnalysis(report.id);
      setReports(prev => prev.filter(r => r.id !== report.id));
      toast.success(isArabic ? 'تم إلغاء ربط التقرير' : 'Report unlinked');
    } catch (error) {
      toast.error(isArabic ? 'فشل في إلغاء الربط' : 'Failed to unlink');
    } finally {
      setActionLoading(prev => ({ ...prev, [`unlink_${report.id}`]: false }));
    }
  };

  const formatCurrency = (amount) => {
    if (amount == null) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/ngo-dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader 
          title={isArabic ? 'تقارير القسيمة' : 'Voucher Reports'}
          description={isArabic ? 'عرض التقارير المرتبطة بهذه القسيمة' : 'View reports linked to this voucher'}
        />
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={isArabic ? 'بحث بفكرة العمل أو اسم المستخدم...' : 'Search by idea or user name...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterFavourite} onValueChange={setFilterFavourite}>
            <SelectTrigger className="w-[140px]">
              <Star className="h-4 w-4 mr-2" />
              <SelectValue placeholder={isArabic ? 'المفضلة' : 'Favourite'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isArabic ? 'الكل' : 'All'}</SelectItem>
              <SelectItem value="favourite">{isArabic ? 'مفضلة' : 'Favourites'}</SelectItem>
              <SelectItem value="not_favourite">{isArabic ? 'غير مفضلة' : 'Not Favourite'}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={isArabic ? 'الفئة' : 'Category'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isArabic ? 'كل الفئات' : 'All Categories'}</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={isArabic ? 'ترتيب حسب' : 'Sort by'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{isArabic ? 'بدون ترتيب' : 'No sorting'}</SelectItem>
              <SelectItem value="market_fit_high">{isArabic ? 'ملاءمة السوق (الأعلى)' : 'Market Fit (High)'}</SelectItem>
              <SelectItem value="market_fit_low">{isArabic ? 'ملاءمة السوق (الأدنى)' : 'Market Fit (Low)'}</SelectItem>
              <SelectItem value="build_time_high">{isArabic ? 'وقت البناء (الأطول)' : 'Build Time (Longest)'}</SelectItem>
              <SelectItem value="build_time_low">{isArabic ? 'وقت البناء (الأقصر)' : 'Build Time (Shortest)'}</SelectItem>
              <SelectItem value="competitors_high">{isArabic ? 'المنافسون (الأكثر)' : 'Competitors (Most)'}</SelectItem>
              <SelectItem value="competitors_low">{isArabic ? 'المنافسون (الأقل)' : 'Competitors (Least)'}</SelectItem>
              <SelectItem value="cost_high">{isArabic ? 'التكلفة (الأعلى)' : 'Cost (Highest)'}</SelectItem>
              <SelectItem value="cost_low">{isArabic ? 'التكلفة (الأدنى)' : 'Cost (Lowest)'}</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              {isArabic ? 'مسح الفلاتر' : 'Clear'}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch 
            id="show-archived" 
            checked={showArchived} 
            onCheckedChange={setShowArchived}
          />
          <Label htmlFor="show-archived" className="text-sm">
            {isArabic ? 'عرض المؤرشفة' : 'Show Archived'}
          </Label>
          {filteredReports.length !== reports.length && (
            <span className="text-sm text-gray-500 ml-4">
              {isArabic ? `عرض ${filteredReports.length} من ${reports.length}` : `Showing ${filteredReports.length} of ${reports.length}`}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            {isArabic ? 'لا توجد تقارير مرتبطة بهذه القسيمة' : 'No reports linked to this voucher'}
          </CardContent>
        </Card>
      ) : filteredReports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            {isArabic ? 'لا توجد نتائج تطابق الفلاتر' : 'No results match your filters'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <Card key={report.id} className={`relative ${report.is_ngo_archived ? 'opacity-60' : ''}`}>
              {report.is_ngo_favourite && (
                <div className="absolute top-2 right-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle 
                  className="text-lg line-clamp-2 cursor-pointer hover:text-orange-600 transition-colors"
                  onClick={() => navigate(`/analysis-result?id=${report.id}`)}
                >
                  {report.business_idea}
                </CardTitle>
                <Badge variant="outline" className="w-fit mt-1">
                  {report.industry || (isArabic ? 'غير محدد' : 'Not specified')}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-gray-500">{isArabic ? 'ملاءمة السوق' : 'Market Fit'}</span>
                    <span className="font-medium">{report.market_fit_score ?? '-'}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-500">{isArabic ? 'البناء' : 'Build'}</span>
                    <span className="font-medium">{report.time_to_build_months ?? '-'} {isArabic ? 'شهر' : 'mo'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-gray-500">{isArabic ? 'المنافسون' : 'Competitors'}</span>
                    <span className="font-medium">{report.competitors_count ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-orange-500" />
                    <span className="text-gray-500">{isArabic ? 'التكلفة' : 'Cost'}</span>
                    <span className="font-medium">{formatCurrency(report.starting_cost_usd)}</span>
                  </div>
                </div>

                <button 
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
                  onClick={() => setUserDialog({ open: true, user: report.user })}
                >
                  <User className="h-4 w-4" />
                  <span className="underline">{report.user?.full_name || report.user?.email || (isArabic ? 'مستخدم غير معروف' : 'Unknown User')}</span>
                </button>

                <div className="flex gap-2 justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavourite(report)}
                      disabled={actionLoading[`fav_${report.id}`]}
                      className={report.is_ngo_favourite ? 'text-yellow-500' : ''}
                    >
                      {actionLoading[`fav_${report.id}`] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Star className={`h-4 w-4 ${report.is_ngo_favourite ? 'fill-yellow-500' : ''}`} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDialog({ open: true, type: 'archive', report })}
                      disabled={actionLoading[`archive_${report.id}`]}
                    >
                      {actionLoading[`archive_${report.id}`] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDialog({ open: true, type: 'unlink', report })}
                      disabled={actionLoading[`unlink_${report.id}`]}
                      className="text-red-500 hover:text-red-600"
                    >
                      {actionLoading[`unlink_${report.id}`] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Unlink className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/analysis-result?id=${report.id}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {isArabic ? 'عرض' : 'View'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: null, report: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === 'archive' 
                ? (isArabic ? 'أرشفة التقرير' : 'Archive Report')
                : (isArabic ? 'إلغاء ربط التقرير' : 'Unlink Report')
              }
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'archive'
                ? (isArabic ? 'هل أنت متأكد من أرشفة هذا التقرير؟' : 'Are you sure you want to archive this report?')
                : (isArabic ? 'هل أنت متأكد من إلغاء ربط هذا التقرير؟ لن يمكنك الوصول إليه بعد ذلك.' : 'Are you sure you want to unlink this report? You will no longer have access to it.')
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, type: null, report: null })}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              variant={confirmDialog.type === 'unlink' ? 'destructive' : 'default'}
              onClick={confirmDialog.type === 'archive' ? handleArchive : handleUnlink}
            >
              {isArabic ? 'تأكيد' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={userDialog.open} onOpenChange={(open) => !open && setUserDialog({ open: false, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isArabic ? 'تفاصيل المستخدم' : 'User Details'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{isArabic ? 'الاسم' : 'Name'}</p>
                <p className="font-medium">{userDialog.user?.full_name || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{isArabic ? 'البريد الإلكتروني' : 'Email'}</p>
                <p className="font-medium">{userDialog.user?.email || '-'}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
