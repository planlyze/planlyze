
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, ExternalLink } from "lucide-react";

export default function CompetitorMatrix({ businessReport = {}, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);
  const data = businessReport?.competitors_detailed || {};
  const direct = Array.isArray(data.direct_competitors) ? data.direct_competitors : [];
  const indirect = Array.isArray(data.indirect_competitors) ? data.indirect_competitors : [];

  if (direct.length === 0 && indirect.length === 0) return null;

  const Section = ({ title, items }) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((c, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200/70 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">{c.name || t("Competitor", "منافس")}</h4>
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                      {t("Competitor", "منافس")}
                    </Badge>
                    {/* Show country tag if present */}
                    {c.country && (
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                        {c.country}
                      </Badge>
                    )}
                  </div>
                  {c.description && (
                    <p className="text-sm text-slate-700 mt-1">{c.description}</p>
                  )}
                </div>
                {c.website_url && (
                  <a
                    href={c.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-slate-800 shrink-0 inline-flex items-center gap-1 text-xs"
                    title={t("Website", "الموقع")}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <div className="text-xs text-emerald-700 font-medium">{t("Strengths", "نقاط القوة")}</div>
                  <ul className="list-disc ms-5 text-sm text-slate-700 space-y-1">
                    {(c.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-xs text-rose-700 font-medium">{t("Weaknesses", "نقاط الضعف")}</div>
                  <ul className="list-disc ms-5 text-sm text-slate-700 space-y-1">
                    {(c.weaknesses || []).map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-600" />
          <CardTitle className="text-xl font-bold text-slate-800">
            {t("Competitor Landscape", "المشهد التنافسي")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Section title={t("Direct Competitors", "المنافسون المباشرون")} items={direct} />
        <Section title={t("Indirect Competitors", "المنافسون غير المباشرون")} items={indirect} />
      </CardContent>
    </Card>
  );
}
