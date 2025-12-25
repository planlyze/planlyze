import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function RecentTransactionsTable({ transactions }) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const getTypeLabel = (type) => {
    if (isArabic) {
      switch (type) {
        case 'purchase': return 'شراء';
        case 'usage': return 'استخدام';
        case 'bonus': return 'مكافأة';
        case 'refund': return 'استرداد';
        case 'adjustment': return 'تعديل';
        default: return type;
      }
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getTypeDescription = (type) => {
    if (isArabic) {
      switch (type) {
        case 'purchase': return 'شراء رصيد';
        case 'usage': return 'استخدام رصيد';
        case 'bonus': return 'رصيد مجاني';
        case 'refund': return 'استرداد';
        case 'adjustment': return 'تعديل الرصيد';
        default: return type;
      }
    }
    switch (type) {
      case 'purchase': return 'Credit Purchase';
      case 'usage': return 'Credit Used';
      case 'bonus': return 'Bonus Credit';
      case 'refund': return 'Refund';
      case 'adjustment': return 'Credit Adjustment';
      default: return type;
    }
  };
  if (!transactions || transactions.length === 0) {
    return (
      <Card className="glass-effect border-2 border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-indigo-600" />
            {isArabic ? "المعاملات الأخيرة" : "Recent Transactions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">{isArabic ? "لا توجد معاملات حتى الآن" : "No transactions yet"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-2 border-slate-200 shadow-xl" dir={isArabic ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-indigo-600" />
          {isArabic ? "المعاملات الأخيرة" : "Recent Transactions"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.slice(0, 10).map((tx) => (
            <div 
              key={tx.id}
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-200 hover:border-purple-300 transition-all"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  tx.credits > 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {tx.credits > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-800">
                      {getTypeDescription(tx.type)}
                    </p>
                    <Badge className={`px-2 py-0.5 text-xs ${
                      tx.type === 'purchase' ? 'bg-green-500' :
                      tx.type === 'usage' ? 'bg-blue-500' :
                      tx.type === 'bonus' ? 'bg-purple-500' :
                      'bg-red-500'
                    } text-white`}>
                      {getTypeLabel(tx.type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="truncate">{tx.user_email}</span>
                    <span className="text-slate-400">•</span>
                    <span>{tx.created_at ? format(new Date(tx.created_at), "MMM d, h:mm a") : ''}</span>
                  </div>
                </div>
              </div>
              <div className={`${isArabic ? 'text-left mr-4' : 'text-right ml-4'}`}>
                <p className={`text-xl font-bold ${tx.credits > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.credits > 0 ? '+' : ''}{tx.credits}
                </p>
                {tx.amount_usd && (
                  <p className="text-sm text-slate-500 font-semibold">${tx.amount_usd}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}