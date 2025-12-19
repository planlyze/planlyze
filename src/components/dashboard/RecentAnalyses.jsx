import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileText,
  Plus,
  Eye,
  Sparkles } from
"lucide-react";

const statusIcons = {
  draft: Clock,
  analyzing: AlertCircle,
  completed: CheckCircle2,
  failed: AlertCircle
};

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  analyzing: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800"
};

const statusLabels = {
  draft: { en: "Draft", ar: "مسودة" },
  analyzing: { en: "Analyzing", ar: "قيد التحليل" },
  completed: { en: "Completed", ar: "مكتمل" },
  failed: { en: "Failed", ar: "فشل" }
};

export default function RecentAnalyses({ analyses, isLoading, onRefresh, isArabic = false }) {
  const recentAnalyses = analyses.slice(0, 5);

  return (
    <Card className="glass-effect border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-purple-50 border-b-2 border-purple-100">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 bg-purple-600 rounded-lg shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-purple-700">
              {isArabic ? "أحدث التحليلات" : "Recent Analyses"}
            </span>
          </CardTitle>
          <Link to={createPageUrl("Reports")}>
            <Button variant="outline" className="text-sm border-2 border-purple-300 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300">
              {isArabic ? "عرض الكل" : "View All"}
              <ArrowRight className="w-4 h-4 ml-2 text-purple-600" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ?
        <div className="space-y-4">
            {[...Array(3)].map((_, i) =>
          <div key={i} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-5 w-48 gradient-primary opacity-30 rounded-md" />
                  <Skeleton className="h-5 w-20 gradient-primary opacity-30 rounded-md" />
                </div>
                <Skeleton className="h-4 w-32 mb-2 gradient-primary opacity-30 rounded-md" />
                <Skeleton className="h-4 w-24 gradient-primary opacity-30 rounded-md" />
              </div>
          )}
          </div> :
        recentAnalyses.length === 0 ?
        <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">{isArabic ? "لا توجد تحليلات بعد" : "No Analyses Yet"}</h3>
            <p className="text-slate-600 mb-6">{isArabic ? "ابدأ أول تحليل لترى النتائج هنا" : "Start your first business analysis to see insights here"}</p>
            <Link to={createPageUrl("NewAnalysis")}>
              <Button className="gradient-primary text-white">
                <Plus className="w-4 h-4 mr-2" />
                {isArabic ? "ابدأ أول تحليل" : "Start First Analysis"}
              </Button>
            </Link>
          </div> :

        <div className="space-y-4">
            {recentAnalyses.map((analysis, index) => {
            const StatusIcon = statusIcons[analysis.status];
            return (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group">

                  <div className="my-4 p-4 rounded-xl border-2 border-slate-200 hover:border-purple-400 hover:bg-purple-50/30 transition-all duration-300 hover:shadow-md">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {analysis.is_premium &&
                      <Sparkles className="w-4 h-4 text-orange-500 fill-orange-500 flex-shrink-0" />
                      }
                        <h3 className="font-semibold text-slate-800 group-hover:text-purple-700 transition-colors truncate">
                          {analysis.business_idea}
                        </h3>
                      </div>
                      <Badge className={`${statusColors[analysis.status]} shadow-sm flex-shrink-0 ml-2`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {isArabic ? statusLabels[analysis.status]?.ar : statusLabels[analysis.status]?.en}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-medium">
                          {isArabic ? "تم الإنشاء" : "Created"} {analysis.created_at ? format(new Date(analysis.created_at), "MMM d, yyyy") : ''}
                        </p>
                      </div>
                      
                      {analysis.status === 'completed' &&
                    <Link to={createPageUrl(`AnalysisResult?id=${analysis.id}`)}>
                          <Button size="sm" variant="outline" className="border-2 border-purple-300 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all duration-300 shadow-sm">
                            <Eye className="w-4 h-4 mr-1" />
                            {isArabic ? "عرض التقرير" : "View Report"}
                          </Button>
                        </Link>
                    }
                    </div>
                  </div>
                </motion.div>);

          })}
          </div>
        }
      </CardContent>
    </Card>);

}