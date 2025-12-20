import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export default function ReportFooter({ analysis, isArabic = false }) {
  const projectName = analysis?.business_idea || (isArabic ? "المشروع" : "the project");
  const currentDate = format(new Date(), "MMMM d, yyyy");

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardContent className="p-6">
        <p className="italic text-slate-600">
          {isArabic
            ? `يمثل هذا التحليل تقييماً شاملاً لـ ${projectName}، آخذًا في الاعتبار ظروف السوق والمتطلبات التقنية واستراتيجيات التنفيذ حتى تاريخ ${currentDate}.`
            : `This analysis represents a comprehensive evaluation of ${projectName}, considering market conditions, technical requirements, and implementation strategies as of ${currentDate}.`}
        </p>
      </CardContent>
    </Card>
  );
}
