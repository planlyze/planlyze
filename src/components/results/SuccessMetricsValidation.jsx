import React from "react";
import MarkdownText from "../common/MarkdownText";

export default function SuccessMetricsValidation({ report = {}, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);
  const listify = (v) => Array.isArray(v) ? v.filter(Boolean) : (v ? String(v).split(/\r?\n|,/).map(s=>s.trim()).filter(Boolean) : []);
  const metrics = listify(report?.success_metrics);

  return (
    <div className="glass-effect border rounded-xl p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">{t("Success Metrics & Validation", "مقاييس النجاح والتحقق")}</h2>
      {metrics.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-slate-700">{t("Key Performance Indicators (KPIs)", "مؤشرات الأداء الرئيسية")}</h3>
          <ul className="list-disc ml-5 text-slate-700">{metrics.map((m,i)=><li key={i}>{m}</li>)}</ul>
        </div>
      )}
      {report?.validation_methodology && (
        <div>
          <h3 className="font-semibold text-slate-700">{t("Validation Methodology", "منهجية التحقق")}</h3>
          <MarkdownText text={report.validation_methodology} />
        </div>
      )}
    </div>
  );
}