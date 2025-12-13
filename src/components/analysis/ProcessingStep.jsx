
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, FileText, CheckCircle } from "lucide-react";

const PROCESSING_STEPS = [
  {
    id: 'business',
    icon: Brain,
    title: 'Business Analysis',
    description: 'Planlyze analyzing market opportunities and competition...',
  },
  {
    id: 'technical',
    icon: TrendingUp,
    title: 'Technical Analysis',
    description: 'Planlyze evaluating technology stack and architecture...',
  },
  {
    id: 'report',
    icon: FileText,
    title: 'Report Generation',
    description: 'Planlyze compiling comprehensive analysis report...',
  },
  {
    id: 'complete',
    icon: CheckCircle,
    title: 'Analysis Complete',
    description: 'Your report is ready!',
  }
];

export default function ProcessingStep({ progress = 0 }) {
  // Clamp progress and derive step index from real progress
  const pct = Math.max(0, Math.min(100, Number(progress) || 0));
  const currentStepIndex =
    pct >= 100 ? 3 :
    pct >= 66 ? 2 :
    pct >= 33 ? 1 : 0;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-slate-700">Analysis Progress</span>
          <span className="text-slate-500">{Math.round(pct)}%</span>
        </div>
        {/* Updated colors: soft track + brand gradient fill */}
        <Progress
          value={pct}
          className="h-3 rounded-full bg-purple-100 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-orange-500"
        />
      </div>

      {/* Processing Steps */}
      <div className="space-y-4">
        {PROCESSING_STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;

          return (
            <Card
              key={step.id}
              className={`transition-all duration-500 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-50 to-orange-50 border-purple-200'
                  : isCompleted
                  ? 'bg-purple-50 border-purple-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-full transition-all duration-500 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-orange-500 animate-pulse'
                        : isCompleted
                        ? 'bg-purple-600'
                        : 'bg-slate-300'
                    }`}
                  >
                    <StepIcon className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      isActive || isCompleted ? 'text-purple-800' : 'text-slate-600'
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm ${
                      isActive ? 'text-purple-600' : isCompleted ? 'text-purple-600' : 'text-slate-500'
                    }`}>
                      {step.description}
                    </p>
                  </div>

                  {isCompleted && (
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  )}

                  {isActive && pct < 100 && (
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Encouraging Message */}
      <div className="text-center py-4">
        <p className="text-slate-600">
          Planlyze is working hard to provide you with comprehensive insights tailored to the Syrian market. This usually takes 1-3 minutes.
        </p>
      </div>
    </div>
  );
}
