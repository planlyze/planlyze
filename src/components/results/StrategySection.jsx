import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, ListChecks, ArrowRight, Clock } from "lucide-react";

export default function StrategySection({ data, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);

  if (!data) {
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <p className="text-slate-500">{t("No strategy data available.", "لا تتوفر بيانات الاستراتيجية.")}</p>
        </CardContent>
      </Card>
    );
  }

  const riskAssessment = data.risk_assessment || [];
  const actionPlan = data.action_plan || [];

  const severityColors = {
    high: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", icon: "text-red-500" },
    medium: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", icon: "text-amber-500" },
    low: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", icon: "text-green-500" }
  };

  const priorityColors = {
    high: "bg-red-100 text-red-700 border-red-300",
    medium: "bg-amber-100 text-amber-700 border-amber-300",
    low: "bg-green-100 text-green-700 border-green-300"
  };

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-rose-600 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            {t("Risk Assessment & Mitigation", "تقييم المخاطر والتخفيف")}
          </h2>
        </div>
        <CardContent className="p-6">
          {riskAssessment.length > 0 ? (
            <div className="space-y-4">
              {riskAssessment.map((risk, idx) => {
                const colors = severityColors[risk.severity?.toLowerCase()] || severityColors.medium;
                return (
                  <div key={idx} className={`rounded-xl p-5 border-2 ${colors.border} ${colors.bg}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg} border ${colors.border}`}>
                        <AlertTriangle className={`w-5 h-5 ${colors.icon}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-slate-800">{risk.risk}</h4>
                          <Badge className={`${colors.bg} ${colors.text} border ${colors.border}`}>
                            {risk.severity}
                          </Badge>
                        </div>
                        {risk.impact && (
                          <p className="text-slate-600 text-sm mb-3">
                            <span className="font-medium">{t("Impact", "التأثير")}:</span> {risk.impact}
                          </p>
                        )}
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <div className="flex items-start gap-2">
                            <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-emerald-600 mb-1">{t("Mitigation Strategy", "استراتيجية التخفيف")}</p>
                              <p className="text-slate-700 text-sm">{risk.mitigation}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">{t("No risk assessment available.", "لا يتوفر تقييم للمخاطر.")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-effect border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <ListChecks className="w-6 h-6" />
            {t("Action Plan", "خطة العمل")}
          </h2>
        </div>
        <CardContent className="p-6">
          {actionPlan.length > 0 ? (
            <div className="space-y-4">
              {actionPlan.map((step, idx) => (
                <div key={idx} className="relative">
                  {idx < actionPlan.length - 1 && (
                    <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-emerald-200"></div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg">
                      {step.step_number || idx + 1}
                    </div>
                    <div className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-lg text-slate-800">{step.title}</h4>
                        {step.priority && (
                          <Badge className={`${priorityColors[step.priority?.toLowerCase()] || priorityColors.medium}`}>
                            {step.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-600 mb-3">{step.description}</p>
                      {step.timeline && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="w-4 h-4" />
                          <span>{step.timeline}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">{t("No action plan available.", "لا توجد خطة عمل.")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
