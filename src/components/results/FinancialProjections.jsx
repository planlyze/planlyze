import React from "react";
import MarkdownText from "../common/MarkdownText";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

export default function FinancialProjections({ report = {}, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);

  // Helper to convert various input types into a Markdown string
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

  // Helper to safely coerce a value to a number, handling various formats including currency strings
  const coerceNumber = (v) => {
    if (v == null) return null;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const cleaned = v.replace(/[^0-9.-]+/g, ""); // Remove non-numeric, non-dot, non-dash characters
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  // Helper to normalize timeline pricing row objects from various AI output formats
  const normalizeRow = (r) => {
    const obj = typeof r === "object" && r ? r : {};

    return {
      item: obj.item ?? obj.phase ?? obj.name ?? "",
      level: obj.level ?? obj.stage ?? "",
      duration_weeks: coerceNumber(obj.duration_weeks ?? obj.weeks ?? obj.duration) ?? "",
      estimated_cost_usd: coerceNumber(obj.estimated_cost_usd ?? obj.cost_usd ?? obj.estimated_cost) ?? null,
      notes: obj.notes ?? obj.description ?? "",
      // team_positions are no longer generated or displayed
    };
  };

  // Parses timeline_pricing which can come in various formats (array, object with phases/rows, string JSON, plain string)
  const parseTimelinePricing = (tp) => {
    let rows = [];
    let fallbackMd = "";

    const processArrayOfRows = (arr) => {
      return arr.map(normalizeRow).filter(r =>
        r.item || r.level || r.duration_weeks !== "" || r.estimated_cost_usd != null || r.notes
      );
    };

    if (Array.isArray(tp)) {
      rows = processArrayOfRows(tp);
    } else if (tp && typeof tp === "object") {
      if (Array.isArray(tp.phases)) {
        rows = processArrayOfRows(tp.phases);
      } else if (Array.isArray(tp.rows)) {
        rows = processArrayOfRows(tp.rows);
      } else {
        // Assume the object itself contains valid row-like objects as values
        rows = processArrayOfRows(Object.values(tp).filter(v => typeof v === "object"));
      }
    } else if (typeof tp === "string") {
      const s = tp.trim();
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          rows = processArrayOfRows(parsed);
        } else if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.rows)) {
            rows = processArrayOfRows(parsed.rows);
          } else if (Array.isArray(parsed.phases)) {
            rows = processArrayOfRows(parsed.phases);
          } else {
            rows = processArrayOfRows(Object.values(parsed).filter(v => typeof v === "object"));
          }
        } else {
          fallbackMd = s; // Not an array or object, treat as markdown
        }
      } catch (e) {
        // Not valid JSON => show as Markdown content
        fallbackMd = s;
      }
    }
    return { rows, fallbackMd };
  };

  const formatUSD = (v) => {
    const n = coerceNumber(v);
    if (n == null) return "-";
    try {
      return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    } catch {
      return `$${n}`; // Fallback if toLocaleString fails for some reason
    }
  };

  const { rows, fallbackMd } = parseTimelinePricing(report?.timeline_pricing);
  const costBreakdownMd = toMarkdown(report?.cost_breakdown);

  return (
    <div className="glass-effect border rounded-xl p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">{t("Financial Projections", "التوقعات المالية")}</h2>

      {report?.country_pricing_basis && (
        <div className="mb-4">
          <h3 className="font-semibold text-slate-700">
            {t("Country-Based Pricing Basis", "أساس التسعير حسب البلد")}
          </h3>
          <p className="text-slate-700 text-sm">
            {report.pricing_country ? `${t("Country:", "الدولة:")} ${report.pricing_country} • ` : ""}
            {report.pricing_currency ? `${t("Currency:", "العملة:")} ${report.pricing_currency} • ` : ""}
            {report.country_pricing_basis}
          </p>
        </div>
      )}

      {costBreakdownMd && (
        <div className="mb-4">
          <h3 className="font-semibold text-slate-700">{t("Cost Breakdown", "تفصيل التكاليف")}</h3>
          {/* Added prose classes for better markdown rendering */}
          <div className="prose prose-sm max-w-none">
            <MarkdownText text={costBreakdownMd} />
          </div>
        </div>
      )}

      {rows.length > 0 ? (
        <div className="space-y-6">
          {/* Cost Distribution Chart */}
          {rows.some(r => r.estimated_cost_usd != null && r.estimated_cost_usd > 0) && (
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">{t("Cost Distribution", "توزيع التكاليف")}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Bar Chart */}
                <div className="h-64 bg-slate-50 rounded-xl p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={rows.filter(r => r.estimated_cost_usd != null && r.estimated_cost_usd > 0).map((r, i) => ({
                        name: r.item || r.level || `Phase ${i + 1}`,
                        cost: r.estimated_cost_usd,
                        weeks: r.duration_weeks || 0
                      }))}
                      margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
                    >
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10 }} 
                        angle={-45} 
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis 
                        tickFormatter={(v) => {
                          if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
                          return `$${v}`;
                        }}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip 
                        formatter={(v) => [formatUSD(v), t("Cost", "التكلفة")]}
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Bar dataKey="cost" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                        {rows.filter(r => r.estimated_cost_usd != null).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#8b5cf6', '#6366f1', '#a855f7', '#7c3aed', '#9333ea'][index % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Pie Chart */}
                <div className="h-64 bg-slate-50 rounded-xl p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={rows.filter(r => r.estimated_cost_usd != null && r.estimated_cost_usd > 0).map((r, i) => ({
                          name: r.item || r.level || `Phase ${i + 1}`,
                          value: r.estimated_cost_usd
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name.substring(0, 10)}${name.length > 10 ? '...' : ''} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {rows.filter(r => r.estimated_cost_usd != null).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#8b5cf6', '#6366f1', '#a855f7', '#7c3aed', '#9333ea', '#c084fc'][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [formatUSD(v), t("Cost", "التكلفة")]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Total Cost Summary */}
              <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl flex items-center justify-between">
                <span className="font-semibold text-purple-800">{t("Total Estimated Cost", "إجمالي التكلفة المتوقعة")}</span>
                <span className="text-2xl font-bold text-purple-600">
                  {formatUSD(rows.reduce((sum, r) => sum + (r.estimated_cost_usd || 0), 0))}
                </span>
              </div>
            </div>
          )}

          <h3 className="font-semibold text-slate-700 mb-2">{t("Timeline & Pricing", "الجدول الزمني والتسعير")}</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th className="px-4 py-2 font-semibold text-slate-700">{t("Item", "البند")}</th>
                  <th className="px-4 py-2 font-semibold text-slate-700">{t("Level/Stage", "المستوى/المرحلة")}</th>
                  <th className="px-4 py-2 font-semibold text-slate-700">{t("Duration (weeks)", "المدة (أسابيع)")}</th>
                  <th className="px-4 py-2 font-semibold text-slate-700">{t("Estimated Cost (USD)", "التكلفة المتوقعة (دولار)")}</th>
                  <th className="px-4 py-2 font-semibold text-slate-700">{t("Notes", "ملاحظات")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((r, i) => (
                  <React.Fragment key={i}>
                    <tr className="align-top hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2 text-slate-800 break-words font-medium">{r.item || "-"}</td>
                      <td className="px-4 py-2 text-slate-700">{r.level || "-"}</td>
                      <td className="px-4 py-2 text-slate-700">{r.duration_weeks !== "" ? r.duration_weeks : "-"}</td>
                      <td className="px-4 py-2 text-slate-700 font-semibold">{r.estimated_cost_usd != null ? formatUSD(r.estimated_cost_usd) : "-"}</td>
                      <td className="px-4 py-2 text-slate-700 break-words">{r.notes || "-"}</td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Render fallback Markdown if no structured rows are found but markdown content exists
        fallbackMd && (
          <div className="mt-4">
            <h3 className="font-semibold text-slate-700 mb-2">{t("Timeline & Pricing", "الجدول الزمني والتسعير")}</h3>
            <div className="prose prose-sm max-w-none">
              <MarkdownText text={toMarkdown(fallbackMd)} />
            </div>
          </div>
        )
      )}
    </div>
  );
}