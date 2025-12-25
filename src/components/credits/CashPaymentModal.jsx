import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  CheckCircle2,
  Info,
  Wallet,
  Image as ImageIcon,
  Clock,
  X,
  DollarSign,
} from "lucide-react";
import {
  auth,
  api,
  Analysis,
  Payment,
  PaymentMethod,
  User,
  AI,
  DiscountCode,
} from "@/api/client";
import { toast } from "sonner";
import { logPaymentSubmitted } from "@/components/utils/activityHelper";

export default function CashPaymentModal({
  isOpen,
  onClose,
  selectedPackage,
  userEmail,
  isArabic,
}) {
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  React.useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
      loadCurrencies();
      setDiscountCode("");
      setAppliedDiscount(null);
      setInvoiceFile(null);
    }
  }, [isOpen]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await PaymentMethod.filter(
        { is_active: true },
        "sort_order"
      );
      console.log("Loaded payment methods:", methods);
      setPaymentMethods(methods);
      if (methods.length > 0) {
        setSelectedMethod(methods[0]);
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
    }
  };

  const loadCurrencies = async () => {
    try {
      const response = await api.get('/currencies');
      const currencyList = response.data || [];
      setCurrencies(currencyList);
      const defaultCurrency = currencyList.find(c => c.is_default) || currencyList.find(c => c.code === 'USD') || currencyList[0];
      if (defaultCurrency) {
        setSelectedCurrency(defaultCurrency);
      }
    } catch (error) {
      console.error("Error loading currencies:", error);
    }
  };

  const calculateCurrencyAmount = () => {
    const finalAmount = calculateFinalAmount();
    if (!selectedCurrency || selectedCurrency.code === 'USD') {
      return finalAmount;
    }
    return finalAmount * selectedCurrency.exchange_rate;
  };

  const formatCurrencyAmount = (amount, currency) => {
    if (!currency) return `$${amount.toFixed(2)}`;
    if (currency.code === 'USD') return `$${amount.toFixed(2)}`;
    const formattedAmount = amount >= 1000 
      ? amount.toLocaleString('en-US', { maximumFractionDigits: 2 })
      : amount.toFixed(2);
    return `${currency.symbol} ${formattedAmount}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(
          isArabic
            ? "الملف كبير جداً (الحد الأقصى 5 ميجابايت)"
            : "File too large (max 5MB)"
        );
        return;
      }
      setInvoiceFile(file);
    }
  };

  const validateDiscount = async () => {
    if (!discountCode.trim()) return;

    const packagePrice = selectedPackage?.price_usd || selectedPackage?.price || 0;
    
    setIsValidating(true);
    try {
      const discount = await DiscountCode.validate(discountCode.toUpperCase(), packagePrice);

      setAppliedDiscount(discount);
      toast.success(isArabic ? "تم تطبيق الخصم!" : "Discount applied!");
    } catch (error) {
      console.error("Error validating discount:", error);
      const errorMsg = error?.response?.data?.error || error?.message || "";
      const errorMsgAr = error?.response?.data?.error_ar || "";
      if (errorMsg.includes("not yet valid")) {
        toast.error(isArabic ? "الكود غير نشط بعد" : "Code is not active yet");
      } else if (errorMsg.includes("expired")) {
        toast.error(isArabic ? "الكود منتهي الصلاحية" : "Code has expired");
      } else if (errorMsg.includes("maximum uses")) {
        toast.error(
          isArabic ? "تم استخدام الكود بالكامل" : "Code has been fully used"
        );
      } else if (errorMsg.includes("Minimum purchase")) {
        toast.error(isArabic ? errorMsgAr || errorMsg : errorMsg);
      } else if (errorMsg.includes("Invalid")) {
        toast.error(isArabic ? "كود الخصم غير صالح" : "Invalid discount code");
      } else {
        toast.error(
          isArabic ? "فشل التحقق من الكود" : "Failed to validate code"
        );
      }
      setAppliedDiscount(null);
    } finally {
      setIsValidating(false);
    }
  };

  const calculateFinalAmount = () => {
    const packagePrice =
      selectedPackage?.price_usd || selectedPackage?.price || 0;
    if (!appliedDiscount) return packagePrice;

    if (appliedDiscount.discount_percent) {
      return packagePrice * (1 - appliedDiscount.discount_percent / 100);
    } else if (appliedDiscount.discount_amount) {
      return Math.max(0, packagePrice - appliedDiscount.discount_amount);
    }
    return packagePrice;
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!invoiceFile) {
      toast.error(
        isArabic ? "يرجى رفع صورة الفاتورة" : "Please upload invoice image"
      );
      return;
    }

    setIsUploading(true);
    try {
      const base64Image = await fileToBase64(invoiceFile);

      const finalAmount = calculateFinalAmount();

      const packagePrice =
        selectedPackage?.price_usd || selectedPackage?.price || 0;
      const discountAmt = appliedDiscount
        ? Math.max(0, Math.round((packagePrice - finalAmount) * 100) / 100)
        : null;

      await Payment.create({
        user_email: userEmail,
        amount_usd: finalAmount,
        original_amount: packagePrice,
        currency_code: selectedCurrency?.code || 'USD',
        currency_amount: calculateCurrencyAmount(),
        exchange_rate: selectedCurrency?.exchange_rate || 1.0,
        credits: selectedPackage.credits,
        payment_method:
          selectedMethod?.name_en || selectedMethod?.name_ar || "cash",
        payment_proof: base64Image,
        discount_code: appliedDiscount?.code || null,
        discount_amount: discountAmt,
      });

      toast.success(
        isArabic
          ? "تم إرسال الطلب بنجاح! سيتم مراجعته قريباً"
          : "Payment submitted! It will be reviewed shortly"
      );
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
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <DialogHeader className="space-y-3 pb-4 border-b dark:border-gray-700">
          <DialogTitle className="flex items-center gap-3 text-2xl text-slate-800 dark:text-white">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            {isArabic ? "إتمام عملية الدفع" : "Complete Payment"}
          </DialogTitle>
          <DialogDescription className="text-base text-slate-600 dark:text-gray-400">
            {isArabic
              ? "قم بتحويل المبلغ ثم ارفع صورة الإيصال للمراجعة"
              : "Transfer the amount and upload the receipt for review"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Package Details Card */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl p-5 border-2 border-purple-200 dark:border-purple-700 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">
                  {isArabic ? "الباقة المختارة" : "Selected Package"}
                </p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">
                  {isArabic
                    ? selectedPackage.name_ar || selectedPackage.name
                    : selectedPackage.name}
                </p>
              </div>
            </div>
            <div className="space-y-2 pt-3 border-t border-purple-200 dark:border-purple-700">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-gray-400">
                  {isArabic ? "الأرصدة:" : "Credits:"}
                </span>
                <span className="font-bold text-purple-700 dark:text-purple-400">
                  {selectedPackage.credits}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-gray-400">
                  {isArabic ? "السعر:" : "Price:"}
                </span>
                <span className="font-bold text-purple-700 dark:text-purple-400">
                  ${selectedPackage.price}
                </span>
              </div>
              {appliedDiscount && (
                <>
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>{isArabic ? "الخصم:" : "Discount:"}</span>
                    <span className="font-bold">
                      -
                      {appliedDiscount.discount_percent
                        ? `${appliedDiscount.discount_percent}%`
                        : `$${appliedDiscount.discount_amount || 0}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-green-600 dark:text-green-400 pt-2 border-t border-purple-200 dark:border-purple-700">
                    <span>{isArabic ? "المجموع:" : "Total:"}</span>
                    <span>${calculateFinalAmount().toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Currency Selection */}
          {currencies.length > 1 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                {isArabic ? "عملة الدفع" : "Payment Currency"}
              </Label>
              <Select
                value={selectedCurrency?.code || 'USD'}
                onValueChange={(code) => {
                  const currency = currencies.find(c => c.code === code);
                  setSelectedCurrency(currency);
                }}
              >
                <SelectTrigger className="h-12 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder={isArabic ? "اختر العملة" : "Select currency"} />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code} className="dark:text-white dark:focus:bg-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{currency.symbol}</span>
                        <span>{isArabic ? currency.name_ar || currency.name : currency.name}</span>
                        <span className="text-slate-500 dark:text-gray-400">({currency.code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCurrency && selectedCurrency.code !== 'USD' && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      {isArabic ? "المبلغ المطلوب:" : "Amount to pay:"}
                    </span>
                    <span className="text-lg font-bold text-blue-800 dark:text-blue-200">
                      {formatCurrencyAmount(calculateCurrencyAmount(), selectedCurrency)}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {isArabic 
                      ? `سعر الصرف: 1 USD = ${selectedCurrency.exchange_rate.toLocaleString()} ${selectedCurrency.code}`
                      : `Exchange rate: 1 USD = ${selectedCurrency.exchange_rate.toLocaleString()} ${selectedCurrency.code}`
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Discount Code */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-slate-800 dark:text-white">
              {isArabic ? "كود الخصم (اختياري)" : "Discount Code (Optional)"}
            </Label>
            <div className="flex gap-2">
              <Input
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder={isArabic ? "أدخل الكود" : "Enter code"}
                disabled={appliedDiscount || isUploading}
                className="flex-1 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
              {!appliedDiscount ? (
                <Button
                  onClick={validateDiscount}
                  disabled={isValidating || !discountCode.trim() || isUploading}
                  variant="outline"
                  className="h-12 px-6 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {isValidating
                    ? isArabic
                      ? "جارٍ..."
                      : "Checking..."
                    : isArabic
                    ? "تطبيق"
                    : "Apply"}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setDiscountCode("");
                    setAppliedDiscount(null);
                  }}
                  variant="outline"
                  className="h-12 px-6 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  disabled={isUploading}
                >
                  {isArabic ? "إزالة" : "Remove"}
                </Button>
              )}
            </div>
            {appliedDiscount && (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✓{" "}
                {isArabic
                  ? appliedDiscount.description_ar
                  : appliedDiscount.description_en}
              </p>
            )}
          </div>

          {/* Payment Method Selection */}
          {paymentMethods.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold text-slate-800 dark:text-white">
                {isArabic ? "اختر طريقة الدفع" : "Select Payment Method"}
              </Label>
              <div className="grid gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isArabic ? "text-right" : "text-left"
                    } hover:shadow-md ${
                      selectedMethod?.id === method.id
                        ? "border-purple-600 bg-purple-50 dark:bg-purple-900/30 shadow-md"
                        : "border-slate-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 bg-white dark:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {method.logo_url && (
                        <div className="w-14 h-14 rounded-lg bg-white dark:bg-gray-600 border-2 border-slate-100 dark:border-gray-500 flex items-center justify-center p-2 flex-shrink-0">
                          <img
                            src={method.logo_url}
                            alt={method.name_en}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 dark:text-white text-lg">
                          {isArabic ? method.name_ar : method.name_en}
                        </div>
                      </div>
                      {selectedMethod?.id === method.id && (
                        <CheckCircle2 className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method Details */}
          {selectedMethod && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-5 border-2 border-blue-200 dark:border-blue-700 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {isArabic ? "تفاصيل التحويل" : "Transfer Details"}
              </h3>
              <div className="space-y-2">
                {Object.entries(selectedMethod.details || {}).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-2 border-b border-blue-100 dark:border-blue-800 last:border-0"
                    >
                      <span className="font-semibold text-slate-700 dark:text-gray-300">
                        {key}:
                      </span>
                      <span className="text-slate-900 dark:text-white font-medium text-right">
                        {value}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
          {selectedMethod && (selectedMethod.instructions || selectedMethod.instructions_ar) && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-5 border-2 border-blue-200 dark:border-blue-700 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {isArabic ? "تعليمات التحويل" : "Transfer Instructions"}
              </h3>
              <div className="space-y-2">
                <div
                  key={"instruction"}
                  className="flex items-center justify-between py-2 border-b border-blue-100 dark:border-blue-800 last:border-0"
                >
                  <span className="text-slate-900 dark:text-white font-medium ">
                      {isArabic ? selectedMethod.instructions_ar : selectedMethod.instructions}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Upload Invoice Section */}
          <div className="space-y-3">
            <Label
              htmlFor="invoice"
              className="text-base font-semibold text-slate-800 dark:text-white"
            >
              {isArabic ? "رفع صورة الإيصال" : "Upload Receipt"}
              <span className="text-red-500 ml-1">*</span>
            </Label>

            {!invoiceFile ? (
              <label
                htmlFor="invoice"
                className="flex flex-col items-center justify-center w-full h-40 border-3 border-dashed border-slate-300 dark:border-gray-600 rounded-xl cursor-pointer bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-all"
              >
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-3">
                    <ImageIcon className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-gray-300">
                    {isArabic ? "انقر لرفع الصورة" : "Click to upload image"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {isArabic
                      ? "PNG، JPG حتى 5 ميجابايت"
                      : "PNG, JPG up to 5MB"}
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
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-green-900 dark:text-green-300 truncate">
                      {invoiceFile.name}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      {(invoiceFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => setInvoiceFile(null)}
                    className="p-2 hover:bg-green-200 dark:hover:bg-green-800 rounded-lg transition-colors"
                    disabled={isUploading}
                  >
                    <X className="w-5 h-5 text-green-700 dark:text-green-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Alert */}
          <Alert className="bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-200 dark:border-amber-700">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <AlertDescription
              className={`text-sm text-amber-900 dark:text-amber-300 ${isArabic ? "mr-2" : "ml-2"}`}
            >
              {isArabic
                ? "سيتم مراجعة طلبك من قبل الإدارة خلال 24 ساعة. سيتم إضافة الأرصدة بعد التأكد من صحة التحويل."
                : "Your request will be reviewed within 24 hours. Credits will be added after verifying the transfer."}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t dark:border-gray-700 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
            className="h-11 px-6 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
