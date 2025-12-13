import React from "react";
import MarkdownText from "../common/MarkdownText";

export default function TechnicalImplementation({ report = {}, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);
  const stack = report?.technology_stack || {};
  const listify = (v) => Array.isArray(v) ? v.filter(Boolean) : (v ? String(v).split(/\r?\n|,/).map(s=>s.trim()).filter(Boolean) : []);

  return (
    <div className="glass-effect border rounded-xl p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">{t("Technical Implementation", "التنفيذ التقني")}</h2>

      {Object.keys(stack).length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stack.frontend && <div><div className="text-xs text-slate-500">Frontend</div><MarkdownText text={String(stack.frontend)} /></div>}
          {stack.backend && <div><div className="text-xs text-slate-500">Backend</div><MarkdownText text={String(stack.backend)} /></div>}
          {stack.database && <div><div className="text-xs text-slate-500">Database</div><MarkdownText text={String(stack.database)} /></div>}
          {stack.cloud && <div><div className="text-xs text-slate-500">Cloud</div><MarkdownText text={String(stack.cloud)} /></div>}
        </div>
      )}

      {report?.architecture_overview && (
        <div className="mt-4">
          <h3 className="font-semibold text-slate-700">{t("Architecture Overview", "نظرة عامة على البنية")}</h3>
          <MarkdownText text={report.architecture_overview} />
        </div>
      )}

      {report?.security_considerations && (
        <div className="mt-4">
          <h3 className="font-semibold text-slate-700">{t("Security Considerations", "الاعتبارات الأمنية")}</h3>
          <MarkdownText text={report.security_considerations} />
        </div>
      )}

      {report?.integrations && listify(report.integrations).length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-slate-700">{t("Integrations", "التكاملات")}</h3>
          <ul className="list-disc ml-5 text-slate-700">
            {listify(report.integrations).map((i, idx) => <li key={idx}>{i}</li>)}
          </ul>
        </div>
      )}

      {report?.technical_risks && (
        <div className="mt-4">
          <h3 className="font-semibold text-slate-700">{t("Technical Risks", "المخاطر التقنية")}</h3>
          <MarkdownText text={report.technical_risks} />
        </div>
      )}
    </div>
  );
}