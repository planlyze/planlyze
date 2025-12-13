import React from "react";
import MarkdownText from "../common/MarkdownText";

export default function BusinessModelRevenue({ report = {}, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);
  const streams = Array.isArray(report?.revenue_streams) ? report.revenue_streams : [];

  return (
    <div className="glass-effect border rounded-xl p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">{t("Business Model & Revenue", "نموذج العمل والإيرادات")}</h2>
      {report?.business_model && <MarkdownText text={report.business_model} />}
      {streams.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-slate-700">{t("Revenue Streams", "مصادر الإيرادات")}</h3>
          <ul className="list-disc ml-5 text-slate-700">
            {streams.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}