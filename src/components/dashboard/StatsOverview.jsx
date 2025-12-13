import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, ShoppingCart, TrendingDown } from "lucide-react";

export default function StatsOverview({ creditsLeft, totalReports, totalUsed, isLoading, isArabic = false }) {
  const stats = [
    {
      title: isArabic ? "الأرصدة المتبقية" : "Credits Left",
      value: creditsLeft,
      icon: Wallet,
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    },
    {
      title: isArabic ? "إجمالي التقارير المنشأة" : "Total Reports Generated",
      value: totalReports,
      icon: ShoppingCart,
      gradient: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700"
    },
    {
      title: isArabic ? "التقارير المتبقية" : "Reports Left",
      value: creditsLeft,
      icon: TrendingDown,
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="glass-effect border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-600">{stat.title}</CardTitle>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-2 gradient-primary opacity-30 rounded-md" />
                ) : (
                  <div className="text-3xl font-bold mt-2 text-slate-800">
                    {stat.value}
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`h-1 rounded-full bg-gradient-to-r ${stat.gradient} opacity-80`} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}