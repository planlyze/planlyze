import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Crown, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UpgradePrompt({ 
  isArabic = false, 
  variant = "card", 
  feature = null,
  userCredits = 0,
  onUpgrade = null,
  isUpgrading = false,
  premiumCost = 1
}) {
  const creditWord = isArabic ? "رصيد" : (premiumCost === 1 ? "Credit" : "Credits");
  const premiumFeatures = [
    isArabic ? "تحليل المنافسين الكامل" : "Full competitor analysis",
    isArabic ? "بيانات السوق السوري" : "Syrian market data",
    isArabic ? "توقعات الذكاء الاصطناعي" : "AI predictions",
    isArabic ? "تصدير PDF/Excel" : "PDF/Excel export"
  ];

  const hasCredits = userCredits >= premiumCost;

  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-orange-600 text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6" />
            <div>
              <p className="font-bold">
                {isArabic ? "الترقية للوصول المتميز" : "Upgrade for Premium Access"}
              </p>
              <p className="text-sm opacity-90">
                {isArabic ? "احصل على ميزات متقدمة مع التقارير المتميزة" : "Unlock advanced features with premium reports"}
              </p>
            </div>
          </div>
          {hasCredits && onUpgrade ? (
            <Button 
              variant="secondary" 
              size="lg"
              onClick={onUpgrade}
              disabled={isUpgrading}
            >
              {isUpgrading 
                ? (isArabic ? "جارٍ الترقية..." : "Upgrading...") 
                : (isArabic ? `استخدم ${premiumCost} ${creditWord} (${userCredits} متاح)` : `Use ${premiumCost} ${creditWord} (${userCredits} available)`)
              }
            </Button>
          ) : (
            <Link to={createPageUrl("Credits")}>
              <Button variant="secondary" size="lg">
                {isArabic ? "اشترِ الأرصدة" : "Buy Credits"}
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 text-center">
        <Lock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
        <p className="font-semibold text-slate-800 mb-1">
          {feature || (isArabic ? "ميزة متميزة مقفلة" : "Premium Feature Locked")}
        </p>
        <p className="text-sm text-slate-600 mb-3">
          {hasCredits 
            ? (isArabic ? "استخدم رصيداً لفتح هذه الميزة" : "Use a credit to unlock this feature")
            : (isArabic ? "اشترِ رصيداً متميزاً للوصول لهذه الميزة" : "Purchase a premium credit to unlock this feature")
          }
        </p>
        {hasCredits && onUpgrade ? (
          <Button 
            size="sm" 
            className="gradient-primary text-white"
            onClick={onUpgrade}
            disabled={isUpgrading}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isUpgrading 
              ? (isArabic ? "جارٍ..." : "Upgrading...") 
              : (isArabic ? `استخدم ${premiumCost} ${creditWord} (${userCredits})` : `Use ${premiumCost} ${creditWord} (${userCredits})`)
            }
          </Button>
        ) : (
          <Link to={createPageUrl("Credits")}>
            <Button size="sm" className="gradient-primary text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              {isArabic ? "اشترِ الأرصدة" : "Buy Credits"}
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // Default card variant
  return (
    <Card className="glass-effect border-2 border-purple-200 shadow-lg">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl">
          {isArabic ? "الترقية للميزات المتميزة" : "Upgrade to Premium"}
        </CardTitle>
        <CardDescription className="text-base">
          {isArabic ? "احصل على وصول كامل لجميع الميزات المتقدمة" : "Get full access to all advanced features"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {premiumFeatures.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-slate-700">{feature}</span>
            </div>
          ))}
        </div>
        
        <div className="pt-4 space-y-2">
          <Link to={createPageUrl("Credits")}>
            <Button className="w-full gradient-primary text-white" size="lg">
              <Crown className="w-4 h-4 mr-2" />
              {isArabic ? "اشترِ الأرصدة" : "Buy Credits"}
            </Button>
          </Link>
          
          <div className="text-center">
            <Badge variant="outline" className="text-slate-600">
              {isArabic ? "من $10 للتقرير الواحد" : "From $10 per report"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}