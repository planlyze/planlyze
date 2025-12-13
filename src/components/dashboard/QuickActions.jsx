
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, FileText, Zap } from "lucide-react";

export default function QuickActions({ isArabic = false }) {
  const actions = [
    {
      title: isArabic ? "تحليل جديد" : "New Analysis",
      description: isArabic ? "ابدأ تحليل فكرة عمل جديدة" : "Start analyzing a new business idea",
      icon: Plus,
      href: createPageUrl("NewAnalysis"),
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      title: isArabic ? "عرض التقارير" : "View Reports",
      description: isArabic ? "تصفح تقارير التحليل الخاصة بك" : "Browse your analysis reports",
      icon: FileText,
      href: createPageUrl("Reports"),
      gradient: "from-blue-500 to-blue-600",
    }
  ];

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Zap className="w-5 h-5 text-amber-500" />
          {isArabic ? "إجراءات سريعة" : "Quick Actions"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => (
            <Link key={action.title} to={action.href} className="w-full">
              <Button
                variant="outline"
                className="w-full justify-start items-center h-auto min-h-[64px] border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 px-3"
              >
                <div className={`p-2 rounded-lg bg-gradient-to-r ${action.gradient} mr-3`}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800 leading-tight">{action.title}</p>
                  <p className="text-xs text-slate-600">{action.description}</p>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
