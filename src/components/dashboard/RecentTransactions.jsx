import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, TrendingDown, Gift, RotateCcw, Wallet } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function RecentTransactions({ transactions, isArabic = false }) {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'purchase':
        return TrendingUp;
      case 'usage':
        return TrendingDown;
      case 'bonus':
        return Gift;
      case 'refund':
        return RotateCcw;
      default:
        return Clock;
    }
  };

  const getTypeLabel = (type) => {
    if (isArabic) {
      switch (type) {
        case 'purchase': return 'شراء';
        case 'usage': return 'استخدام';
        case 'bonus': return 'مكافأة';
        case 'refund': return 'استرداد';
        default: return type;
      }
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'purchase':
        return 'bg-orange-100 text-orange-800';
      case 'usage':
        return 'bg-red-100 text-red-800';
      case 'bonus':
        return 'bg-purple-100 text-purple-800';
      case 'refund':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <Card className="glass-effect border-2 border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-50 border-b-2 border-orange-100">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-orange-600 to-orange-600 rounded-lg shadow-lg">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-orange-700 to-orange-600 bg-clip-text text-transparent">
              {isArabic ? "المعاملات الأخيرة" : "Recent Transactions"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-block p-4 bg-orange-50 rounded-full mb-3">
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
            <p className="text-slate-500 font-medium">{isArabic ? "لا توجد معاملات حتى الآن" : "No transactions yet"}</p>
            <p className="text-sm text-slate-400 mt-1">
              {isArabic ? "ستظهر معاملاتك هنا" : "Your transactions will appear here"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-2 border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-50 border-b-2 border-orange-100">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-orange-600 to-orange-600 rounded-lg shadow-lg">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-orange-700 to-orange-600 bg-clip-text text-transparent">
            {isArabic ? "المعاملات الأخيرة" : "Recent Transactions"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {transactions.map((tx, index) => {
            const TypeIcon = getTypeIcon(tx.type);
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group"
              >
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-slate-200 hover:border-orange-400 hover:bg-orange-50/30 transition-all duration-300 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300 ${tx.type === 'purchase' || tx.type === 'bonus' ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-orange-600'}`}>
                      <TypeIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${getTypeColor(tx.type)} shadow-sm font-semibold`}>
                          {getTypeLabel(tx.type)}
                        </Badge>
                        {tx.amount_usd && (
                          <Badge variant="outline" className="text-xs font-semibold border-slate-300">
                            ${tx.amount_usd}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1 font-medium">
                        {tx.notes || (isArabic ? 'معاملة رصيد' : 'Credit transaction')}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        {tx.created_at ? format(new Date(tx.created_at), "MMM d, yyyy 'at' h:mm a") : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-black ${tx.credits > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                      {tx.credits > 0 ? '+' : ''}{tx.credits}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold uppercase">
                      {isArabic ? 'رصيد' : 'credits'}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        {transactions.length >= 5 && (
          <div className="mt-4 text-center">
            <Link to={createPageUrl("Credits")} className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              {isArabic ? "عرض جميع المعاملات" : "View all transactions"}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}