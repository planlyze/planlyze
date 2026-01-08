import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertCircle, Lightbulb, TrendingUp, Building2, Target, PieChart, Sparkles, ExternalLink, Smartphone, Globe, Facebook, Instagram, MessageCircle, Send } from "lucide-react";
import LockedContent from "./LockedContent";
import { SWOTChart, MarketSizeChart } from "./charts/AnalysisCharts";

export default function MarketSection({ data = {}, isArabic = false, isReportArabic=false, isPremium = true, onUnlock, isUnlocking = false }) {
  const t = (en, ar) => (isArabic ? ar : en);

  // Handle raw_response case where data is stored as JSON string
  let parsedData = data || {};
  if (data?.raw_response && typeof data.raw_response === 'string') {
    try {
      parsedData = JSON.parse(data.raw_response);
    } catch (e) {
      console.error('Failed to parse raw_response:', e);
    }
  }

  const targetAudiences = parsedData.target_audiences || [];
  const problems = parsedData.problems || [];
  const solution = parsedData.solution || {};
  const syrianMarket = parsedData.syrian_market || {};
  const syrianCompetitors = parsedData.syrian_competitors || [];
  const swot = parsedData.swot || {};
  const marketUniqueness = parsedData.market_uniqueness || {};
  
  const hasSwotData = swot.strengths?.length || swot.weaknesses?.length || swot.opportunities?.length || swot.threats?.length;
  const hasUniquenessData = marketUniqueness.gaps_in_market?.length || marketUniqueness.differentiation_opportunities?.length || marketUniqueness.unique_value_proposition;

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
            <div className="grid md:grid-cols-2 gap-4" dir={isArabic ? "rtl" : "ltr"}>
              {targetAudiences.slice(0, isPremium ? targetAudiences.length : 1).map((audience, idx) => (
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
              {!isPremium && targetAudiences.length > 1 && (
                <LockedContent
                  title={t("More Target Audiences", "المزيد من الجمهور المستهدف")}
                  description={t(`Unlock ${targetAudiences.length - 1} more target audiences`, `افتح ${targetAudiences.length - 1} جمهور مستهدف إضافي`)}
                  isArabic={isArabic}
                  onUnlock={onUnlock}
                  isUnlocking={isUnlocking}
                  variant="inline"
                />
              )}
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
              {problems.slice(0, isPremium ? problems.length : 1).map((problem, idx) => (
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
              {!isPremium && problems.length > 1 && (
                <LockedContent
                  title={t("More Problems Analysis", "المزيد من تحليل المشاكل")}
                  description={t(`Unlock ${problems.length - 1} more problem analyses`, `افتح ${problems.length - 1} تحليل مشاكل إضافي`)}
                  isArabic={isArabic}
                  onUnlock={onUnlock}
                  isUnlocking={isUnlocking}
                  variant="inline"
                />
              )}
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
        isPremium ? (
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
        ) : (
          <LockedContent
            title={t("Syrian Market Opportunity", "فرصة السوق السوري")}
            description={t("Unlock detailed market size, growth rate, and Syrian market analysis", "افتح تحليل حجم السوق ومعدل النمو وتحليل السوق السوري")}
            isArabic={isArabic}
            onUnlock={onUnlock}
            isUnlocking={isUnlocking}
          />
        )
      )}

      {syrianCompetitors.length > 0 && (
        isPremium ? (
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
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-slate-800 text-lg">{comp.name}</h4>
                      {comp.relevance && typeof comp.relevance === 'string' && comp.relevance.trim() && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-700 text-xs">
                          {t("Relevant", "ذو صلة")}
                        </Badge>
                      )}
                    </div>
                    
                    {comp.description && typeof comp.description === 'string' && comp.description.trim() && (
                      <p className="text-sm text-slate-600 mb-3">{comp.description}</p>
                    )}
                    
                    {comp.relevance && typeof comp.relevance === 'string' && comp.relevance.trim() && (
                      <div className="mb-3 p-2 bg-purple-100/50 rounded text-sm text-purple-800">
                        <span className="font-medium">{t("Why relevant:", "لماذا ذو صلة:")}</span> {comp.relevance}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(comp.app_links?.android || comp.android) && (
                        <a 
                          href={comp.app_links?.android || comp.android} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                        >
                          <Smartphone className="w-3 h-3" /> Android
                        </a>
                      )}
                      {(comp.app_links?.ios || comp.ios) && (
                        <a 
                          href={comp.app_links?.ios || comp.ios} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                        >
                          <Smartphone className="w-3 h-3" /> iOS
                        </a>
                      )}
                      {(comp.app_links?.website || comp.website) && (
                        <a 
                          href={comp.app_links?.website || comp.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                        >
                          <Globe className="w-3 h-3" /> {t("Website", "الموقع")}
                        </a>
                      )}
                      {comp.social?.facebook && (
                        <a 
                          href={comp.social.facebook} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                        >
                          <Facebook className="w-3 h-3" /> Facebook
                        </a>
                      )}
                      {comp.social?.instagram && (
                        <a 
                          href={comp.social.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded hover:bg-pink-100 transition-colors"
                        >
                          <Instagram className="w-3 h-3" /> Instagram
                        </a>
                      )}
                      {comp.social?.whatsapp && (
                        <a 
                          href={comp.social.whatsapp.startsWith('http') ? comp.social.whatsapp : `https://wa.me/${comp.social.whatsapp}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </a>
                      )}
                      {comp.social?.telegram && (
                        <a 
                          href={comp.social.telegram} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded hover:bg-sky-100 transition-colors"
                        >
                          <Send className="w-3 h-3" /> Telegram
                        </a>
                      )}
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      {comp.pros && comp.pros.length > 0 && (
                        <div className="bg-white/60 p-3 rounded-lg">
                          <span className="text-sm font-medium text-green-700">{t("Strengths:", "نقاط القوة:")}</span>
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
                        <div className="bg-white/60 p-3 rounded-lg">
                          <span className="text-sm font-medium text-red-700">{t("Weaknesses:", "نقاط الضعف:")}</span>
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
        ) : (
          <LockedContent
            title={t("Syrian Competitors Analysis", "تحليل المنافسين في سوريا")}
            description={t("Unlock detailed competitor analysis with pros and cons", "افتح تحليل المنافسين التفصيلي مع الإيجابيات والسلبيات")}
            isArabic={isArabic}
            onUnlock={onUnlock}
            isUnlocking={isUnlocking}
          />
        )
      )}

      {hasUniquenessData && (
        isPremium ? (
          <Card className="glass-effect border rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="w-5 h-5 text-amber-500" />
                {t("How to Be Unique", "كيف تكون فريداً")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-100">
                {marketUniqueness.unique_value_proposition && (
                  <div className="mb-4 p-3 bg-white/70 rounded-lg border-l-4 border-amber-400">
                    <span className="text-sm font-medium text-amber-700">{t("Unique Value Proposition:", "القيمة الفريدة:")}</span>
                    <p className="text-slate-700 mt-1">{marketUniqueness.unique_value_proposition}</p>
                  </div>
                )}
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {marketUniqueness.gaps_in_market && marketUniqueness.gaps_in_market.length > 0 && (
                    <div className="bg-white/60 p-3 rounded-lg">
                      <span className="text-sm font-medium text-amber-700">{t("Market Gaps:", "فجوات السوق:")}</span>
                      <ul className="mt-2 space-y-1">
                        {marketUniqueness.gaps_in_market.map((gap, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="text-amber-500">◆</span> {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {marketUniqueness.differentiation_opportunities && marketUniqueness.differentiation_opportunities.length > 0 && (
                    <div className="bg-white/60 p-3 rounded-lg">
                      <span className="text-sm font-medium text-amber-700">{t("How to Differentiate:", "كيف تتميز:")}</span>
                      <ul className="mt-2 space-y-1">
                        {marketUniqueness.differentiation_opportunities.map((diff, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="text-amber-500">★</span> {diff}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {marketUniqueness.recommended_features && marketUniqueness.recommended_features.length > 0 && (
                    <div className="bg-white/60 p-3 rounded-lg">
                      <span className="text-sm font-medium text-amber-700">{t("Recommended Features:", "الميزات الموصى بها:")}</span>
                      <ul className="mt-2 space-y-1">
                        {marketUniqueness.recommended_features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="text-green-500">✓</span> {feat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {marketUniqueness.competitive_advantages && marketUniqueness.competitive_advantages.length > 0 && (
                    <div className="bg-white/60 p-3 rounded-lg">
                      <span className="text-sm font-medium text-amber-700">{t("Competitive Advantages:", "المزايا التنافسية:")}</span>
                      <ul className="mt-2 space-y-1">
                        {marketUniqueness.competitive_advantages.map((adv, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="text-purple-500">→</span> {adv}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <LockedContent
            title={t("How to Be Unique", "كيف تكون فريداً")}
            description={t("Unlock strategies to differentiate your business from competitors", "افتح استراتيجيات لتمييز عملك عن المنافسين")}
            isArabic={isArabic}
            onUnlock={onUnlock}
            isUnlocking={isUnlocking}
          />
        )
      )}

      {(swot.strengths || swot.weaknesses || swot.opportunities || swot.threats) && (
        isPremium ? (
          <Card className="glass-effect border rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="w-5 h-5 text-indigo-600" />
                {t("SWOT Analysis", "تحليل SWOT")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {hasSwotData && (
                <div className="bg-slate-50 rounded-xl p-4 border">
                  <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                    <PieChart className="w-4 h-4" />
                    {t("SWOT Distribution", "توزيع SWOT")}
                  </h4>
                  <SWOTChart swot={swot} isArabic={isArabic} />
                </div>
              )}
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
        ) : (
          <LockedContent
            title={t("SWOT Analysis", "تحليل SWOT")}
            description={t("Unlock strengths, weaknesses, opportunities, and threats analysis", "افتح تحليل نقاط القوة والضعف والفرص والتهديدات")}
            isArabic={isArabic}
            onUnlock={onUnlock}
            isUnlocking={isUnlocking}
          />
        )
      )}
    </div>
  );
}
