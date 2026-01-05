import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LockedContent({ 
  title, 
  description, 
  isArabic = false, 
  onUnlock,
  isUnlocking = false,
  variant = "card",
  premiumCost = 1
}) {
  const t = (en, ar) => (isArabic ? ar : en);
  const creditWord = isArabic ? "رصيد" : (premiumCost === 1 ? "Credit" : "Credits");

  if (variant === "inline") {
    return (
      <div className="relative rounded-xl border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50/50 to-violet-50/50 p-6">
        <div className="absolute inset-0 backdrop-blur-[2px] rounded-xl"></div>
        <div className="relative flex flex-col items-center justify-center text-center py-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center mb-3 shadow-lg">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-semibold text-slate-800 mb-1">{title}</h4>
          <p className="text-sm text-slate-600 mb-4 max-w-xs">
            {description || t("Upgrade to premium to unlock this content", "قم بالترقية للحصول على هذا المحتوى")}
          </p>
          {onUnlock && (
            <Button 
              onClick={onUnlock}
              disabled={isUnlocking}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
            >
              {isUnlocking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t("Processing...", "جاري المعالجة...")}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isArabic ? `افتح بـ ${premiumCost} ${creditWord}` : `Unlock with ${premiumCost} ${creditWord}`}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50/50 to-violet-50/50 overflow-hidden">
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-600 mb-6 max-w-md">
            {description || t("This content is available for premium reports only. Upgrade to unlock detailed insights and analysis.", "هذا المحتوى متاح للتقارير المتميزة فقط. قم بالترقية لإلغاء قفل الرؤى والتحليلات التفصيلية.")}
          </p>
          {onUnlock && (
            <Button 
              onClick={onUnlock}
              disabled={isUnlocking}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
            >
              {isUnlocking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t("Processing...", "جاري المعالجة...")}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isArabic ? `افتح بـ ${premiumCost} ${creditWord}` : `Unlock with ${premiumCost} ${creditWord}`}
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
