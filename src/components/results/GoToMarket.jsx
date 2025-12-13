import React from "react";
import MarkdownText from "../common/MarkdownText";

export default function GoToMarket({ report = {}, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);
  return (
    <div className="glass-effect border rounded-xl p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">{t("Go-to-Market Strategy", "استراتيجية دخول السوق")}</h2>
      <MarkdownText text={report?.go_to_market || ""} />
    </div>
  );
}