import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Image as ImageIcon, Filter } from "lucide-react";
import { auth, api, Analysis, Payment, PaymentMethod, User, AI } from "@/api/client";
import { toast } from "sonner";

export default function PaymentMethodsManager({ isArabic }) {
  const [methods, setMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [currentMethod, setCurrentMethod] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    name_en: "",
    name_ar: "",
    logo_url: "",
    instructions_ar : "",
    instructions : "",
    details: {},
    is_active: true,
    sort_order: 0
  });

  React.useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    setIsLoading(true);
    try {
      const data = await PaymentMethod.list("sort_order");
      setMethods(data);
    } catch (error) {
      console.error("Error loading payment methods:", error);
      toast.error("Failed to load payment methods");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (method) => {
    setCurrentMethod(method);
    setFormData({
      name_en: method.name_en || "",      
      name_ar: method.name_ar || "",
      instructions: method.instructions || "",
      instructions_ar: method.instructions_ar || "",
      logo_url: method.logo_url || "",
      details: method.details || {},
      is_active: method.is_active !== false,
      sort_order: method.sort_order || 0
    });
    setEditDialog(true);
  };

  const handleNew = () => {
    setCurrentMethod(null);
    setFormData({
      name_en: "",
      name_ar: "",
      logo_url: "",
      instructions: "",
      instructions_ar: "",
      details: {},
      is_active: true,
      sort_order: 0
    });
    setEditDialog(true);
  };

  const handleSave = async () => {
    try {
      if (currentMethod) {
        await PaymentMethod.update(currentMethod.id, formData);
        toast.success("Payment method updated");
      } else {
        await PaymentMethod.create(formData);
        toast.success("Payment method created");
      }
      setEditDialog(false);
      loadMethods();
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast.error("Failed to save payment method");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this payment method?")) return;
    try {
      await PaymentMethod.delete(id);
      toast.success("Payment method deleted");
      loadMethods();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error("Failed to delete payment method");
    }
  };

  const updateDescriptionField = (key, value) => {
    setFormData(prev => ({
      ...prev,
      details: { ...prev.details, [key]: value }
    }));
  };

  const filteredMethods = methods.filter(method => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return method.is_active === true;
    if (statusFilter === "inactive") return method.is_active === false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h3 className="text-lg font-semibold">
          {isArabic ? "إدارة طرق الدفع" : "Payment Methods Management"}
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={isArabic ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? "الكل" : "All"}</SelectItem>
                <SelectItem value="active">{isArabic ? "نشط" : "Active"}</SelectItem>
                <SelectItem value="inactive">{isArabic ? "معطل" : "Inactive"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="w-4 h-4" />
            {isArabic ? "إضافة طريقة دفع" : "Add Payment Method"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : filteredMethods.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-slate-500">
            {statusFilter !== "all" 
              ? (isArabic ? "لا توجد طرق دفع بهذه الحالة" : "No payment methods with this status")
              : (isArabic ? "لا توجد طرق دفع" : "No payment methods")
            }
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMethods.map((method) => (
            <Card key={method.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {method.logo_url ? (
                    <img src={method.logo_url} alt={method.name_en} className="w-16 h-16 object-contain rounded-lg border" />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{method.name_en}</h4>
                      {method.name_ar && <span className="text-slate-600">({method.name_ar})</span>}
                      <Badge variant={method.is_active ? "default" : "secondary"}>
                        {method.is_active ? (isArabic ? "نشط" : "Active") : (isArabic ? "معطل" : "Inactive")}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      {Object.entries(method.details || {}).map(([key, value]) => (
                        <div key={key}>
                          <span>{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(method)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(method.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentMethod 
                ? (isArabic ? "تعديل طريقة الدفع" : "Edit Payment Method")
                : (isArabic ? "إضافة طريقة دفع" : "Add Payment Method")
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name (English)</Label>
                <Input 
                  value={formData.name_en} 
                  onChange={(e) => setFormData({...formData, name_en: e.target.value})}
                  placeholder="Bank Transfer"
                />
              </div>
              <div>
                <Label>Name (Arabic)</Label>
                <Input 
                  value={formData.name_ar} 
                  onChange={(e) => setFormData({...formData, name_ar: e.target.value})}
                  placeholder="تحويل بنكي"
                />
              </div>
            </div>

              <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Instructions (English)</Label>
                <Input 
                  value={formData.instructions} 
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                  placeholder="Bank Transfer"
                />
              </div>
              <div>
                <Label>Instructions (Arabic)</Label>
                <Input 
                  value={formData.instructions_ar} 
                  onChange={(e) => setFormData({...formData, instructions_ar: e.target.value})}
                  placeholder="تحويل بنكي"
                />
              </div>
            </div>

            <div>
              <Label>Logo URL</Label>
              <Input 
                value={formData.logo_url} 
                onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <Label>Sort Order</Label>
              <Input 
                type="number"
                value={formData.sort_order} 
                onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div>
              <Label>Payment Details (JSON)</Label>
              <div className="space-y-2 mt-2 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600">Add key-value pairs for payment details:</p>
                <div className="space-y-2">
                  {Object.entries(formData.details).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <Input 
                        value={key} 
                        onChange={(e) => {
                          const newDesc = {...formData.details};
                          delete newDesc[key];
                          newDesc[e.target.value] = value;
                          setFormData({...formData, details: newDesc});
                        }}
                        placeholder="Key (e.g., Bank Name)"
                        className="flex-1"
                      />
                      <Input 
                        value={value} 
                        onChange={(e) => updateDescriptionField(key, e.target.value)}
                        placeholder="Value"
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => {
                          const newDesc = {...formData.details};
                          delete newDesc[key];
                          setFormData({...formData, details: newDesc});
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateDescriptionField(`field_${Date.now()}`, "")}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}