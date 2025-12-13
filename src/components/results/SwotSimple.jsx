import React from "react";
import MarkdownText from "../common/MarkdownText";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function SwotSimple({ report = {}, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);
  const swot = report?.swot_analysis || {};

  // Converts various AI outputs (string/array/object) into markdown
  const toMarkdown = (val) => {
    if (val == null) return "";
    if (typeof val === "string") return val.trim();
    if (Array.isArray(val)) {
      return val.filter(Boolean).map((i) => `- ${typeof i === "string" ? i : String(i)}`).join("\n");
    }
    if (typeof val === "object") {
      // Try to collect values into a bullet list
      const flat = [];
      for (const v of Object.values(val)) {
        if (Array.isArray(v)) flat.push(...v);
        else if (v) flat.push(v);
      }
      if (flat.length) {
        return flat.filter(Boolean).map((i) => `- ${typeof i === "string" ? i : String(i)}`).join("\n");
      }
      try {
        return "```\n" + JSON.stringify(val, null, 2) + "\n```";
      } catch {
        return String(val);
      }
    }
    return String(val);
  };

  const sections = [
    { key: "strengths", label: t("Strengths", "نقاط القوة"), color: "#10b981", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
    { key: "weaknesses", label: t("Weaknesses", "نقاط الضعف"), color: "#ef4444", bgColor: "bg-red-50", borderColor: "border-red-200" },
    { key: "opportunities", label: t("Opportunities", "الفرص"), color: "#3b82f6", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
    { key: "threats", label: t("Threats", "التهديدات"), color: "#f59e0b", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
  ];

  // Count items for pie chart
  const countItems = (val) => {
    if (!val) return 0;
    if (Array.isArray(val)) return val.length;
    if (typeof val === "string") return val.split(/[-•\n]/).filter(s => s.trim()).length;
    if (typeof val === "object") return Object.keys(val).length;
    return 1;
  };

  const pieData = sections.map(s => ({
    name: s.label,
    value: countItems(swot[s.key]) || 1,
    color: s.color
  })).filter(d => d.value > 0);

  return (
    <div className="glass-effect border rounded-xl p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">{t("SWOT Analysis", "تحليل SWOT")}</h2>
      
      {/* Visual Pie Chart */}
      {pieData.length > 0 && (
        <div className="h-48 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} ${t("items", "عناصر")}`, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 flex-wrap">
            {sections.map(s => (
              <div key={s.key} className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-slate-600">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {sections.map((s) => {
          const md = toMarkdown(swot[s.key]);
          return (
            <div key={s.key} className={`p-4 rounded-xl border-2 ${s.bgColor} ${s.borderColor}`}>
              <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}
              </h3>
              {md ? (
                <div className="prose prose-sm max-w-none">
                  <MarkdownText text={md} />
                </div>
              ) : (
                <p className="text-slate-600">—</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}