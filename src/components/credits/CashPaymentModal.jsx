import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle2, Info, Wallet, Image as ImageIcon, Clock, X } from "lucide-react";
import { auth, api, Analysis, Payment, PaymentMethod, User, AI } from "@/api/client";
import { toast } from "sonner";
import { logPaymentSubmitted } from "@/components/utils/activityHelper";

export default function CashPaymentModal({ isOpen, onClose, selectedPackage, userEmail, isArabic }) {
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
      setDiscountCode("");
      setAppliedDiscount(null);
      setInvoiceFile(null);
    }
  }, [isOpen]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await PaymentMethod.filter({ is_active: true }, "sort_order");
      setPaymentMethods(methods);
      if (methods.length > 0) {
        setSelectedMethod(methods[0]);
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(isArabic ? "الملف كبير جداً (الحد الأقصى 5 ميجابايت)" : "File too large (max 5MB)");
        return;
      }
      setInvoiceFile(file);
    }
  };

  const validateDiscount = async () => {
    if (!discountCode.trim()) return;

    setIsValidating(true);
    try {
      const discounts = await api.DiscountCode.filter({ 
        code: discountCode.toUpperCase(),
        is_active: true 
      });

      if (discounts.length === 0) {
        toast.error(isArabic ? "كود الخصم غير صالح" : "Invalid discount code");
        setAppliedDiscount(null);
        return;
      }

      const discount = discounts[0];
      const now = new Date();

      if (discount.valid_from && new Date(discount.valid_from) > now) {
        toast.error(isArabic ? "الكود غير نشط بعد" : "Code is not active yet");
        setAppliedDiscount(null);
        return;
      }

      if (discount.valid_until && new Date(discount.valid_until) < now) {
        toast.error(isArabic ? "الكود منتهي الصلاحية" : "Code has expired");
        setAppliedDiscount(null);
        return;
      }

      if (discount.max_uses && discount.times_used >= discount.max_uses) {
        toast.error(isArabic ? "تم استخدام الكود بالكامل" : "Code has been fully used");
        setAppliedDiscount(null);
        return;
      }

      if (discount.min_purchase_amount > selectedPackage.price) {
        toast.error(isArabic ? `الحد الأدنى للشراء $${discount.min_purchase_amount}` : `Minimum purchase $${discount.min_purchase_amount} required`);
        setAppliedDiscount(null);
        return;
      }

      if (discount.applicable_packages && discount.applicable_packages.length > 0) {
        if (!discount.applicable_packages.includes(selectedPackage.package_id)) {
          toast.error(isArabic ? "الكود غير صالح لهذه الباقة" : "Code not applicable for this package");
          setAppliedDiscount(null);
          return;
        }
      }

      setAppliedDiscount(discount);
      toast.success(isArabic ? "تم تطبيق الخصم!" : "Discount applied!");
    } catch (error) {
      console.error("Error validating discount:", error);
      toast.error(isArabic ? "فشل التحقق من الكود" : "Failed to validate code");
    } finally {
      setIsValidating(false);
    }
  };

  const calculateFinalAmount = () => {
    if (!appliedDiscount) return selectedPackage.price;
    
    if (appliedDiscount.discount_type === "percentage") {
      return selectedPackage.price * (1 - appliedDiscount.discount_value / 100);
    } else {
      return Math.max(0, selectedPackage.price - appliedDiscount.discount_value);
    }
  };

  const handleSubmit = async () => {
    if (!invoiceFile) {
      toast.error(isArabic ? "يرجى رفع صورة الفاتورة" : "Please upload invoice image");
      return;
    }

    setIsUploading(true);
    try {
      // Upload invoice image
      const { file_url } = await api.integrations.Core.UploadFile({ file: invoiceFile });
      setUploadedUrl(file_url);

      // Generate unique payment ID
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const uniqueId = `PAY${date}${randomStr}`;

      const finalAmount = calculateFinalAmount();
      
      // Create payment record
      await Payment.create({
        unique_id: uniqueId,
        user_email: userEmail,
        package_id: selectedPackage.package_id,
        amount_usd: finalAmount,
        credits: selectedPackage.credits,
        payment_method: selectedMethod?.name_en || "cash",
        invoice_image_url: file_url,
        status: "pending",
        discount_code: appliedDiscount?.code || null,
        discount_amount: appliedDiscount ? (selectedPackage.price - finalAmount) : 0
      });

      // Increment discount usage
      if (appliedDiscount) {
        await api.DiscountCode.update(appliedDiscount.id, {
          times_used: (appliedDiscount.times_used || 0) + 1
        });
      }

      // Log activity
      await logPaymentSubmitted(userEmail, finalAmount, selectedPackage.credits);

      toast.success(isArabic ? "تم إرسال الطلب بنجاح! سيتم مراجعته قريباً" : "Payment submitted! It will be reviewed shortly");
      onClose();
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast.error(isArabic ? "فشل إرسال الطلب" : "Failed to submit payment");
    } finally {
      setIsUploading(false);
    }
  };

  if (!selectedPackage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir={isArabic ? 'rtl' : 'ltr'}>
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            {isArabic ? "إتمام عملية الدفع" : "Complete Payment"}
          </DialogTitle>
          <DialogDescription className="text-base text-slate-600">
            {isArabic 
              ? "قم بتحويل المبلغ ثم ارفع صورة الإيصال للمراجعة"
              : "Transfer the amount and upload the receipt for review"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Package Details Card */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">
                  {isArabic ? "الباقة المختارة" : "Selected Package"}
                </p>
                <p className="text-lg font-bold text-slate-800">
                  {isArabic ? (selectedPackage.name_ar || selectedPackage.name) : selectedPackage.name}
                </p>
              </div>
            </div>
            <div className="space-y-2 pt-3 border-t border-purple-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{isArabic ? "الأرصدة:" : "Credits:"}</span>
                <span className="font-bold text-purple-700">{selectedPackage.credits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{isArabic ? "السعر:" : "Price:"}</span>
                <span className="font-bold text-purple-700">${selectedPackage.price}</span>
              </div>
              {appliedDiscount && (
                <>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{isArabic ? "الخصم:" : "Discount:"}</span>
                    <span className="font-bold">
                      -{appliedDiscount.discount_type === "percentage" 
                        ? `${appliedDiscount.discount_value}%` 
                        : `$${appliedDiscount.discount_value}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t border-purple-200">
                    <span>{isArabic ? "المجموع:" : "Total:"}</span>
                    <span>${calculateFinalAmount().toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Discount Code */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-slate-800">
              {isArabic ? "كود الخصم (اختياري)" : "Discount Code (Optional)"}
            </Label>
            <div className="flex gap-2">
              <Input
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder={isArabic ? "أدخل الكود" : "Enter code"}
                disabled={appliedDiscount || isUploading}
                className="flex-1 h-12"
              />
              {!appliedDiscount ? (
                <Button 
                  onClick={validateDiscount} 
                  disabled={isValidating || !discountCode.trim() || isUploading}
                  variant="outline"
                  className="h-12 px-6"
                >
                  {isValidating ? (isArabic ? "جارٍ..." : "Checking...") : (isArabic ? "تطبيق" : "Apply")}
                </Button>
              ) : (
                <Button 
                  onClick={() => { setDiscountCode(""); setAppliedDiscount(null); }} 
                  variant="outline"
                  className="h-12 px-6"
                  disabled={isUploading}
                >
                  {isArabic ? "إزالة" : "Remove"}
                </Button>
              )}
            </div>
            {appliedDiscount && (
              <p className="text-sm text-green-600 font-medium">
                ✓ {isArabic ? appliedDiscount.description_ar : appliedDiscount.description_en}
              </p>
            )}
          </div>

          {/* Payment Method Selection */}
          {paymentMethods.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold text-slate-800">
                {isArabic ? "اختر طريقة الدفع" : "Select Payment Method"}
              </Label>
              <div className="grid gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isArabic ? 'text-right' : 'text-left'} hover:shadow-md ${
                      selectedMethod?.id === method.id
                        ? 'border-purple-600 bg-purple-50 shadow-md'
                        : 'border-slate-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {method.logo_url && (
                        <div className="w-14 h-14 rounded-lg bg-white border-2 border-slate-100 flex items-center justify-center p-2 flex-shrink-0">
                          <img src={method.logo_url} alt={method.name_en} className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 text-lg">
                          {isArabic ? method.name_ar : method.name_en}
                        </div>
                      </div>
                      {selectedMethod?.id === method.id && (
                        <CheckCircle2 className="w-6 h-6 text-purple-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method Details */}
          {selectedMethod && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3 text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                {isArabic ? "تفاصيل التحويل" : "Transfer Details"}
              </h3>
              <div className="space-y-2">
                {Object.entries(selectedMethod.description || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-blue-100 last:border-0">
                    <span className="font-semibold text-slate-700">{key}:</span>
                    <span className="text-slate-900 font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Invoice Section */}
          <div className="space-y-3">
            <Label htmlFor="invoice" className="text-base font-semibold text-slate-800">
              {isArabic ? "رفع صورة الإيصال" : "Upload Receipt"}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            
            {!invoiceFile ? (
              <label 
                htmlFor="invoice" 
                className="flex flex-col items-center justify-center w-full h-40 border-3 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-purple-400 transition-all"
              >
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                    <ImageIcon className="w-7 h-7 text-purple-600" />
                  </div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    {isArabic ? "انقر لرفع الصورة" : "Click to upload image"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isArabic ? "PNG، JPG حتى 5 ميجابايت" : "PNG, JPG up to 5MB"}
                  </p>
                </div>
                <Input
                  id="invoice"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-300 rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-green-900 truncate">{invoiceFile.name}</p>
                    <p className="text-sm text-green-700">{(invoiceFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button
                    onClick={() => setInvoiceFile(null)}
                    className="p-2 hover:bg-green-200 rounded-lg transition-colors"
                    disabled={isUploading}
                  >
                    <X className="w-5 h-5 text-green-700" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Alert */}
          <Alert className="bg-amber-50 border-2 border-amber-200">
            <Clock className="h-5 w-5 text-amber-600" />
            <AlertDescription className={`text-sm text-amber-900 ${isArabic ? 'mr-2' : 'ml-2'}`}>
              {isArabic 
                ? "سيتم مراجعة طلبك من قبل الإدارة خلال 24 ساعة. سيتم إضافة الأرصدة بعد التأكد من صحة التحويل."
                : "Your request will be reviewed within 24 hours. Credits will be added after verifying the transfer."
              }
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isUploading}
            className="h-11 px-6"
          >
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isUploading || !invoiceFile} 
            className="bg-purple-600 hover:bg-purple-700 text-white h-11 px-6 gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isArabic ? "جارٍ الإرسال..." : "Submitting..."}
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                {isArabic ? "إرسال الطلب" : "Submit Request"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}