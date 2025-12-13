import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Plug, Link as LinkIcon } from "lucide-react";

export default function AIToolsSuggestions({ technicalReport = {}, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);
  const tools = Array.isArray(technicalReport?.ai_tools_recommendations)
    ? technicalReport.ai_tools_recommendations
    : [];

  if (tools.length === 0) return null;

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <CardTitle className="text-xl font-bold text-slate-800">
            {t("AI Tools That Fit Your Idea", "أدوات الذكاء الاصطناعي المناسبة لفكرتك")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tools.map((tool, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-slate-200/70 bg-white">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold text-slate-800">
                    {tool.name || t("Tool", "أداة")}
                  </h3>
                  {tool.category && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                      {tool.category}
                    </Badge>
                  )}
                </div>
                {tool.why_it_fits && (
                  <p className="text-sm text-slate-700 mt-1">{tool.why_it_fits}</p>
                )}
              </div>
              {tool.website_url && (
                <a
                  href={tool.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 shrink-0"
                >
                  <LinkIcon className="w-4 h-4" />
                  {t("Website", "الموقع")}
                </a>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-3">
              <div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Plug className="w-3.5 h-3.5" />
                  {t("Primary Use Cases", "الاستخدامات الأساسية")}
                </div>
                <ul className="list-disc ms-5 text-sm text-slate-700">
                  {(tool.primary_use_cases || []).slice(0, 4).map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-xs text-slate-500">{t("Integration Notes", "ملاحظات التكامل")}</div>
                <p className="text-sm text-slate-700">{tool.integration_notes || "—"}</p>
                {tool.pricing_tier && (
                  <div className="mt-1">
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                      {t("Pricing", "التسعير")}: {tool.pricing_tier}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-500">{t("Pros", "الإيجابيات")}</div>
                  <ul className="list-disc ms-5 text-sm text-slate-700">
                    {(tool.pros || []).slice(0, 3).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs text-slate-500">{t("Cons", "السلبيات")}</div>
                  <ul className="list-disc ms-5 text-sm text-slate-700">
                    {(tool.cons || []).slice(0, 2).map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}