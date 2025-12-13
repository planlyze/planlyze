import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export default function ReportFooter({ analysis, businessReport, technicalReport, isArabic = false }) {
  const projectName = analysis?.business_idea || (isArabic ? "المشروع" : "the project");
  const currentDate = format(new Date(), "MMMM d, yyyy");

  // Immediate Actions: take first two from MVP launch plan, fallback to defaults
  const plan = Array.isArray(technicalReport?.mvp_launch_action_plan)
    ? technicalReport.mvp_launch_action_plan.filter(Boolean)
    : [];
  const defaultActions = isArabic
    ? ["تحديد نطاق MVP بوضوح وتسلسل الأولويات", "إجراء مقابلات سريعة مع 5 مستخدمين مستهدفين للتحقق من الفرضيات"]
    : ["Define MVP scope clearly and prioritize features", "Conduct quick interviews with 5 target users to validate assumptions"];
  const actions = [...plan.slice(0, 2)];
  while (actions.length < 2) actions.push(defaultActions[actions.length]);

  // Success Factors: take two from key_opportunities or fallbacks
  const rawOpp = businessReport?.key_opportunities;
  const opportunities = Array.isArray(rawOpp)
    ? rawOpp.filter(Boolean)
    : (rawOpp ? String(rawOpp).split(/\r?\n|,/).map(s => s.trim()).filter(Boolean) : []);
  const defaultFactors = isArabic
    ? ["ملاءمة قوية مع حاجة السوق الحقيقية", "استراتيجية دخول سوق واضحة وقابلة للتنفيذ"]
    : ["Strong alignment with a real market pain point", "Clear and executable go-to-market strategy"];
  const factors = opportunities.slice(0, 2);
  while (factors.length < 2) factors.push(defaultFactors[factors.length]);

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardContent className="space-y-4 p-6">
        <h3 className="text-lg font-semibold text-slate-800">
          {isArabic ? "الإجراءات الفورية" : "Immediate Actions"}
        </h3>
        <ol className="list-decimal ps-6 space-y-1 text-slate-700">
          {actions.map((a, i) => <li key={i}>{a}</li>)}
        </ol>

        <h3 className="text-lg font-semibold text-slate-800 mt-4">
          {isArabic ? "عوامل النجاح" : "Success Factors"}
        </h3>
        <ul className="list-disc ps-6 space-y-1 text-slate-700">
          {factors.map((f, i) => <li key={i}>{f}</li>)}
        </ul>

        <hr className="my-4 border-slate-200/70" />

        <p className="italic text-slate-600">
          {isArabic
            ? `يمثل هذا التحليل تقييماً شاملاً لـ ${projectName}، آخذًا في الاعتبار ظروف السوق والمتطلبات التقنية واستراتيجيات التنفيذ حتى تاريخ ${currentDate}.`
            : `This analysis represents a comprehensive evaluation of ${projectName}, considering market conditions, technical requirements, and implementation strategies as of ${currentDate}.`}
        </p>
      </CardContent>
    </Card>
  );
}