import React from "react";

export default function Partnerships({ report = {}, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);
  const listify = (v) => Array.isArray(v) ? v.filter(Boolean) : (v ? String(v).split(/\r?\n|,/).map(s=>s.trim()).filter(Boolean) : []);
  const items = listify(report?.partnerships_opportunities);

  return (
    <div className="glass-effect border rounded-xl p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">{t("Partnership Opportunities", "فرص الشراكات")}</h2>
      {items.length > 0 ? (
        <ul className="list-disc ml-5 text-slate-700">
          {items.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      ) : (
        <p className="text-slate-600">{t("No items available.", "لا توجد عناصر.")}</p>
      )}
    </div>
  );
}