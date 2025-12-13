import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Activity, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  CreditCard, 
  User, 
  Clock,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const activityIcons = {
  analysis_created: FileText,
  analysis_completed: CheckCircle2,
  analysis_failed: XCircle,
  payment_submitted: CreditCard,
  payment_approved: CheckCircle2,
  payment_rejected: XCircle,
  credits_purchased: Sparkles,
  profile_updated: User,
  user_registered: User
};

const activityColors = {
  analysis_created: "bg-blue-100 text-blue-600 border-blue-200",
  analysis_completed: "bg-emerald-100 text-emerald-600 border-emerald-200",
  analysis_failed: "bg-red-100 text-red-600 border-red-200",
  payment_submitted: "bg-amber-100 text-amber-600 border-amber-200",
  payment_approved: "bg-green-100 text-green-600 border-green-200",
  payment_rejected: "bg-red-100 text-red-600 border-red-200",
  credits_purchased: "bg-purple-100 text-purple-600 border-purple-200",
  profile_updated: "bg-slate-100 text-slate-600 border-slate-200",
  user_registered: "bg-indigo-100 text-indigo-600 border-indigo-200"
};

const activityLabels = {
  analysis_created: { en: "Analysis Started", ar: "بدء التحليل" },
  analysis_completed: { en: "Analysis Complete", ar: "اكتمل التحليل" },
  analysis_failed: { en: "Analysis Failed", ar: "فشل التحليل" },
  payment_submitted: { en: "Payment Pending", ar: "دفع قيد الانتظار" },
  payment_approved: { en: "Payment Approved", ar: "تمت الموافقة على الدفع" },
  payment_rejected: { en: "Payment Rejected", ar: "تم رفض الدفع" },
  credits_purchased: { en: "Credits Added", ar: "تمت إضافة الأرصدة" },
  profile_updated: { en: "Profile Updated", ar: "تحديث الملف الشخصي" },
  user_registered: { en: "New User", ar: "مستخدم جديد" }
};

export default function ActivityFeed({ userEmail, isArabic = false, limit = 10, showPublic = false }) {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    
    // Poll for new activities every 30 seconds
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const loadActivities = async () => {
    try {
      let data;
      if (showPublic) {
        // For admin or public view, get all activities
        data = await base44.entities.ActivityFeed.list("-created_date", limit);
      } else {
        // For user view, get only their activities
        data = await base44.entities.ActivityFeed.filter(
          { user_email: userEmail },
          "-created_date",
          limit
        );
      }
      setActivities(data);
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-effect border-2 border-indigo-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">
              {isArabic ? "النشاط الأخير" : "Recent Activity"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="glass-effect border-2 border-indigo-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">
              {isArabic ? "النشاط الأخير" : "Recent Activity"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-block p-4 bg-indigo-50 rounded-full mb-3">
              <Clock className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-slate-500 font-medium">
              {isArabic ? "لا يوجد نشاط بعد" : "No activity yet"}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {isArabic ? "ستظهر أنشطتك هنا" : "Your activities will appear here"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-2 border-indigo-200 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">
            {isArabic ? "النشاط الأخير" : "Recent Activity"}
          </span>
          {activities.length > 0 && (
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 ml-auto">
              {activities.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          <AnimatePresence>
            {activities.map((activity, index) => {
              const Icon = activityIcons[activity.action_type] || AlertCircle;
              const colorClass = activityColors[activity.action_type] || "bg-slate-100 text-slate-600 border-slate-200";
              const label = activityLabels[activity.action_type] || { en: activity.action_type, ar: activity.action_type };
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="group"
                >
                  <div className="flex items-start gap-3 p-3 rounded-xl border-2 border-transparent hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200">
                    <div className={`p-2.5 rounded-xl ${colorClass} border shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">
                          {activity.title}
                        </span>
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          {isArabic ? label.ar : label.en}
                        </Badge>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1.5 font-medium">
                        {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}