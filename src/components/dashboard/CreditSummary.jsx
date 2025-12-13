import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ShoppingCart, TrendingDown, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function CreditSummary({ user, isArabic = false }) {
  const available = user?.premium_credits || 0;
  const purchased = user?.total_credits_purchased || 0;
  const used = user?.total_credits_used || 0;

  const stats = [
    {
      title: isArabic ? "الأرصدة المتاحة" : "Available Credits",
      value: available,
      icon: Wallet,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: isArabic ? "إجمالي المشتريات" : "Total Purchased",
      value: purchased,
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: isArabic ? "إجمالي المستخدم" : "Total Used",
      value: used,
      icon: TrendingDown,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <Card className="glass-effect border-2 border-purple-200 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Wallet className="w-5 h-5 text-purple-600" />
          {isArabic ? "محفظة الأرصدة" : "Credit Wallet"}
        </CardTitle>
        <Link to={createPageUrl("Credits")}>
          <Button size="sm" className="gradient-primary text-white">
            {isArabic ? "اشترِ المزيد" : "Buy More"}
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="flex items-center gap-3 p-4 rounded-lg bg-white border border-slate-200"
            >
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-600">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}