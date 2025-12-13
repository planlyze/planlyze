import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, FileText, Wallet, AlertCircle, Mail, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

const notificationTypes = [
  {
    id: "analysis_complete",
    icon: FileText,
    titleEn: "Analysis Complete",
    titleAr: "اكتمال التحليل",
    descEn: "Get notified when your analysis report is ready",
    descAr: "احصل على إشعار عند جاهزية تقرير التحليل"
  },
  {
    id: "analysis_failed",
    icon: AlertCircle,
    titleEn: "Analysis Failed",
    titleAr: "فشل التحليل",
    descEn: "Get notified if an analysis fails to complete",
    descAr: "احصل على إشعار في حال فشل التحليل"
  },
  {
    id: "credits_low",
    icon: Wallet,
    titleEn: "Low Credits",
    titleAr: "رصيد منخفض",
    descEn: "Get notified when your credits are running low",
    descAr: "احصل على إشعار عند انخفاض رصيدك"
  },
  {
    id: "credits_purchased",
    icon: Sparkles,
    titleEn: "Credits Purchased",
    titleAr: "شراء الأرصدة",
    descEn: "Get notified when credits are added to your account",
    descAr: "احصل على إشعار عند إضافة أرصدة لحسابك"
  },
  {
    id: "payment_approved",
    icon: Check,
    titleEn: "Payment Approved",
    titleAr: "الموافقة على الدفع",
    descEn: "Get notified when your payment is approved",
    descAr: "احصل على إشعار عند الموافقة على دفعتك"
  },
  {
    id: "payment_rejected",
    icon: AlertCircle,
    titleEn: "Payment Rejected",
    titleAr: "رفض الدفع",
    descEn: "Get notified if your payment is rejected",
    descAr: "احصل على إشعار في حال رفض دفعتك"
  },
  {
    id: "system",
    icon: Bell,
    titleEn: "System Updates",
    titleAr: "تحديثات النظام",
    descEn: "Get notified about important system updates",
    descAr: "احصل على إشعارات حول تحديثات النظام المهمة"
  }
];

export default function NotificationPreferences({ user, onUpdate, isArabic = false }) {
  const [preferences, setPreferences] = useState(user?.notification_preferences || {
    analysis_complete: true,
    analysis_failed: true,
    credits_low: true,
    credits_purchased: true,
    payment_approved: true,
    payment_rejected: true,
    system: true,
    email_notifications: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({ notification_preferences: preferences });
      toast.success(isArabic ? "تم حفظ التفضيلات" : "Preferences saved successfully");
      if (onUpdate) onUpdate(preferences);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error(isArabic ? "فشل حفظ التفضيلات" : "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-2 border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-purple-600" />
          {isArabic ? "تفضيلات الإشعارات" : "Notification Preferences"}
        </CardTitle>
        <CardDescription>
          {isArabic 
            ? "اختر الإشعارات التي تريد تلقيها"
            : "Choose which notifications you want to receive"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email notifications toggle */}
        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">
                {isArabic ? "إشعارات البريد الإلكتروني" : "Email Notifications"}
              </p>
              <p className="text-sm text-slate-500">
                {isArabic 
                  ? "تلقي الإشعارات عبر البريد الإلكتروني"
                  : "Receive notifications via email"
                }
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.email_notifications}
            onCheckedChange={() => handleToggle("email_notifications")}
          />
        </div>

        {/* Individual notification types */}
        <div className="space-y-4">
          {notificationTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div key={type.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <Label htmlFor={type.id} className="font-medium text-slate-700 cursor-pointer">
                      {isArabic ? type.titleAr : type.titleEn}
                    </Label>
                    <p className="text-xs text-slate-500">
                      {isArabic ? type.descAr : type.descEn}
                    </p>
                  </div>
                </div>
                <Switch
                  id={type.id}
                  checked={preferences[type.id] !== false}
                  onCheckedChange={() => handleToggle(type.id)}
                />
              </div>
            );
          })}
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isSaving 
            ? (isArabic ? "جاري الحفظ..." : "Saving...") 
            : (isArabic ? "حفظ التفضيلات" : "Save Preferences")
          }
        </Button>
      </CardContent>
    </Card>
  );
}