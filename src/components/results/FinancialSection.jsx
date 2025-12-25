import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Coins, Building, CheckCircle, Tag, PieChart as PieChartIcon } from "lucide-react";
import { RevenueStreamsChart } from "./charts/AnalysisCharts";

export default function FinancialSection({ data, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);

  if (!data) {
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <p className="text-slate-500">{t("No financial data available.", "لا تتوفر بيانات مالية.")}</p>
        </CardContent>
      </Card>
    );
  }

  // Handle raw_response case where data is stored as JSON string
  let parsedData = data;
  if (data.raw_response && typeof data.raw_response === 'string') {
    try {
      parsedData = JSON.parse(data.raw_response);
    } catch (e) {
      console.error('Failed to parse raw_response:', e);
    }
  }

  const revenueStreams = parsedData.revenue_streams || [];
  const pricingStrategy = parsedData.pricing_strategy || {};
  const fundingOpportunities = parsedData.funding_opportunities || [];

  const potentialColors = {
    high: "bg-emerald-100 text-emerald-700 border-emerald-300",
    medium: "bg-amber-100 text-amber-700 border-amber-300",
    low: "bg-slate-100 text-slate-700 border-slate-300"
  };

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Coins className="w-6 h-6" />
            {t("Revenue Streams", "مصادر الإيرادات")}
          </h2>
        </div>
        <CardContent className="p-6 space-y-6">
          {revenueStreams.length > 1 && (
            <div className="bg-slate-50 rounded-xl p-4 border">
              <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4" />
                {t("Revenue Potential Distribution", "توزيع إمكانات الإيرادات")}
              </h4>
              <RevenueStreamsChart streams={revenueStreams} isArabic={isArabic} />
            </div>
          )}
          {revenueStreams.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {revenueStreams.map((stream, idx) => (
                <div key={idx} className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{stream.name}</h4>
                        <Badge variant="outline" className="text-xs mt-1">{stream.type}</Badge>
                      </div>
                    </div>
                    {stream.potential && (
                      <Badge className={`text-xs ${potentialColors[stream.potential.toLowerCase()] || potentialColors.medium}`}>
                        {stream.potential}
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm mb-3">{stream.description}</p>
                  {stream.estimated_monthly_revenue && (
                    <div className="bg-white rounded-lg p-2 border border-emerald-100">
                      <p className="text-sm">
                        <span className="text-slate-500">{t("Est. Monthly Revenue", "الإيرادات الشهرية المتوقعة")}:</span>
                        <span className="font-semibold text-emerald-600 ml-2">{stream.estimated_monthly_revenue}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">{t("No revenue streams available.", "لا توجد مصادر إيرادات.")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-effect border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Tag className="w-6 h-6" />
            {t("Pricing Strategy", "استراتيجية التسعير")}
          </h2>
        </div>
        <CardContent className="p-6 space-y-6">
          {pricingStrategy.model || pricingStrategy.approach ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {pricingStrategy.model && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-slate-800 mb-2">{t("Pricing Model", "نموذج التسعير")}</h4>
                    <p className="text-slate-600">{pricingStrategy.model}</p>
                  </div>
                )}
                {pricingStrategy.approach && (
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <h4 className="font-semibold text-slate-800 mb-2">{t("Approach", "النهج")}</h4>
                    <p className="text-slate-600">{pricingStrategy.approach}</p>
                  </div>
                )}
              </div>

              {pricingStrategy.tiers && pricingStrategy.tiers.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-4">{t("Pricing Tiers", "مستويات التسعير")}</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    {pricingStrategy.tiers.map((tier, idx) => (
                      <div key={idx} className={`rounded-xl p-5 border-2 transition-all hover:shadow-lg ${idx === 1 ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 ring-2 ring-blue-200' : 'bg-white border-slate-200'}`}>
                        {idx === 1 && (
                          <Badge className="bg-blue-600 text-white mb-2">{t("Popular", "الأكثر شيوعاً")}</Badge>
                        )}
                        <h4 className="font-bold text-lg text-slate-800">{tier.name}</h4>
                        <p className="text-2xl font-bold text-blue-600 my-2">{tier.price}</p>
                        {tier.features && tier.features.length > 0 && (
                          <ul className="space-y-2 mt-4">
                            {tier.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pricingStrategy.justification && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-2">{t("Justification", "التبرير")}</h4>
                  <p className="text-slate-600">{pricingStrategy.justification}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-500 text-center py-4">{t("No pricing strategy available.", "لا توجد استراتيجية تسعير.")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-effect border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Building className="w-6 h-6" />
            {t("Funding Opportunities", "فرص التمويل")}
          </h2>
        </div>
        <CardContent className="p-6">
          {fundingOpportunities.length > 0 ? (
            <div className="space-y-4">
              {fundingOpportunities.map((funding, idx) => (
                <div key={idx} className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-5 border border-purple-200 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-800">{funding.type}</h4>
                          <p className="text-purple-600 text-sm">{funding.source}</p>
                        </div>
                        {funding.amount_range && (
                          <Badge className="bg-purple-100 text-purple-700">{funding.amount_range}</Badge>
                        )}
                      </div>
                      {funding.terms && (
                        <p className="text-slate-600 text-sm mt-2">
                          <span className="font-medium">{t("Terms", "الشروط")}:</span> {funding.terms}
                        </p>
                      )}
                      {funding.suitability && (
                        <p className="text-slate-600 text-sm mt-1">
                          <span className="font-medium">{t("Suitability", "الملاءمة")}:</span> {funding.suitability}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">{t("No funding opportunities available.", "لا توجد فرص تمويل.")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
