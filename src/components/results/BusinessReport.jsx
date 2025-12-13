
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Shield,
  Rocket,
  BarChart3,
  Lightbulb,
  ClipboardCheck // Added ClipboardCheck icon
} from "lucide-react";

export default function BusinessReport({ report, isArabic = false }) {
  if (!report) {
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardContent className="text-center py-16">
          <p className="text-slate-600">{isArabic ? 'بيانات تقرير الأعمال غير متوفرة.' : 'Business report data not available.'}</p>
        </CardContent>
      </Card>
    );
  }

  // helper to support string or array returns
  const toList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    // Split by new line or comma, then trim and filter empty strings
    return String(value).split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);
  };

  // Modified: Removed Risks & Mitigation and Funding Recommendations from these narrative sections,
  // as they are now consolidated in the dedicated 'Risk & Funding' card below.
  const sections = [
    {
      title: isArabic ? "نموذج العمل" : "Business Model",
      icon: Lightbulb,
      content: report.business_model,
      color: "text-purple-600"
    },
    {
      title: isArabic ? "استراتيجية السوق" : "Market Strategy",
      icon: Target,
      content: report.market_strategy,
      color: "text-indigo-600"
    },
    {
      title: isArabic ? "استراتيجية دخول السوق" : "Go-to-Market Strategy",
      icon: Rocket,
      content: report.go_to_market,
      color: "text-amber-600"
    }
  ];

  const partnerships = toList(report.partnerships_opportunities);
  const swot = report.swot_analysis || {};

  const getViabilityText = (score) => {
    if (isArabic) {
      if (score >= 8) return 'إمكانات ممتازة';
      if (score >= 6) return 'إمكانات جيدة';
      return 'يحتاج إلى تحسين';
    }
    if (score >= 8) return 'Excellent Potential';
    if (score >= 6) return 'Good Potential';
    return 'Needs Improvement';
  }

  // NEW: derive assessment & risk content from business report
  // Ensure success_metrics is always an array for mapping, handling both string/array inputs
  const successMetrics = Array.isArray(report.success_metrics) ? report.success_metrics : toList(report.success_metrics);
  const validationMethod = report.validation_methodology;
  const keyOpps = toList(report.key_opportunities);
  const keyChalls = toList(report.key_challenges);
  const risksMitigation = report.risks_and_mitigation;
  const fundingRecs = report.funding_recommendations;

  return (
    <div className="space-y-6">
      {/* Revenue Streams */}
      {report.revenue_streams && (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              {isArabic ? 'مصادر الإيرادات' : 'Revenue Streams'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {report.revenue_streams.map((stream, index) => (
                <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-green-800 font-medium">{stream}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Narrative Sections (Business Model, Market Strategy, Go-to-Market) */}
      <div className="space-y-6">
        {sections.map((section) => (
          section.content ? ( // Conditionally render section only if content exists
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

      {/* NEW: Assessment & Metrics */}
      {(validationMethod || (successMetrics && successMetrics.length > 0)) && (
        <Card className="glass-effect border-0 shadow-lg print-content">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              {isArabic ? 'التقييم والمقاييس' : 'Assessment & Metrics'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {successMetrics?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-800">{isArabic ? 'مقاييس النجاح ومؤشرات الأداء' : 'Success metrics & KPIs'}</span>
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  {successMetrics.map((m, i) => (
                    <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-blue-800">{m}</div>
                  ))}
                </div>
              </div>
            )}

            {validationMethod && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">{isArabic ? 'منهجية التحقق' : 'Validation methodology'}</span>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">{validationMethod}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* NEW: Risk & Funding */}
      {(risksMitigation || fundingRecs || keyOpps.length > 0 || keyChalls.length > 0) && (
        <Card className="glass-effect border-0 shadow-lg print-content">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              {isArabic ? 'المخاطر والتمويل' : 'Risk & Funding'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {keyOpps.length > 0 && (
              <div>
                <p className="font-semibold text-slate-800 mb-2">{isArabic ? 'أهم الفرص' : 'Key opportunities'}</p>
                <ul className="list-disc ps-6 text-slate-700 space-y-1">
                  {keyOpps.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              </div>
            )}
            {keyChalls.length > 0 && (
              <div>
                <p className="font-semibold text-slate-800 mb-2">{isArabic ? 'أهم التحديات' : 'Key challenges'}</p>
                <ul className="list-disc ps-6 text-slate-700 space-y-1">
                  {keyChalls.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
            {risksMitigation && (
              <div>
                <p className="font-semibold text-slate-800 mb-1">{isArabic ? 'المخاطر والتخفيف' : 'Risks & mitigation'}</p>
                <p className="text-slate-700 whitespace-pre-wrap">{risksMitigation}</p>
              </div>
            )}
            {fundingRecs && (
              <div>
                <p className="font-semibold text-slate-800 mb-1">{isArabic ? 'توصيات التمويل' : 'Funding recommendations'}</p>
                <p className="text-slate-700 whitespace-pre-wrap">{fundingRecs}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Partnerships Opportunities */}
      {partnerships.length > 0 && (
        <Card className="glass-effect border-0 shadow-lg print-content">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <Users className="w-5 h-5" />
              {isArabic ? 'فرص الشراكات' : 'Partnerships Opportunities'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ps-6 text-slate-700 space-y-2">
              {partnerships.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* SWOT Analysis */}
      {(swot.strengths || swot.weaknesses || swot.opportunities || swot.threats) && (
        <Card className="glass-effect border-0 shadow-lg print-content">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              {isArabic ? 'تحليل SWOT' : 'SWOT Analysis'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-emerald-50 border-emerald-100">
                <h4 className="font-semibold text-emerald-700 mb-2">{isArabic ? 'نقاط القوة' : 'Strengths'}</h4>
                {toList(swot.strengths).length ? (
                  <ul className="list-disc ps-6 space-y-1 text-emerald-800">
                    {toList(swot.strengths).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                ) : <p className="text-slate-500 text-sm">{isArabic ? 'غير متوفر' : 'Not specified'}</p>}
              </div>

              <div className="p-4 rounded-lg border bg-red-50 border-red-100">
                <h4 className="font-semibold text-red-700 mb-2">{isArabic ? 'نقاط الضعف' : 'Weaknesses'}</h4>
                {toList(swot.weaknesses).length ? (
                  <ul className="list-disc ps-6 space-y-1 text-red-800">
                    {toList(swot.weaknesses).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                ) : <p className="text-slate-500 text-sm">{isArabic ? 'غير متوفر' : 'Not specified'}</p>}
              </div>

              <div className="p-4 rounded-lg border bg-blue-50 border-blue-100">
                <h4 className="font-semibold text-blue-700 mb-2">{isArabic ? 'الفرص' : 'Opportunities'}</h4>
                {toList(swot.opportunities).length ? (
                  <ul className="list-disc ps-6 space-y-1 text-blue-800">
                    {toList(swot.opportunities).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                ) : <p className="text-slate-500 text-sm">{isArabic ? 'غير متوفر' : 'Not specified'}</p>}
              </div>

              <div className="p-4 rounded-lg border bg-amber-50 border-amber-100">
                <h4 className="font-semibold text-amber-700 mb-2">{isArabic ? 'التهديدات' : 'Threats'}</h4>
                {toList(swot.threats).length ? (
                  <ul className="list-disc ps-6 space-y-1 text-amber-800">
                    {toList(swot.threats).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                ) : <p className="text-slate-500 text-sm">{isArabic ? 'غير متوفر' : 'Not specified'}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Viability Score */}
      {report.overall_viability_score && (
        <Card className="glass-effect border-0 shadow-lg print-content">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              {isArabic ? 'تقييم الجدوى التجارية الشامل' : 'Overall Business Viability Assessment'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-6xl font-bold text-slate-800 mb-2">
                {report.overall_viability_score}/10
              </div>
              <Badge className={`text-lg px-4 py-2 ${
                report.overall_viability_score >= 8
                  ? 'bg-emerald-100 text-emerald-800'
                  : report.overall_viability_score >= 6
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {getViabilityText(report.overall_viability_score)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
