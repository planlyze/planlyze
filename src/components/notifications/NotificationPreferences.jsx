import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { auth } from "@/api/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Bell,
  FileText,
  Wallet,
  AlertCircle,
  Mail,
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const notificationTypes = [
  {
    id: "analysis_complete",
    icon: FileText,
    titleKey: "analysisComplete",
    descKey: "analysisCompleteDesc",
  },
  {
    id: "analysis_failed",
    icon: AlertCircle,
    titleKey: "analysisFailed",
    descKey: "analysisFailedDesc",
  },
  {
    id: "credits_low",
    icon: Wallet,
    titleKey: "lowCredits",
    descKey: "lowCreditsDesc",
  },
  {
    id: "credits_purchased",
    icon: Sparkles,
    titleKey: "creditsPurchased",
    descKey: "creditsPurchasedDesc",
  },
  {
    id: "payment_approved",
    icon: Check,
    titleKey: "paymentApproved",
    descKey: "paymentApprovedDesc",
  },
  {
    id: "payment_rejected",
    icon: AlertCircle,
    titleKey: "paymentRejected",
    descKey: "paymentRejectedDesc",
  },
  {
    id: "system",
    icon: Bell,
    titleKey: "systemUpdates",
    descKey: "systemUpdatesDesc",
  },
];

export default function NotificationPreferences({ user, onUpdate }) {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState(
    user?.notification_preferences || {
      analysis_complete: true,
      analysis_failed: true,
      credits_low: true,
      credits_purchased: true,
      payment_approved: true,
      payment_rejected: true,
      system: true,
      email_notifications: true,
    }
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await auth.updateProfile({ notification_preferences: preferences });
      toast.success(t("notifications.preferencesSaved"));
      if (onUpdate) onUpdate(preferences);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error(t("notifications.preferencesSaveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-2 border-slate-200 dark:border-gray-700 shadow-xl dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-purple-600" />
          {t("notifications.preferencesTitle")}
        </CardTitle>
        <CardDescription>
          {t("notifications.preferencesSubtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">
                {t("notifications.emailNotifications")}
              </p>
              <p className="text-sm text-slate-500">
                {t("notifications.emailNotificationsDesc")}
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.email_notifications}
            onCheckedChange={() => handleToggle("email_notifications")}
          />
        </div>

        <div className="space-y-4">
          {notificationTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.id}
                className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <Label
                      htmlFor={type.id}
                      className="font-medium text-slate-700 cursor-pointer dark:text-white" 
                    >
                      {t(`notifications.${type.titleKey}`)}
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t(`notifications.${type.descKey}`)}
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
            ? t("notifications.savingPreferences")
            : t("notifications.savePreferences")}
        </Button>
      </CardContent>
    </Card>
  );
}
