import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Users, Clock, Cpu, Layers, Rocket, Wrench, CheckCircle, XCircle, DollarSign, Sparkles } from "lucide-react";
import LockedContent from "./LockedContent";

export default function TechnicalSection({ data, isArabic = false, isPremium = true, onUnlock, isUnlocking = false }) {
  const t = (en, ar) => (isArabic ? ar : en);

  if (!data) {
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <p className="text-slate-500">{t("No technical data available.", "لا تتوفر بيانات تقنية.")}</p>
        </CardContent>
      </Card>
    );
  }

  const techStack = data.technical_stack || {};
  const recommendedStack = techStack.recommended_stack || [];
  const teamRequirements = techStack.team_requirements || [];
  const developmentPlan = data.development_plan || [];
  const mvp = data.mvp || {};
  const aiTools = data.ai_tools || [];

  const categoryColors = {
    frontend: "from-blue-500 to-indigo-500",
    backend: "from-green-500 to-emerald-500",
    database: "from-amber-500 to-orange-500",
    infrastructure: "from-purple-500 to-violet-500"
  };

  const getCategoryColor = (category) => {
    const lower = category?.toLowerCase() || "";
    return categoryColors[lower] || "from-slate-500 to-slate-600";
  };

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Code className="w-6 h-6" />
            {t("Technical Stack", "المكدس التقني")}
          </h2>
        </div>
        <CardContent className="p-6 space-y-6">
          {recommendedStack.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">{t("Recommended Technologies", "التقنيات الموصى بها")}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {recommendedStack.map((tech, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getCategoryColor(tech.category)} rounded-lg flex items-center justify-center`}>
                        <Layers className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <Badge variant="outline" className="text-xs mb-1">{tech.category}</Badge>
                        <h4 className="font-semibold text-slate-800">{tech.technology}</h4>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {tech.pros && tech.pros.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-emerald-600 mb-1">{t("Pros", "المميزات")}</p>
                          <ul className="space-y-1">
                            {tech.pros.map((pro, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {tech.cons && tech.cons.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-600 mb-1">{t("Cons", "العيوب")}</p>
                          <ul className="space-y-1">
                            {tech.cons.map((con, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isPremium ? (
            <div className="grid gap-4 md:grid-cols-3">
              {techStack.estimated_time && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-slate-800">{t("Estimated Time", "الوقت المقدر")}</h4>
                  </div>
                  <p className="text-slate-600">{techStack.estimated_time}</p>
                </div>
              )}
              {techStack.languages && techStack.languages.length > 0 && (
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-semibold text-slate-800">{t("Languages", "اللغات")}</h4>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {techStack.languages.map((lang, idx) => (
                      <Badge key={idx} className="bg-indigo-100 text-indigo-700">{lang}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {techStack.total_team_cost_monthly && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-slate-800">{t("Monthly Team Cost", "تكلفة الفريق الشهرية")}</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-600">${techStack.total_team_cost_monthly.toLocaleString()}</p>
                </div>
              )}
            </div>
          ) : (
            <LockedContent
              title={t("Time & Cost Details", "تفاصيل الوقت والتكلفة")}
              description={t("Unlock estimated time, languages, and team cost breakdown", "افتح الوقت المقدر واللغات وتفاصيل تكلفة الفريق")}
              isArabic={isArabic}
              onUnlock={onUnlock}
              isUnlocking={isUnlocking}
              variant="inline"
            />
          )}

          {techStack.implementation_details && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-2">{t("Implementation Details", "تفاصيل التنفيذ")}</h4>
              <p className="text-slate-600">{techStack.implementation_details}</p>
            </div>
          )}

          {teamRequirements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                {t("Team Requirements", "متطلبات الفريق")}
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {teamRequirements.map((member, idx) => (
                  <div key={idx} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-slate-800">{member.role}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-slate-600 text-sm">{t("Count", "العدد")}: {member.count}</span>
                      <Badge className="bg-purple-100 text-purple-700">${member.monthly_cost_usd?.toLocaleString()}/mo</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-effect border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Layers className="w-6 h-6" />
            {t("Development Plan", "خطة التطوير")}
          </h2>
        </div>
        <CardContent className="p-6">
          {developmentPlan.length > 0 ? (
            <div className="space-y-6">
              {developmentPlan.map((version, idx) => (
                <div key={idx} className="relative">
                  {idx < developmentPlan.length - 1 && (
                    <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-amber-200"></div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 bg-amber-50 rounded-xl p-5 border border-amber-200">
                      <h3 className="font-bold text-lg text-slate-800 mb-3">{version.version}</h3>
                      {version.features && version.features.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-slate-700 mb-2">{t("Features", "الميزات")}</h4>
                          <div className="space-y-2">
                            {version.features.map((feat, i) => (
                              <div key={i} className="bg-white rounded-lg p-3 border border-amber-100">
                                <p className="font-medium text-slate-800">{feat.feature}</p>
                                {feat.how_to_build && (
                                  <p className="text-sm text-slate-600 mt-1">
                                    <span className="font-medium text-amber-600">{t("How to build", "كيفية البناء")}:</span> {feat.how_to_build}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {version.prototype_approach && (
                        <div className="bg-white rounded-lg p-3 border border-amber-100">
                          <p className="text-sm">
                            <span className="font-medium text-amber-600">{t("Prototype Approach", "نهج النموذج الأولي")}:</span>{" "}
                            <span className="text-slate-600">{version.prototype_approach}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">{t("No development plan available.", "لا توجد خطة تطوير.")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-effect border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Rocket className="w-6 h-6" />
            {t("MVP (Minimum Viable Product)", "المنتج القابل للتطبيق الأدنى")}
          </h2>
        </div>
        <CardContent className="p-6">
          {mvp.core_features || mvp.scope || mvp.timeline ? (
            <div className="space-y-4">
              {mvp.core_features && mvp.core_features.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">{t("Core Features", "الميزات الأساسية")}</h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {mvp.core_features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {mvp.scope && (
                  <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                    <h4 className="font-semibold text-slate-800 mb-2">{t("Scope", "النطاق")}</h4>
                    <p className="text-slate-600">{mvp.scope}</p>
                  </div>
                )}
                {mvp.timeline && (
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-semibold text-slate-800">{t("Timeline", "الجدول الزمني")}</h4>
                    </div>
                    <p className="text-slate-600">{mvp.timeline}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">{t("No MVP details available.", "لا تتوفر تفاصيل MVP.")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-effect border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            {t("AI Tools", "أدوات الذكاء الاصطناعي")}
          </h2>
        </div>
        <CardContent className="p-6">
          {aiTools.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {aiTools.map((tool, idx) => (
                <div key={idx} className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-5 border border-purple-200 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Cpu className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{tool.name}</h4>
                      <p className="text-sm text-purple-600 mb-2">{tool.purpose}</p>
                      {tool.how_it_helps && (
                        <p className="text-sm text-slate-600">{tool.how_it_helps}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">{t("No AI tools recommendations available.", "لا توجد توصيات لأدوات الذكاء الاصطناعي.")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
