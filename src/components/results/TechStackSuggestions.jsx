import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Award, Layers, Server, Database, Cloud, Smartphone, Info, Check, X, Clock, DollarSign } from "lucide-react";

function StackBadges({ opt }) {
  const items = [
    { key: "frontend", label: "Frontend", icon: Layers },
    { key: "backend", label: "Backend", icon: Server },
    { key: "database", label: "Database", icon: Database },
    { key: "cloud", label: "Cloud", icon: Cloud },
    { key: "mobile", label: "Mobile", icon: Smartphone },
  ];
  return (
    <div className="flex flex-wrap gap-2 min-w-0 w-full">
      {items.map(({ key, label, icon: Icon }) => {
        const val = (opt?.[key] || "").toString().trim();
        if (!val) return null;
        return (
          <Badge
            key={key}
            variant="outline"
            className="px-2.5 py-2 flex flex-col items-start gap-1 whitespace-normal text-left max-w-full"
          >
            <div className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="text-xs text-slate-700 font-medium shrink-0">{label}:</span>
            </div>
            <div className="text-xs text-slate-700 break-words break-all w-full">
              {val}
            </div>
          </Badge>
        );
      })}
    </div>
  );
}

function ListBlock({ title, items, positive = true, isArabic = false }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {positive ? (
          <Check className="w-4 h-4 text-emerald-600" />
        ) : (
          <X className="w-4 h-4 text-rose-600" />
        )}
        <span className="font-semibold text-slate-800  text-sm">
          {title}
        </span>
      </div>
      <ul className="list-disc ms-5 space-y-1 break-words">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-slate-700 break-words">
            {typeof it === "string" ? it : JSON.stringify(it)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatUSD(value) {
  const n = Number(value);
  if (!isFinite(n)) return null;
  try {
    return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  } catch {
    return `$${Math.round(n)}`;
  }
}

function normalizeTeam(opt) {
  const roles = Array.isArray(opt?.team_roles) ? opt.team_roles : (Array.isArray(opt?.estimated_team) ? opt.estimated_team : []);
  const norm = roles
    .map((r) => {
      const role = r?.role || r?.title || "";
      if (!role) return null;
      const count = Number(r?.count ?? 1) || 1;
      const salary = Number(r?.salary_usd_per_month ?? r?.monthly_salary_usd ?? r?.salary ?? 0) || 0;
      const seniority = r?.seniority || "";
      return { role, seniority, count, salary };
    })
    .filter(Boolean);
  let monthlyCost = Number(opt?.estimated_monthly_team_cost_usd ?? opt?.team_monthly_cost_usd ?? 0) || 0;
  if (!monthlyCost && norm.length) {
    monthlyCost = norm.reduce((sum, r) => sum + (r.count * r.salary), 0);
  }
  const mvpCost = Number(opt?.estimated_mvp_cost_usd ?? 0) || 0;
  const timelineWeeks = Number(
    opt?.estimated_timeline_weeks ?? opt?.timeline_weeks ?? opt?.timeline?.weeks ?? 0
  ) || 0;

  return { roles: norm, monthlyCost, mvpCost, timelineWeeks };
}

export default function TechStackSuggestions({ suggestionsData, isArabic = false }) {
  const data = suggestionsData || {};
  const allSuggestions = Array.isArray(data.technology_stack_suggestions) ? data.technology_stack_suggestions : [];
  const suggestions = allSuggestions.slice(0, 3);
  const recommendedIndex = typeof data.recommended_option_index === "number" ? data.recommended_option_index : -1;

  if (suggestions.length === 0) return null;

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-xl font-bold text-slate-800 break-words">
            {isArabic ? "خيارات المجموعة التقنية" : "Technology Stack Options"}
          </CardTitle>
          {(recommendedIndex >= 0 && recommendedIndex < suggestions.length) && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1">
              <Award className="w-4 h-4" />
              {isArabic ? "موصى به" : "Recommended"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {suggestions.map((opt, idx) => {
          const isRec = idx === recommendedIndex;
          const { roles, monthlyCost, mvpCost, timelineWeeks } = normalizeTeam(opt);
          const hasCosts = !!monthlyCost || !!mvpCost || roles.length > 0 || !!timelineWeeks;

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-colors overflow-hidden ${isRec ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200/70 bg-white"}`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-slate-800 break-words">
                      {opt?.name || (isArabic ? `الخيار ${idx + 1}` : `Option ${idx + 1}`)}
                    </h3>
                    {isRec && (
                      <Badge className="bg-emerald-600 text-white">
                        <Award className="w-3.5 h-3.5 mr-1" />
                        {isArabic ? "موصى به" : "Recommended"}
                      </Badge>
                    )}
                  </div>
                  {opt?.description && (
                    <p className="text-sm text-slate-700 mt-1 break-words">
                      {opt.description}
                    </p>
                  )}

                  {/* Cost/Timeline badges */}
                  {hasCosts && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {timelineWeeks > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs">
                            {isArabic ? "المدة" : "Timeline"}: {timelineWeeks} {isArabic ? "أسابيع" : "weeks"}
                          </span>
                        </Badge>
                      )}
                      {monthlyCost > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span className="text-xs">
                            {isArabic ? "تكلفة الفريق/شهر" : "Team/mo"}: {formatUSD(monthlyCost)}
                          </span>
                        </Badge>
                      )}
                      {mvpCost > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span className="text-xs">
                            {isArabic ? "تكلفة MVP" : "MVP Cost"}: {formatUSD(mvpCost)}
                          </span>
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="min-w-0 max-w-full">
                  <StackBadges opt={opt} />
                </div>
              </div>

              <Separator className="my-4" />

              {/* Pros / Cons */}
              <div className="grid md:grid-cols-2 gap-4">
                <ListBlock
                  title={isArabic ? "المزايا" : "Pros"}
                  items={opt?.pros || []}
                  positive
                  isArabic={isArabic}
                />
                <ListBlock
                  title={isArabic ? "العيوب" : "Cons"}
                  items={opt?.cons || []}
                  positive={false}
                  isArabic={isArabic}
                />
              </div>

              {/* Team & Salary */}
              {hasCosts && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-800 mb-2">
                    {isArabic ? "الفريق والتكاليف التقديرية" : "Team & Cost Estimates"}
                  </h4>
                  {roles.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="min-w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr className="text-left">
                            <th className="px-3 py-2 text-slate-700">{isArabic ? "الدور" : "Role"}</th>
                            <th className="px-3 py-2 text-slate-700">{isArabic ? "الدرجة" : "Seniority"}</th>
                            <th className="px-3 py-2 text-slate-700">{isArabic ? "العدد" : "Count"}</th>
                            <th className="px-3 py-2 text-slate-700">{isArabic ? "الراتب/شهر" : "Salary/mo"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {roles.map((r, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 text-slate-800">{r.role}</td>
                              <td className="px-3 py-2 text-slate-700">{r.seniority || "-"}</td>
                              <td className="px-3 py-2 text-slate-700">{r.count}</td>
                              <td className="px-3 py-2 text-slate-700">{formatUSD(r.salary) || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600">
                      {isArabic ? "لا توجد تفاصيل أدوار، مع ذلك تم احتساب التكاليف التقديرية أعلاه." : "No role breakdown provided; estimates shown above."}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}