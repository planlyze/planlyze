
import React from "react";
import MarkdownText from "../common/MarkdownText";

export default function DevelopmentPlan({ report = {}, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);
  const listify = (v) => Array.isArray(v) ? v.filter(Boolean) : (v ? String(v).split(/\r?\n|,/).map(s=>s.trim()).filter(Boolean) : []);
  const phases = listify(report?.development_phases);
  const features = listify(report?.mvp_core_features);
  const launch = listify(report?.mvp_launch_action_plan);
  const team = Array.isArray(report?.team_requirements) ? report.team_requirements.filter(Boolean) : listify(report?.team_requirements);

  return (
    <div className="glass-effect border rounded-xl p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">{t("Development Plan", "خطة التطوير")}</h2>
      {phases.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-slate-700">{t("Phases", "المراحل")}</h3>
          <ul className="list-disc ml-5 text-slate-700">{phases.map((p,i)=><li key={i}>{typeof p === 'object' ? JSON.stringify(p) : p}</li>)}</ul>
        </div>
      )}
      {features.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-slate-700">{t("MVP Core Features", "ميزات MVP الأساسية")}</h3>
          <ul className="list-disc ml-5 text-slate-700">{features.map((p,i)=><li key={i}>{typeof p === 'object' ? JSON.stringify(p) : p}</li>)}</ul>
        </div>
      )}
      {launch.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-slate-700">{t("MVP Launch Action Plan", "خطة إطلاق MVP")}</h3>
          <ul className="list-disc ml-5 text-slate-700">{launch.map((p,i)=><li key={i}>{typeof p === 'object' ? JSON.stringify(p) : p}</li>)}</ul>
        </div>
      )}
      {team.length > 0 && (
        <div className="mb-2">
          <h3 className="font-semibold text-slate-700">{t("Team Requirements", "متطلبات الفريق")}</h3>
          <ul className="list-disc ml-5 text-slate-700">
            {team.map((member, i) => {
              if (member == null) return null;
              if (typeof member === "string" || typeof member === "number") {
                return <li key={i}>{member}</li>;
              }
              if (typeof member === "object") {
                const role = member.role || member.title || (isArabic ? "الدور" : "Role");
                const resp = member.responsibilities ?? member.tasks ?? member.description ?? "";
                const respText = Array.isArray(resp) ? resp.join(", ") : (resp ? String(resp) : "");
                return (
                  <li key={i}>
                    <span className="font-medium">{role}</span>
                    {respText ? `: ${respText}` : ""}
                  </li>
                );
              }
              return <li key={i}>{String(member)}</li>;
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
