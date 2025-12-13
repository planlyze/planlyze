
import React from "react";
import MarkdownText from "../common/MarkdownText";

export default function ProblemSolutionFramework({ report = {}, isArabic = false }) {
  const psf = report?.problem_solution_framework || {};
  const t = (en, ar) => (isArabic ? ar : en);

  const listify = (v) => Array.isArray(v) ? v.filter(Boolean) : (v ? String(v).split(/\r?\n|,/).map(s=>s.trim()).filter(Boolean) : []);

  return (
    <div className="glass-effect border rounded-xl p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">{t("Problem & Solution Framework", "إطار المشكلة والحل")}</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-slate-700">{t("Core Problem", "المشكلة الأساسية")}</h3>
          <MarkdownText text={psf.core_problem || ""} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-700">{t("Solution Approach", "منهجية الحل")}</h3>
          <MarkdownText text={psf.solution_approach || ""} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-700">{t("Value Proposition", "عرض القيمة")}</h3>
          <MarkdownText text={psf.value_proposition || ""} />
        </div>
      </div>
    </div>
  );
}
