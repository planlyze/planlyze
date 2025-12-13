import React from "react";
import MarkdownText from "../common/MarkdownText";

export default function MarketOpportunity({ report = {}, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);
  const mo = report || {};
  const size = mo.market_size || {};

  return (
    <div className="glass-effect border rounded-xl p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">{t("Market Opportunity", "الفرصة السوقية")}</h2>
      <MarkdownText text={mo.market_opportunity || ""} />
      <div className="grid sm:grid-cols-3 gap-4 mt-4">
        {size.tam && (
          <div>
            <div className="text-xs text-slate-500">TAM</div>
            <MarkdownText text={String(size.tam)} />
            {size.tam_basis && (
              <div className="mt-1 text-xs text-slate-600">
                <span className="font-medium">{t("Basis:", "الأساس:")}</span>{" "}
                {String(size.tam_basis)}
              </div>
            )}
          </div>
        )}
        {size.sam && (
          <div>
            <div className="text-xs text-slate-500">SAM</div>
            <MarkdownText text={String(size.sam)} />
            {size.sam_basis && (
              <div className="mt-1 text-xs text-slate-600">
                <span className="font-medium">{t("Basis:", "الأساس:")}</span>{" "}
                {String(size.sam_basis)}
              </div>
            )}
          </div>
        )}
        {size.som && (
          <div>
            <div className="text-xs text-slate-500">SOM</div>
            <MarkdownText text={String(size.som)} />
            {size.som_basis && (
              <div className="mt-1 text-xs text-slate-600">
                <span className="font-medium">{t("Basis:", "الأساس:")}</span>{" "}
                {String(size.som_basis)}
              </div>
            )}
          </div>
        )}
      </div>
      {size.methodology_notes && (
        <div className="mt-4">
          <h3 className="font-semibold text-slate-700">
            {t("Methodology & Assumptions", "المنهجية والافتراضات")}
          </h3>
          <MarkdownText text={String(size.methodology_notes)} />
        </div>
      )}
      {mo.local_demand_assessment && (
        <div className="mt-4">
          <h3 className="font-semibold text-slate-700">{t("Local Demand", "الطلب المحلي")}</h3>
          <MarkdownText text={mo.local_demand_assessment} />
        </div>
      )}
      {mo.competition_analysis && (
        <div className="mt-4">
          <h3 className="font-semibold text-slate-700">{t("Competition", "المنافسة")}</h3>
          <MarkdownText text={mo.competition_analysis} />
        </div>
      )}
      {mo.infrastructure_readiness && (
        <div className="mt-4">
          <h3 className="font-semibold text-slate-700">{t("Infrastructure Readiness", "جاهزية البنية التحتية")}</h3>
          <MarkdownText text={mo.infrastructure_readiness} />
        </div>
      )}
    </div>
  );
}