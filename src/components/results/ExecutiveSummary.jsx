
import React from 'react';
import ScoreCard from "./ScoreCard";
import { TrendingUp, Code, Gauge } from "lucide-react";

export default function ExecutiveSummary({ analysis, businessReport, technicalReport, isArabic = false }) {
  const rawViability = Number(businessReport?.overall_viability_score ?? businessReport?.overall_business_viability_assessment ?? 0);
  const rawComplexity = Number(technicalReport?.complexity_score ?? 0);
  const rawAiMvp = technicalReport?.mvp_by_ai_tool_score;

  const clamp = (v, min, max) => {
    if (v == null || isNaN(Number(v))) return null;
    return Math.min(max, Math.max(min, Number(v)));
  };

  const viabilityScore = clamp(rawViability, 0, 10);
  const complexityScore = clamp(rawComplexity, 0, 10);
  const aiMvpScore = clamp(rawAiMvp, 0, 10);
  const overallAssessmentScore = clamp(businessReport?.overall_business_viability_assessment ?? viabilityScore ?? 0, 0, 10);

  const getComplexityLevel = (score) => {
    if (score == null) return isArabic ? "غير متوفر" : "N/A";
    if (isArabic) {
      if (score <= 3) return "منخفض";
      if (score <= 6) return "متوسط";
      return "عالي";
    }
    if (score <= 3) return "Low";
    if (score <= 6) return "Medium";
    return "High";
  };

  const badgeForViability = (() => {
    if (viabilityScore == null) return isArabic ? "غير متوفر" : "N/A";
    if (viabilityScore >= 8) return isArabic ? "ممتاز" : "Excellent";
    if (viabilityScore >= 6) return isArabic ? "جيد" : "Good";
    return isArabic ? "يحتاج تحسين" : "Needs Work";
  })();

  // NEW: Business viability footnote
  const businessViabilityFootnote = isArabic
    ? "درجة أعلى تعني قابلية نجاح تجاري أكبر (ملاءمة السوق، الطلب، المنافسة، التكاليف)."
    : "Higher score means greater likelihood of commercial success (market fit, demand, competition, costs).";

  // Updated: clearer technical complexity explanation
  const complexityFootnote = isArabic
    ? "درجة أقل تعني بناء أبسط وأسرع؛ درجة أعلى تعني تعقيداً أكبر ووقتاً وتكلفة أعلى."
    : "Lower score means a simpler, faster build; higher score means more complexity, time, and cost.";

  const aiMvpFootnote = isArabic
    ? "درجة أعلى تعني أن أدوات الذكاء الاصطناعي/المنصات قليلة الكود يمكنها بناء معظم الـ MVP بسرعة مع أقل قدر من البرمجة المخصصة."
    : "Higher score means AI/no‑code tools can build most of the MVP quickly with minimal custom code.";

  const overallFootnote = isArabic
    ? "تلخيص لمدى قابلية الفكرة للنجاح تجارياً بناءً على السوق والتنفيذ والتكلفة والمخاطر."
    : "Summary of how viable the idea is to succeed considering market, execution, cost, and risks.";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <ScoreCard
          title={isArabic ? "درجة الجدوى" : "Business Viability"}
          Icon={TrendingUp}
          score={viabilityScore}
          color="#10b981"
          subtitle={badgeForViability}
          footnote={businessViabilityFootnote}
        />
        <ScoreCard
          title={isArabic ? "التعقيد التقني" : "Technical Complexity"}
          Icon={Code}
          score={complexityScore}
          color="#3b82f6"
          subtitle={getComplexityLevel(complexityScore)}
          footnote={complexityFootnote}
        />
        <ScoreCard
          title={isArabic ? "درجة بناء MVP بأداة ذكاء اصطناعي" : "AI Tool MVP Build Score"}
          Icon={Gauge}
          score={aiMvpScore}
          color="#a855f7"
          subtitle={aiMvpScore != null ? undefined : (isArabic ? "غير متوفر" : "N/A")}
          footnote={aiMvpFootnote}
        />
        <ScoreCard
          title={isArabic ? "التقييم الشامل للجدوى" : "Overall Viability Assessment"}
          Icon={TrendingUp}
          score={overallAssessmentScore}
          color="#22c55e"
          footnote={overallFootnote}
        />
      </div>
    </div>
  );
}
