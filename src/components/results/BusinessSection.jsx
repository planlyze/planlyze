import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Megaphone, TrendingUp, Users, Handshake, Target, ArrowRight } from "lucide-react";

export default function BusinessSection({ data, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);

  if (!data) {
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <p className="text-slate-500">{t("No business data available.", "لا تتوفر بيانات الأعمال.")}</p>
        </CardContent>
      </Card>
    );
  }

  const gtm = data.go_to_market_strategy || {};
  const validationSteps = gtm.validation_steps || [];
  const marketingStrategy = gtm.marketing_strategy || {};
  const distributionChannels = data.distribution_channels || [];
  const marketingIdeas = data.marketing_ideas_and_partnerships?.marketing_ideas || [];
  const partnerships = data.marketing_ideas_and_partnerships?.partnerships || [];
  const kpis = data.kpis || [];

  const priorityColors = {
    high: "bg-red-100 text-red-700 border-red-300",
    medium: "bg-amber-100 text-amber-700 border-amber-300",
    low: "bg-green-100 text-green-700 border-green-300"
  };

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="w-6 h-6" />
            {t("Go-to-Market Strategy", "استراتيجية دخول السوق")}
          </h2>
        </div>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              {t("Validation Steps", "خطوات التحقق")}
            </h3>
            {validationSteps.length > 0 ? (
              <div className="space-y-3">
                {validationSteps.map((step, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800">{step.step}</h4>
                        <p className="text-slate-600 text-sm mt-1">{step.description}</p>
                        {step.timeline && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {step.timeline}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">{t("No validation steps available.", "لا توجد خطوات للتحقق.")}</p>
            )}
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-blue-600" />
              {t("Marketing Strategy", "استراتيجية التسويق")}
            </h3>
            {marketingStrategy.overview ? (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-slate-700">{marketingStrategy.overview}</p>
                </div>
                {marketingStrategy.key_messages && marketingStrategy.key_messages.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">{t("Key Messages", "الرسائل الرئيسية")}</h4>
                    <div className="flex flex-wrap gap-2">
                      {marketingStrategy.key_messages.map((msg, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-700">
                          {msg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {marketingStrategy.target_approach && (
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">{t("Target Approach", "النهج المستهدف")}</h4>
                    <p className="text-slate-600 text-sm">{marketingStrategy.target_approach}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">{t("No marketing strategy available.", "لا توجد استراتيجية تسويق.")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <ArrowRight className="w-6 h-6" />
            {t("Distribution Channels", "قنوات التوزيع")}
          </h2>
        </div>
        <CardContent className="p-6">
          {distributionChannels.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {distributionChannels.map((channel, idx) => (
                <div key={idx} className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-200 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-800">{channel.channel_name}</h4>
                    {channel.priority && (
                      <Badge className={`text-xs ${priorityColors[channel.priority.toLowerCase()] || priorityColors.medium}`}>
                        {channel.priority}
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm">{channel.details}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">{t("No distribution channels available.", "لا توجد قنوات توزيع.")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-effect border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Handshake className="w-6 h-6" />
            {t("Marketing Ideas & Partnerships", "أفكار التسويق والشراكات")}
          </h2>
        </div>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{t("Marketing Ideas", "أفكار التسويق")}</h3>
            {marketingIdeas.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {marketingIdeas.map((idea, idx) => (
                  <div key={idx} className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <h4 className="font-semibold text-slate-800 mb-2">{idea.idea}</h4>
                    <p className="text-slate-600 text-sm mb-2">{idea.description}</p>
                    {idea.estimated_cost && (
                      <Badge variant="outline" className="text-xs">
                        {t("Est. Cost", "التكلفة التقديرية")}: {idea.estimated_cost}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">{t("No marketing ideas available.", "لا توجد أفكار تسويق.")}</p>
            )}
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{t("Partnerships", "الشراكات")}</h3>
            {partnerships.length > 0 ? (
              <div className="space-y-4">
                {partnerships.map((partner, idx) => (
                  <div key={idx} className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <h4 className="font-semibold text-slate-800 mb-2">{partner.partner_type}</h4>
                    {partner.potential_partners && partner.potential_partners.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {partner.potential_partners.map((p, i) => (
                          <Badge key={i} className="bg-orange-100 text-orange-700">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {partner.value_proposition && (
                      <p className="text-slate-600 text-sm">{partner.value_proposition}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">{t("No partnership opportunities available.", "لا توجد فرص شراكة.")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Target className="w-6 h-6" />
            {t("Key Performance Indicators (KPIs)", "مؤشرات الأداء الرئيسية")}
          </h2>
        </div>
        <CardContent className="p-6">
          {kpis.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {kpis.map((kpi, idx) => (
                <div key={idx} className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200 hover:shadow-lg transition-all">
                  <h4 className="font-semibold text-slate-800 mb-2">{kpi.metric}</h4>
                  <div className="space-y-1">
                    <p className="text-emerald-600 font-medium">{t("Target", "الهدف")}: {kpi.target}</p>
                    {kpi.measurement_frequency && (
                      <p className="text-slate-500 text-xs">{t("Frequency", "التكرار")}: {kpi.measurement_frequency}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">{t("No KPIs available.", "لا تتوفر مؤشرات أداء.")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
