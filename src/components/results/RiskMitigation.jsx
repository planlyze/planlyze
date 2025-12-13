
import React from "react";
import MarkdownText from "../common/MarkdownText";

export default function RiskMitigation({ businessReport = {}, technicalReport = {}, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);

  // Normalize various AI outputs (string/array/object) into markdown
  const toMarkdown = (val) => {
    if (val == null) return "";
    if (typeof val === "string") return val.trim();
    if (Array.isArray(val)) {
      return val
        .filter(Boolean)
        .map((i) => `- ${typeof i === "string" ? i : String(i)}`)
        .join("\n");
    }
    if (typeof val === "object") {
      const flat = [];
      for (const v of Object.values(val)) {
        if (Array.isArray(v)) flat.push(...v);
        else if (v) flat.push(v);
      }
      if (flat.length) {
        return flat
          .filter(Boolean)
          .map((i) => `- ${typeof i === "string" ? i : String(i)}`)
          .join("\n");
      }
      try {
        return "```\n" + JSON.stringify(val, null, 2) + "\n```";
      } catch {
        return String(val);
      }
    }
    return String(val);
  };

  const businessMd = toMarkdown(businessReport?.risks_and_mitigation);
  const techMd = toMarkdown(technicalReport?.technical_risks);

  return (
    <div className="glass-effect border rounded-xl p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">
        {t("Risk Assessment & Mitigation", "تقييم المخاطر وخطط التخفيف")}
      </h2>

      {businessMd && (
        <div className="mb-4">
          <h3 className="font-semibold text-slate-700">
            {t("Business Risks & Mitigation", "المخاطر التجارية وخطط التخفيف")}
          </h3>
          <div className="prose prose-sm max-w-none">
            <MarkdownText text={businessMd} />
          </div>
        </div>
      )}

      {techMd && (
        <div>
          <h3 className="font-semibold text-slate-700">
            {t("Technical Risks", "المخاطر التقنية")}
          </h3>
          <div className="prose prose-sm max-w-none">
            <MarkdownText text={techMd} />
          </div>
        </div>
      )}
    </div>
  );
}
