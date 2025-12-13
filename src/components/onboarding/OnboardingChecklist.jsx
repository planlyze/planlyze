import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, User, FileText, Wallet, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Progress } from "@/components/ui/progress";

const checklistItems = [
  {
    id: "profileCompleted",
    icon: User,
    title: "Complete Your Profile",
    description: "Add your contact details and location",
    actionText: "Complete Profile",
    actionUrl: "/Profile"
  },
  {
    id: "firstAnalysisCreated",
    icon: FileText,
    title: "Create Your First Analysis",
    description: "Generate a business analysis report",
    actionText: "Create Analysis",
    actionUrl: "/NewAnalysis"
  },
  {
    id: "creditsViewed",
    icon: Wallet,
    title: "Explore Credit Packages",
    description: "Learn about premium features",
    actionText: "View Credits",
    actionUrl: "/Credits"
  },
  {
    id: "reportViewed",
    icon: Eye,
    title: "View Your Reports",
    description: "Access your completed analyses",
    actionText: "View Reports",
    actionUrl: "/Reports"
  }
];

export default function OnboardingChecklist({ user, onItemComplete }) {
  const isArabic = user?.preferred_language === 'arabic';
  const checklist = user?.onboarding_checklist || {};
  
  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = checklistItems.length;
  const progress = (completedCount / totalCount) * 100;

  if (completedCount === totalCount) return null;

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <CheckCircle2 className="w-5 h-5" />
            {isArabic ? "ابدأ رحلتك" : "Get Started"}
          </CardTitle>
          <span className="text-sm font-semibold text-purple-700">
            {completedCount}/{totalCount} {isArabic ? "مكتمل" : "Complete"}
          </span>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {checklistItems.map((item) => {
          const isCompleted = checklist[item.id];
          const Icon = item.icon;
          
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                isCompleted 
                  ? 'bg-white/50 opacity-75' 
                  : 'bg-white shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-100' : 'bg-purple-100'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Icon className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${isCompleted ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                    {isArabic ? item.title : item.title}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {isArabic ? item.description : item.description}
                  </p>
                </div>
              </div>
              {!isCompleted && (
                <Link to={createPageUrl(item.actionUrl)}>
                  <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                    {isArabic ? item.actionText : item.actionText}
                  </Button>
                </Link>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}