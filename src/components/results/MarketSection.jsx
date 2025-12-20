import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertCircle, Lightbulb, TrendingUp, Building2, Target } from "lucide-react";

export default function MarketSection({ data = {}, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);

  const targetAudiences = data.target_audiences || [];
  const problems = data.problems || [];
  const solution = data.solution || {};
  const syrianMarket = data.syrian_market || {};
  const syrianCompetitors = data.syrian_competitors || [];
  const swot = data.swot || {};

  return (
    <div className="space-y-6">
      {targetAudiences.length > 0 && (
        <Card className="glass-effect border rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="w-5 h-5 text-blue-600" />
              {t("Target Audiences", "الجمهور المستهدف")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {targetAudiences.map((audience, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-700">
                      {t(`Audience ${idx + 1}`, `الجمهور ${idx + 1}`)}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-2">{audience.segment}</h4>
                  <p className="text-sm text-slate-600 mb-3">{audience.description}</p>
                  {audience.size_estimate && (
                    <p className="text-xs text-slate-500 mb-2">
                      <span className="font-medium">{t("Size:", "الحجم:")}</span> {audience.size_estimate}
                    </p>
                  )}
                  {audience.needs && audience.needs.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-slate-600">{t("Needs:", "الاحتياجات:")}</span>
                      <ul className="text-xs text-slate-500 mt-1 space-y-1">
                        {audience.needs.map((need, nidx) => (
                          <li key={nidx} className="flex items-start gap-1">
                            <span className="text-blue-500 mt-0.5">•</span> {need}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {problems.length > 0 && (
        <Card className="glass-effect border rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="w-5 h-5 text-red-600" />
              {t("Key Problems", "المشاكل الرئيسية")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {problems.map((problem, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-red-100 text-red-700">
                      {t(`Problem ${idx + 1}`, `المشكلة ${idx + 1}`)}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-2">{problem.title}</h4>
                  <p className="text-sm text-slate-600 mb-3">{problem.description}</p>
                  {problem.details && problem.details.length > 0 && (
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {problem.details.map((detail, didx) => (
                        <li key={didx} className="flex items-start gap-2 text-sm text-slate-600 bg-white/60 p-2 rounded">
                          <span className="text-red-500 font-bold">{didx + 1}.</span> {detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(solution.overview || solution.key_features) && (
        <Card className="glass-effect border rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              {t("Solution", "الحل")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-100">
              {solution.overview && (
                <p className="text-slate-700 mb-4">{solution.overview}</p>
              )}
              {solution.unique_value && (
                <div className="mb-4 p-3 bg-white/70 rounded-lg">
                  <span className="text-sm font-medium text-slate-600">{t("Unique Value:", "القيمة الفريدة:")}</span>
                  <p className="text-slate-800 mt-1">{solution.unique_value}</p>
                </div>
              )}
              {solution.key_features && solution.key_features.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-slate-600">{t("Key Features:", "الميزات الرئيسية:")}</span>
                  <ul className="mt-2 grid sm:grid-cols-2 gap-2">
                    {solution.key_features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-2 text-sm text-slate-700 bg-white/60 p-2 rounded">
                        <span className="text-yellow-600">✓</span> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {solution.how_it_solves && (
                <div className="mt-4 p-3 bg-white/70 rounded-lg">
                  <span className="text-sm font-medium text-slate-600">{t("How It Solves:", "كيف يحل:")}</span>
                  <p className="text-slate-800 mt-1">{solution.how_it_solves}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(syrianMarket.opportunity || syrianMarket.market_size_usd) && (
        <Card className="glass-effect border rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="w-5 h-5 text-green-600" />
              {t("Syrian Market Opportunity", "فرصة السوق السوري")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
              {syrianMarket.opportunity && (
                <p className="text-slate-700 mb-4">{syrianMarket.opportunity}</p>
              )}
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {syrianMarket.market_size_usd && (
                  <div className="bg-white/70 p-3 rounded-lg">
                    <span className="text-xs text-slate-500">{t("Market Size", "حجم السوق")}</span>
                    <p className="text-lg font-bold text-green-700">${(syrianMarket.market_size_usd / 1000000).toFixed(1)}M</p>
                  </div>
                )}
                {syrianMarket.growth_rate_percent && (
                  <div className="bg-white/70 p-3 rounded-lg">
                    <span className="text-xs text-slate-500">{t("Growth Rate", "معدل النمو")}</span>
                    <p className="text-lg font-bold text-green-700">{syrianMarket.growth_rate_percent}%</p>
                  </div>
                )}
              </div>
              {syrianMarket.unique_factors && syrianMarket.unique_factors.length > 0 && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-slate-600">{t("Unique Factors:", "العوامل الفريدة:")}</span>
                  <ul className="mt-2 space-y-1">
                    {syrianMarket.unique_factors.map((factor, fidx) => (
                      <li key={fidx} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-green-500">•</span> {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {syrianMarket.challenges && syrianMarket.challenges.length > 0 && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-slate-600">{t("Challenges:", "التحديات:")}</span>
                  <ul className="mt-2 space-y-1">
                    {syrianMarket.challenges.map((challenge, cidx) => (
                      <li key={cidx} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-orange-500">⚠</span> {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {syrianMarket.regulations && (
                <div className="p-3 bg-white/70 rounded-lg">
                  <span className="text-sm font-medium text-slate-600">{t("Regulations:", "اللوائح:")}</span>
                  <p className="text-slate-700 mt-1">{syrianMarket.regulations}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {syrianCompetitors.length > 0 && (
        <Card className="glass-effect border rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building2 className="w-5 h-5 text-purple-600" />
              {t("Syrian Competitors", "المنافسين في سوريا")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {syrianCompetitors.map((comp, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h4 className="font-semibold text-slate-800">{comp.name}</h4>
                    {comp.website && (
                      <a 
                        href={comp.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:text-purple-800 underline"
                      >
                        {t("Visit Website", "زيارة الموقع")} →
                      </a>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {comp.pros && comp.pros.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-green-700">{t("Pros:", "الإيجابيات:")}</span>
                        <ul className="mt-1 space-y-1">
                          {comp.pros.map((pro, pidx) => (
                            <li key={pidx} className="flex items-start gap-2 text-sm text-slate-600">
                              <span className="text-green-500">+</span> {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {comp.cons && comp.cons.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-red-700">{t("Cons:", "السلبيات:")}</span>
                        <ul className="mt-1 space-y-1">
                          {comp.cons.map((con, cidx) => (
                            <li key={cidx} className="flex items-start gap-2 text-sm text-slate-600">
                              <span className="text-red-500">-</span> {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(swot.strengths || swot.weaknesses || swot.opportunities || swot.threats) && (
        <Card className="glass-effect border rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Target className="w-5 h-5 text-indigo-600" />
              {t("SWOT Analysis", "تحليل SWOT")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {swot.strengths && swot.strengths.length > 0 && (
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">{t("Strengths", "نقاط القوة")}</h4>
                  <ul className="space-y-1">
                    {swot.strengths.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-green-600 font-bold">S</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {swot.weaknesses && swot.weaknesses.length > 0 && (
                <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">{t("Weaknesses", "نقاط الضعف")}</h4>
                  <ul className="space-y-1">
                    {swot.weaknesses.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-red-600 font-bold">W</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {swot.opportunities && swot.opportunities.length > 0 && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">{t("Opportunities", "الفرص")}</h4>
                  <ul className="space-y-1">
                    {swot.opportunities.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-blue-600 font-bold">O</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {swot.threats && swot.threats.length > 0 && (
                <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-2">{t("Threats", "التهديدات")}</h4>
                  <ul className="space-y-1">
                    {swot.threats.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-orange-600 font-bold">T</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
