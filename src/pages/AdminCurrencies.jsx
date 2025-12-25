import React, { useState, useEffect } from "react";
import { auth, api } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Coins, Plus, Pencil, Trash2, Star, Globe } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { toast } from "sonner";
import { hasPermission, PERMISSIONS } from "@/components/utils/permissions";

export default function AdminCurrencies() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [currencies, setCurrencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  const isArabic = i18n.language === 'ar';
  const t = (en, ar) => isArabic ? ar : en;
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    name_ar: "",
    symbol: "",
    exchange_rate: "1.0",
    is_default: false,
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();
      setCurrentUser(user);
      if (!hasPermission(user, PERMISSIONS.MANAGE_SETTINGS)) {
        navigate(createPageUrl("Dashboard"));
        toast.error(t("You don't have permission to manage currencies", "ليس لديك صلاحية لإدارة العملات"));
        return;
      }
      await loadCurrencies();
    } catch (error) {
      console.error("Error:", error);
      window.location.href = "/login";
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrencies = async () => {
    try {
      const response = await api.get('/currencies/all');
      setCurrencies(response || []);
    } catch (error) {
      console.error("Error loading currencies:", error);
      toast.error(t("Failed to load currencies", "فشل في تحميل العملات"));
    }
  };

  const openAddDialog = () => {
    setEditingCurrency(null);
    setFormData({
      code: "",
      name: "",
      name_ar: "",
      symbol: "",
      exchange_rate: "1.0",
      is_default: false,
      is_active: true,
      sort_order: currencies.length
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (currency) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code || "",
      name: currency.name || "",
      name_ar: currency.name_ar || "",
      symbol: currency.symbol || "",
      exchange_rate: String(currency.exchange_rate || "1.0"),
      is_default: currency.is_default || false,
      is_active: currency.is_active !== false,
      sort_order: currency.sort_order || 0
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.symbol) {
      toast.error(t("Please fill in all required fields", "يرجى ملء جميع الحقول المطلوبة"));
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        exchange_rate: parseFloat(formData.exchange_rate) || 1.0,
        sort_order: parseInt(formData.sort_order) || 0
      };

      if (editingCurrency) {
        await api.put(`/currencies/${editingCurrency.id}`, payload);
        toast.success(t("Currency updated successfully", "تم تحديث العملة بنجاح"));
      } else {
        await api.post('/currencies', payload);
        toast.success(t("Currency added successfully", "تم إضافة العملة بنجاح"));
      }

      setIsDialogOpen(false);
      await loadCurrencies();
    } catch (error) {
      console.error("Error saving currency:", error);
      const errorMsg = error?.response?.data?.error || error?.message || "Unknown error";
      toast.error(`${t("Failed to save currency", "فشل في حفظ العملة")}: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setIsDeleting(true);
    try {
      await api.delete(`/currencies/${id}`);
      toast.success(t("Currency deleted successfully", "تم حذف العملة بنجاح"));
      setDeleteConfirmId(null);
      await loadCurrencies();
    } catch (error) {
      console.error("Error deleting currency:", error);
      const errorMsg = error?.response?.data?.error || error?.message || "Unknown error";
      toast.error(`${t("Failed to delete currency", "فشل في حذف العملة")}: ${errorMsg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (currency) => {
    try {
      await api.put(`/currencies/${currency.id}`, {
        ...currency,
        is_active: !currency.is_active
      });
      toast.success(currency.is_active 
        ? t("Currency deactivated", "تم تعطيل العملة")
        : t("Currency activated", "تم تفعيل العملة")
      );
      await loadCurrencies();
    } catch (error) {
      console.error("Error toggling currency:", error);
      toast.error(t("Failed to update currency", "فشل في تحديث العملة"));
    }
  };

  const handleSetDefault = async (currency) => {
    if (currency.is_default) return;
    
    try {
      await api.put(`/currencies/${currency.id}`, {
        ...currency,
        is_default: true
      });
      toast.success(t("Default currency updated", "تم تحديث العملة الافتراضية"));
      await loadCurrencies();
    } catch (error) {
      console.error("Error setting default currency:", error);
      toast.error(t("Failed to set default currency", "فشل في تعيين العملة الافتراضية"));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          title={t("Currency Management", "إدارة العملات")}
          description={t("Manage supported currencies and exchange rates", "إدارة العملات المدعومة وأسعار الصرف")}
          icon={Coins}
          backUrl={createPageUrl("AdminSettings")}
        />

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {t("Currencies", "العملات")}
              </CardTitle>
              <CardDescription>
                {t("Add and manage currencies for payment processing", "إضافة وإدارة العملات لمعالجة المدفوعات")}
              </CardDescription>
            </div>
            <Button onClick={openAddDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              {t("Add Currency", "إضافة عملة")}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>{t("Code", "الرمز")}</TableHead>
                    <TableHead>{t("Name", "الاسم")}</TableHead>
                    <TableHead>{t("Symbol", "الرمز")}</TableHead>
                    <TableHead>{t("Exchange Rate (USD)", "سعر الصرف (دولار)")}</TableHead>
                    <TableHead>{t("Status", "الحالة")}</TableHead>
                    <TableHead>{t("Default", "افتراضي")}</TableHead>
                    <TableHead className="text-right">{t("Actions", "الإجراءات")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        {t("No currencies found. Add your first currency.", "لم يتم العثور على عملات. أضف عملتك الأولى.")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currencies.map((currency) => (
                      <TableRow key={currency.id}>
                        <TableCell className="font-mono font-semibold">{currency.code}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{currency.name}</div>
                            {currency.name_ar && (
                              <div className="text-sm text-slate-500">{currency.name_ar}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-lg">{currency.symbol}</TableCell>
                        <TableCell>
                          <span className="font-mono">{currency.exchange_rate?.toFixed(4)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={currency.is_active}
                              onCheckedChange={() => handleToggleActive(currency)}
                            />
                            <Badge variant={currency.is_active ? "default" : "secondary"}>
                              {currency.is_active ? t("Active", "نشط") : t("Inactive", "غير نشط")}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {currency.is_default ? (
                            <Badge className="bg-amber-500 text-white gap-1">
                              <Star className="w-3 h-3" />
                              {t("Default", "افتراضي")}
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(currency)}
                              className="text-slate-500 hover:text-amber-600"
                            >
                              {t("Set Default", "تعيين افتراضي")}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(currency)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {!currency.is_default && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setDeleteConfirmId(currency.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCurrency 
                  ? t("Edit Currency", "تعديل العملة")
                  : t("Add Currency", "إضافة عملة")
                }
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">{t("Currency Code", "رمز العملة")} *</Label>
                  <Input
                    id="code"
                    placeholder="USD"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    maxLength={10}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="symbol">{t("Symbol", "الرمز")} *</Label>
                  <Input
                    id="symbol"
                    placeholder="$"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    maxLength={10}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{t("Name (English)", "الاسم (إنجليزي)")} *</Label>
                <Input
                  id="name"
                  placeholder="US Dollar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_ar">{t("Name (Arabic)", "الاسم (عربي)")}</Label>
                <Input
                  id="name_ar"
                  placeholder="دولار أمريكي"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  dir="rtl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exchange_rate">{t("Exchange Rate (to USD)", "سعر الصرف (إلى دولار)")}</Label>
                  <Input
                    id="exchange_rate"
                    type="number"
                    step="0.0001"
                    min="0"
                    placeholder="1.0"
                    value={formData.exchange_rate}
                    onChange={(e) => setFormData({ ...formData, exchange_rate: e.target.value })}
                  />
                  <p className="text-xs text-slate-500">
                    {t("1 USD = X of this currency", "1 دولار = X من هذه العملة")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sort_order">{t("Sort Order", "ترتيب العرض")}</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">{t("Active", "نشط")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                  <Label htmlFor="is_default">{t("Set as Default", "تعيين كافتراضي")}</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("Cancel", "إلغاء")}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? t("Saving...", "جاري الحفظ...") : t("Save", "حفظ")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("Delete Currency", "حذف العملة")}</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">
              {t(
                "Are you sure you want to delete this currency? This action cannot be undone.",
                "هل أنت متأكد من حذف هذه العملة؟ لا يمكن التراجع عن هذا الإجراء."
              )}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                {t("Cancel", "إلغاء")}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
              >
                {isDeleting ? t("Deleting...", "جاري الحذف...") : t("Delete", "حذف")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
