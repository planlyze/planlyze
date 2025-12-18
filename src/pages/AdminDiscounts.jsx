import React, { useState, useEffect } from "react";
import { auth, api, Analysis, Payment, User, AI } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Edit, Trash2, Percent, DollarSign, Tag } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { hasPermission, PERMISSIONS } from "@/components/utils/permissions";

export default function AdminDiscounts() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();
      setCurrentUser(user);
      
      if (!hasPermission(user, PERMISSIONS.VIEW_DISCOUNTS)) {
        navigate(createPageUrl("Dashboard"));
        toast.error("Unauthorized access");
        return;
      }

      const [discountData, packageData] = await Promise.all([
        api.DiscountCode.filter({}),
        api.CreditPackage.filter({})
      ]);

      setDiscounts(discountData);
      setPackages(packageData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDiscount({
      code: "",
      discount_type: "percentage",
      discount_value: 10,
      description_en: "",
      description_ar: "",
      min_purchase_amount: 0,
      max_uses: null,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: "",
      is_active: true,
      applicable_packages: []
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (discount) => {
    setEditingDiscount({
      ...discount,
      valid_from: discount.valid_from ? new Date(discount.valid_from).toISOString().split('T')[0] : "",
      valid_until: discount.valid_until ? new Date(discount.valid_until).toISOString().split('T')[0] : ""
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...editingDiscount,
        code: editingDiscount.code.toUpperCase(),
        valid_from: editingDiscount.valid_from ? new Date(editingDiscount.valid_from).toISOString() : null,
        valid_until: editingDiscount.valid_until ? new Date(editingDiscount.valid_until).toISOString() : null
      };

      if (editingDiscount.id) {
        await api.DiscountCode.update(editingDiscount.id, data);
        toast.success("Discount code updated successfully");
      } else {
        await api.DiscountCode.create(data);
        toast.success("Discount code created successfully");
      }

      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error saving discount:", error);
      toast.error("Failed to save discount code");
    }
  };

  const handleDelete = async (discount) => {
    if (!confirm(`Delete discount code "${discount.code}"?`)) return;

    try {
      await api.DiscountCode.delete(discount.id);
      toast.success("Discount code deleted");
      loadData();
    } catch (error) {
      console.error("Error deleting discount:", error);
      toast.error("Failed to delete discount code");
    }
  };

  const isArabic = currentUser?.preferred_language === 'arabic';

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-purple-50/20 to-orange-50/10" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("Dashboard"))}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600">
              {isArabic ? "إدارة أكواد الخصم" : "Discount Code Management"}
            </h1>
            <p className="text-slate-600 mt-1">{isArabic ? "إنشاء وإدارة أكواد الخصم" : "Create and manage discount codes"}</p>
          </div>
          <Button onClick={handleCreate} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 gap-2">
            <Plus className="w-4 h-4" />
            {isArabic ? "كود جديد" : "New Code"}
          </Button>
        </div>

        <div className="grid gap-6">
          {discounts.map((discount) => (
            <Card key={discount.id} className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all bg-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                      <Tag className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-slate-800">{discount.code}</h3>
                        <Badge className={discount.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
                          {discount.is_active ? (isArabic ? "نشط" : "Active") : (isArabic ? "غير نشط" : "Inactive")}
                        </Badge>
                        {discount.discount_type === "percentage" ? (
                          <Badge className="bg-orange-100 text-orange-800">
                            <Percent className="w-3 h-3 mr-1" />
                            {discount.discount_value}% OFF
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            <DollarSign className="w-3 h-3 mr-1" />
                            ${discount.discount_value} OFF
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-600 mb-3">{isArabic ? discount.description_ar : discount.description_en}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">{isArabic ? "استخدم:" : "Used:"}</span>
                          <span className="font-semibold ml-1">{discount.times_used}/{discount.max_uses || '∞'}</span>
                        </div>
                        {discount.min_purchase_amount > 0 && (
                          <div>
                            <span className="text-slate-500">{isArabic ? "حد أدنى:" : "Min:"}</span>
                            <span className="font-semibold ml-1">${discount.min_purchase_amount}</span>
                          </div>
                        )}
                        {discount.valid_until && (
                          <div>
                            <span className="text-slate-500">{isArabic ? "ينتهي:" : "Expires:"}</span>
                            <span className="font-semibold ml-1">{format(new Date(discount.valid_until), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(discount)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(discount)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDiscount?.id ? (isArabic ? "تعديل الكود" : "Edit Code") : (isArabic ? "كود جديد" : "New Code")}</DialogTitle>
          </DialogHeader>
          
          {editingDiscount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isArabic ? "الكود" : "Code"}</Label>
                  <Input
                    value={editingDiscount.code}
                    onChange={(e) => setEditingDiscount({...editingDiscount, code: e.target.value.toUpperCase()})}
                    placeholder="SAVE20"
                  />
                </div>
                <div>
                  <Label>{isArabic ? "نوع الخصم" : "Discount Type"}</Label>
                  <Select value={editingDiscount.discount_type} onValueChange={(v) => setEditingDiscount({...editingDiscount, discount_type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">{isArabic ? "نسبة مئوية" : "Percentage"}</SelectItem>
                      <SelectItem value="fixed">{isArabic ? "مبلغ ثابت" : "Fixed Amount"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>{editingDiscount.discount_type === "percentage" ? (isArabic ? "نسبة الخصم (%)" : "Discount Percentage (%)") : (isArabic ? "مبلغ الخصم ($)" : "Discount Amount ($)")}</Label>
                <Input
                  type="number"
                  value={editingDiscount.discount_value}
                  onChange={(e) => setEditingDiscount({...editingDiscount, discount_value: parseFloat(e.target.value)})}
                />
              </div>

              <div>
                <Label>{isArabic ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                <Input
                  value={editingDiscount.description_en}
                  onChange={(e) => setEditingDiscount({...editingDiscount, description_en: e.target.value})}
                />
              </div>

              <div>
                <Label>{isArabic ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                <Input
                  value={editingDiscount.description_ar}
                  onChange={(e) => setEditingDiscount({...editingDiscount, description_ar: e.target.value})}
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isArabic ? "الحد الأدنى للشراء ($)" : "Min Purchase ($)"}</Label>
                  <Input
                    type="number"
                    value={editingDiscount.min_purchase_amount}
                    onChange={(e) => setEditingDiscount({...editingDiscount, min_purchase_amount: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>{isArabic ? "الحد الأقصى للاستخدام" : "Max Uses"}</Label>
                  <Input
                    type="number"
                    value={editingDiscount.max_uses || ""}
                    onChange={(e) => setEditingDiscount({...editingDiscount, max_uses: e.target.value ? parseInt(e.target.value) : null})}
                    placeholder={isArabic ? "غير محدود" : "Unlimited"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isArabic ? "صالح من" : "Valid From"}</Label>
                  <Input
                    type="date"
                    value={editingDiscount.valid_from}
                    onChange={(e) => setEditingDiscount({...editingDiscount, valid_from: e.target.value})}
                  />
                </div>
                <div>
                  <Label>{isArabic ? "صالح حتى" : "Valid Until"}</Label>
                  <Input
                    type="date"
                    value={editingDiscount.valid_until}
                    onChange={(e) => setEditingDiscount({...editingDiscount, valid_until: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={editingDiscount.is_active}
                  onCheckedChange={(checked) => setEditingDiscount({...editingDiscount, is_active: checked})}
                />
                <Label>{isArabic ? "نشط" : "Active"}</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
              {isArabic ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}