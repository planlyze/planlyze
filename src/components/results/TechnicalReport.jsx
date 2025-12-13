
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Code,
  Server,
  Database,
  Cloud,
  Users,
  Shield,
  Layers,
  DollarSign,
  AlertTriangle,
  Settings,
  Bot,
  Gauge,
  BookOpen,
  ListChecks,
  Rocket,
  CalendarClock,
  Wrench
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import TechStackPreview from "./TechStackPreview"; // Added import

export default function TechnicalReport({ report, isArabic = false }) {
  if (!report) {
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardContent className="text-center py-16">
          <p className="text-slate-600">{isArabic ? 'بيانات التقرير التقني غير متوفرة.' : 'Technical report data not available.'}</p>
        </CardContent>
      </Card>
    );
  }

  const getComplexityColor = (score) => {
    if (score <= 3) return "bg-green-100 text-green-800";
    if (score <= 6) return "bg-amber-100 text-amber-800";
    return "bg-red-100 text-red-800";
  };

  const getComplexityLabel = (score) => {
    if (isArabic) {
      if (score <= 3) return "تعقيد منخفض";
      if (score <= 6) return "تعقيد متوسط";
      return "تعقيد عالي";
    }
    if (score <= 3) return "Low Complexity";
    if (score <= 6) return "Medium Complexity";
    return "High Complexity";
  };

  // Helpers
  const asArray = (v) => Array.isArray(v) ? v : (v ? String(v).split(/\r?\n|,/).map(s => s.trim()).filter(Boolean) : []);

  // Pull new fields
  const noCode = asArray(report.no_code_tools);
  const aiPercent = typeof report.ai_automation_percentage === 'number' ? report.ai_automation_percentage : null;
  const openSource = asArray(report.open_source_solutions);
  const mvpFeatures = asArray(report.mvp_core_features);
  const teamSalaries = Array.isArray(report.team_salary_ranges) ? report.team_salary_ranges : [];
  const actionPlan = asArray(report.mvp_launch_action_plan);
  const timelinePricing = Array.isArray(report.timeline_pricing) ? report.timeline_pricing : [];
  const complexityAssessment = report.complexity_assessment;

  const sections = [
    {
      title: isArabic ? "بنية النظام" : "System Architecture",
      icon: Layers,
      content: report.architecture_overview,
      color: "text-blue-600"
    },
    {
      title: isArabic ? "متطلبات البنية التحتية" : "Infrastructure Requirements",
      icon: Cloud,
      content: report.infrastructure,
      color: "text-purple-600"
    },
    {
      title: isArabic ? "اعتبارات الأمان" : "Security Considerations",
      icon: Shield,
      content: report.security_considerations,
      color: "text-red-600"
    },
    {
      title: isArabic ? "المخاطر التقنية" : "Technical Risks",
      icon: AlertTriangle,
      content: report.technical_risks,
      color: "text-amber-600"
    },
    {
      title: isArabic ? "تفصيل التكاليف" : "Cost Breakdown",
      icon: DollarSign,
      content: report.cost_breakdown,
      color: "text-green-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Insert TechStackPreview near the top of the technical report */}
      <TechStackPreview technicalReport={report} isArabic={isArabic} />

      {/* Technology Stack */}
      {report.technology_stack && (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              {isArabic ? 'المجموعة التقنية الموصى بها' : 'Recommended Technology Stack'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(report.technology_stack).map(([key, value]) => {
                const icons = { frontend: Code, backend: Server, database: Database, cloud: Cloud };
                const Icon = icons[key] || Settings;
                const translatedKey = isArabic ? ({
                  frontend: 'الواجهة الأمامية', backend: 'الخلفية', database: 'قاعدة البيانات', cloud: 'السحابة'
                }[key] || key) : key.replace(/_/g, ' ');
                return (
                  <div key={key} className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
                    <Icon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-blue-800 capitalize mb-1">{translatedKey}</p>
                    <p className="text-blue-600 text-sm font-medium">{value}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No-code tools & AI automation */}
      {(noCode.length > 0 || aiPercent !== null) && (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-slate-700" />
              {isArabic ? "أدوات اللا-كود والأتمتة بالذكاء الاصطناعي" : "No-code Tools & AI Automation"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {noCode.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">{isArabic ? "أدوات No‑Code الموصى بها" : "Recommended No‑code Tools"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {noCode.map((tool, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full text-sm bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {aiPercent !== null && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-slate-800">{isArabic ? "نسبة الأتمتة بالذكاء الاصطناعي" : "AI Automation Percentage"}</span>
                  <span className="ml-auto text-slate-700">{Math.round(aiPercent)}%</span>
                </div>
                <Progress value={Math.max(0, Math.min(100, aiPercent))} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Open-source solutions */}
      {openSource.length > 0 && (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              {isArabic ? "حلول ومكتبات مفتوحة المصدر" : "Open-source Solutions & Libraries"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-6 space-y-2 text-slate-700">
              {openSource.map((lib, i) => <li key={i}>{lib}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* MVP core features */}
      {mvpFeatures.length > 0 && (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-emerald-600" />
              {isArabic ? "ميزات MVP الأساسية" : "MVP Core Features"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal ps-6 space-y-2 text-slate-700">
              {mvpFeatures.map((feat, idx) => <li key={idx}>{feat}</li>)}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Development Phases */}
      {report.development_phases && (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              {isArabic ? 'مراحل التطوير والمعالم' : 'Development Phases & Milestones'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.development_phases.map((phase, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-purple-800 font-medium flex-1">{phase}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team requirements with Syria salary ranges */}
      {(report.team_requirements || teamSalaries.length > 0) && (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              {isArabic ? "متطلبات الفريق والأدوار (رواتب سوريا)" : "Team Requirements & Roles (Syria Salaries)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.team_requirements && (
              <div className="grid md:grid-cols-2 gap-4">
                {report.team_requirements.map((role, index) => (
                  <div key={index} className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <p className="text-emerald-800 font-medium">{role}</p>
                  </div>
                ))}
              </div>
            )}
            {teamSalaries.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600">
                      <th className="py-2 pr-4">{isArabic ? "الدور" : "Role"}</th>
                      <th className="py-2 pr-4">{isArabic ? "الراتب (ل.س)" : "Salary (SYP)"}</th>
                      <th className="py-2">{isArabic ? "الراتب (USD)" : "Salary (USD)"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamSalaries.map((r, i) => (
                      <tr key={i} className="border-t border-slate-200/60">
                        <td className="py-2 pr-4 text-slate-800">{r.role}</td>
                        <td className="py-2 pr-4 text-slate-700">{r.salary_syp_range || "-"}</td>
                        <td className="py-2 text-slate-700">{r.salary_usd_range || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MVP launch action plan */}
      {actionPlan.length > 0 && (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-amber-600" />
              {isArabic ? "خطة إطلاق MVP" : "MVP Launch Action Plan"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal ps-6 space-y-2 text-slate-700">
              {actionPlan.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Timeline with pricing by stack/AI tool */}
      {timelinePricing.length > 0 && (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-blue-600" />
              {isArabic ? "الجدول الزمني والتسعير حسب التقنية/أداة الذكاء الاصطناعي" : "Timeline & Pricing by Stack/AI Tool"}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="py-2 pr-4">{isArabic ? "البند" : "Item"}</th>
                  <th className="py-2 pr-4">{isArabic ? "المدة (أسابيع)" : "Duration (weeks)"}</th>
                  <th className="py-2 pr-4">{isArabic ? "التكلفة (USD)" : "Estimated Cost (USD)"}</th>
                  <th className="py-2">{isArabic ? "ملاحظات" : "Notes"}</th>
                </tr>
              </thead>
              <tbody>
                {timelinePricing.map((row, i) => (
                  <tr key={i} className="border-t border-slate-200/60">
                    <td className="py-2 pr-4 text-slate-800">{row.item}</td>
                    <td className="py-2 pr-4 text-slate-700">{row.duration_weeks ?? "-"}</td>
                    <td className="py-2 pr-4 text-slate-700">{row.estimated_cost_usd != null ? `$${row.estimated_cost_usd}` : "-"}</td>
                    <td className="py-2 text-slate-700">{row.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Detailed narrative sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          section.content ? (
            <Card key={section.title} className="glass-effect border-0 shadow-lg print-content">
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${section.color}`}>
                  <section.icon className="w-5 h-5" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {section.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null
        ))}
      </div>

      {/* Complexity Score + Assessment */}
      {report.complexity_score && (
        <Card className="glass-effect border-0 shadow-lg print-content">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-slate-600" />
              {isArabic ? 'تقييم التعقيد التقني' : 'Technical Complexity Assessment'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className="text-6xl font-bold text-slate-800 mb-2">
                {report.complexity_score}/10
              </div>
              <span className={`inline-block text-sm px-3 py-1 rounded ${getComplexityColor(report.complexity_score)}`}>
                {getComplexityLabel(report.complexity_score)}
              </span>
            </div>
            {complexityAssessment && (
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {complexityAssessment}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
