
import React from "react";
import MarkdownText from "../common/MarkdownText";

export default function RecommendationsNext({ report = {}, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);

  // Normalize any shape of recommendation_summary into { recommendations: [], nextSteps: [] }
  const cleanLine = (s) => {
    if (!s) return "";
    let x = String(s).trim();
    // Remove leading bullets, numbering, checkboxes, dashes
    x = x.replace(/^\s*(?:[-*•·–—]\s+|\d+[\.\)]\s+|\[\s?[xX]?\s?\]\s+|✅\s+|✔️\s+|✓\s+)/, "");
    // Collapse spaces
    x = x.replace(/\s+/g, " ").trim();
    return x;
  };
  const toArray = (v) => {
    if (v == null) return [];
    if (Array.isArray(v)) return v.map(cleanLine).filter(Boolean);
    if (typeof v === "string") {
      // Split by newlines or semicolons if dense
      const parts = v.includes("\n") ? v.split(/\r?\n/) : v.split(/[;•]/);
      return parts.map(cleanLine).filter(Boolean);
    }
    if (typeof v === "object") {
      // Flatten object values to list
      const out = [];
      Object.values(v).forEach((val) => {
        out.push(...toArray(val));
      });
      return out;
    }
    return [cleanLine(String(v))].filter(Boolean);
  };
  const dedupe = (arr) => {
    const seen = new Set();
    const out = [];
    arr.forEach((s) => {
      const k = s.toLowerCase().trim();
      if (k && !seen.has(k)) {
        seen.add(k);
        out.push(s);
      }
    });
    return out;
  };

  // Parse string with section headers (EN/AR) into buckets
  const parseStringSections = (text) => {
    const lines = String(text || "").split(/\r?\n/);
    const rec = [];
    const next = [];
    const general = [];
    let current = null;

    const isRecHeader = (l) =>
      /(recommendations?|advice|suggestions?)\s*:?\s*$/i.test(l) || /(التوصيات|نصائح|اقتراحات)\s*:?\s*$/.test(l);
    const isNextHeader = (l) =>
      /(next steps?|action plan|immediate actions?|actions?)\s*:?\s*$/i.test(l) ||
      /(الخطوات التالية|خطة العمل|إجراءات فورية)\s*:?\s*$/.test(l);

    lines.forEach((raw) => {
      const l = String(raw || "").trim();
      if (!l) return;
      if (/^#{1,6}\s+/.test(l) || /[:：]\s*$/.test(l)) {
        if (isRecHeader(l)) {
          current = "rec";
          return;
        }
        if (isNextHeader(l)) {
          current = "next";
          return;
        }
      }
      const cleaned = cleanLine(l);
      if (!cleaned) return;
      if (current === "rec") rec.push(cleaned);
      else if (current === "next") next.push(cleaned);
      else general.push(cleaned);
    });

    // If no explicit sections, assume general are recommendations
    const finalRec = rec.length ? rec : general;
    return { rec: finalRec, next };
  };

  const normalizeSummary = (input) => {
    const recommendations = [];
    const nextSteps = [];

    if (!input) return { recommendations, nextSteps };

    if (typeof input === "string") {
      const { rec, next } = parseStringSections(input);
      recommendations.push(...rec);
      nextSteps.push(...next);
    } else if (Array.isArray(input)) {
      recommendations.push(...toArray(input));
    } else if (typeof input === "object") {
      // Known English keys
      const recKeys = ["recommendations", "recommendation_summary", "recommendation", "recs", "suggestions", "advice"];
      const nextKeys = ["next_steps", "next", "actions", "action_items", "immediate_actions", "action_plan", "plan", "steps"];
      // Known Arabic keys
      const recKeysAr = ["التوصيات", "ملخص التوصيات"];
      const nextKeysAr = ["الخطوات التالية", "خطوات", "إجراءات فورية", "خطة العمل"];

      const pushKeys = (obj, keys, target) => {
        keys.forEach((k) => {
          if (obj[k] != null) target.push(...toArray(obj[k]));
        });
      };

      pushKeys(input, recKeys, recommendations);
      pushKeys(input, nextKeys, nextSteps);
      pushKeys(input, recKeysAr, recommendations);
      pushKeys(input, nextKeysAr, nextSteps);

      // Timeline grouping support
      const timeline = {
        short: input.short_term || input["قصير الأجل"],
        mid: input.mid_term || input["متوسط الأجل"],
        long: input.long_term || input["طويل الأجل"],
      };
      if (timeline.short) nextSteps.push(...toArray(timeline.short));
      if (timeline.mid) nextSteps.push(...toArray(timeline.mid));
      if (timeline.long) nextSteps.push(...toArray(timeline.long));

      // If nothing matched, flatten entire object as recommendations
      if (recommendations.length === 0 && nextSteps.length === 0) {
        recommendations.push(...toArray(input));
      }
    }

    // Final cleanup: dedupe and cap length
    const recFinal = dedupe(recommendations).slice(0, 12);
    const nextFinal = dedupe(nextSteps).slice(0, 12);

    return { recommendations: recFinal, nextSteps: nextFinal };
  };

  // Existing toMarkdown fallback if nothing to normalize
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

  const summaryRaw = report?.recommendation_summary;
  const { recommendations, nextSteps } = normalizeSummary(summaryRaw);
  const hasNormalized = recommendations.length > 0 || nextSteps.length > 0;
  const fallbackMd = hasNormalized ? "" : toMarkdown(summaryRaw);

  return (
    <div className="glass-effect border rounded-xl p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">{t("Recommendations & Next Steps", "التوصيات والخطوات التالية")}</h2>

      {hasNormalized ? (
        <div className="grid gap-6 md:grid-cols-2">
          {recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-700 mb-2">{t("Recommendations", "التوصيات")}</h3>
              <ul className="list-disc ms-5 text-slate-700 space-y-1">
                {recommendations.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}
          {nextSteps.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-700 mb-2">{t("Next Steps", "الخطوات التالية")}</h3>
              <ul className="list-disc ms-5 text-slate-700 space-y-1">
                {nextSteps.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      ) : (
        fallbackMd ? <div className="prose prose-sm max-w-none"><MarkdownText text={fallbackMd} /></div> : <p className="text-slate-600">—</p>
      )}
    </div>
  );
}
