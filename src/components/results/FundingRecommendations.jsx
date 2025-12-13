
import React from "react";
import MarkdownText from "../common/MarkdownText";

export default function FundingRecommendations({ report = {}, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);

  const toMarkdown = (val) => {
    if (val == null) return "";
    if (typeof val === "string") return val.trim();
    if (Array.isArray(val)) {
      return val.filter(Boolean).map((i) => `- ${typeof i === "string" ? i : String(i)}`).join("\n");
    }
    if (typeof val === "object") {
      const flat = [];
      for (const v of Object.values(val)) {
        if (Array.isArray(v)) flat.push(...v);
        else if (v) flat.push(v);
      }
      if (flat.length) {
        return flat.filter(Boolean).map((i) => `- ${typeof i === "string" ? i : String(i)}`).join("\n");
      }
      try { return "```\n" + JSON.stringify(val, null, 2) + "\n```"; } catch { return String(val); }
    }
    return String(val);
  };

  const md = toMarkdown(report?.funding_recommendations);

  return (
    <div className="glass-effect border rounded-xl p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">{t("Funding Recommendations", "توصيات التمويل")}</h2>
      {md ? <div className="prose prose-sm max-w-none"><MarkdownText text={md} /></div> : <p className="text-slate-600">—</p>}
    </div>
  );
}
