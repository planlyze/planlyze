import React from "react";

export default function TargetAudience({ report = {}, isArabic = false, isReportArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);
  const ta = report?.problem_solution_framework?.target_audience || {};
  const listify = (v) => Array.isArray(v) ? v.filter(Boolean) : (v ? String(v).split(/\r?\n|,/).map(s=>s.trim()).filter(Boolean) : []);

  return (
    <div className="glass-effect border rounded-xl p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">jkjkjkjkjkjjkjk {t("Target Audience", "الجمهور المستهدف")}</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-slate-500">{t("Demographics", "الخصائص الديموغرافية")}</div>
          <ul className="list-disc ml-5 text-slate-700">{listify(ta.demographics).map((i, idx) => <li key={idx}>{i}</li>)}</ul>
        </div>
        <div>
          <div className="text-sm text-slate-500">{t("Psychographics", "الخصائص السلوكية")}</div>
          <ul className="list-disc ml-5 text-slate-700">{listify(ta.psychographics).map((i, idx) => <li key={idx}>{i}</li>)}</ul>
        </div>
        <div>
          <div className="text-sm text-slate-500">{t("Pain Points", "نقاط الألم")}</div>
          <ul className="list-disc ml-5 text-slate-700">{listify(ta.pain_points).map((i, idx) => <li key={idx}>{i}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}