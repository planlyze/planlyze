import React, { useState, useEffect } from "react";
import { auth, Notification } from "@/api/client";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Bell, Check, CheckCheck, Trash2, FileText, 
  Wallet, AlertCircle, Info, Sparkles, Settings 
} from "lucide-react";
import { format } from "date-fns";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";

const notificationIcons = {
  analysis_complete: FileText,
  analysis_failed: AlertCircle,
  credits_low: Wallet,
  credits_purchased: Sparkles,
  payment_approved: Check,
  payment_rejected: AlertCircle,
  system: Info,
  welcome: Sparkles
};

const notificationColors = {
  analysis_complete: "text-emerald-600 bg-emerald-50 border-emerald-200",
  analysis_failed: "text-red-600 bg-red-50 border-red-200",
  credits_low: "text-orange-600 bg-orange-50 border-orange-200",
  credits_purchased: "text-purple-600 bg-purple-50 border-purple-200",
  payment_approved: "text-green-600 bg-green-50 border-green-200",
  payment_rejected: "text-red-600 bg-red-50 border-red-200",
  system: "text-blue-600 bg-blue-50 border-blue-200",
  welcome: "text-purple-600 bg-purple-50 border-purple-200"
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();
      setCurrentUser(user);
      
      const data = await Notification.filter({ user_email: user.email });
      const sorted = Array.isArray(data) ? data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 100) : [];
      setNotifications(sorted);
    } catch (error) {
      console.error("Error loading notifications:", error);
      window.location.href = "/login";
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notification) => {
    if (notification.is_read) return;
    try {
      await Notification.markRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Notification.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await Notification.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const isArabic = currentUser?.preferred_language === 'arabic';
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  const filteredNotifications = activeTab === "unread" 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-purple-50/30 to-orange-50/20">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-purple-50/30 to-orange-50/20" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="shadow-sm border-2 border-purple-300 hover:bg-purple-50"
          >
            <ArrowLeft className="w-4 h-4 text-purple-600" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600">
              {isArabic ? "الإشعارات" : "Notifications"}
            </h1>
            <p className="text-slate-600">
              {isArabic ? "إدارة إشعاراتك وتفضيلاتك" : "Manage your notifications and preferences"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={markAllAsRead}
              className="border-2 border-purple-300 hover:bg-purple-50"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              {isArabic ? "قراءة الكل" : "Mark all read"}
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6 [&>button]:text-slate-600 [&>button[data-state=inactive]]:text-slate-500">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              {isArabic ? "الكل" : "All"}
              <Badge variant="secondary" className="ml-1">{notifications.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              {isArabic ? "غير مقروء" : "Unread"}
              {unreadCount > 0 && (
                <Badge className="ml-1 bg-red-500">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {isArabic ? "الإعدادات" : "Settings"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <NotificationsList 
              notifications={filteredNotifications}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              isArabic={isArabic}
            />
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            <NotificationsList 
              notifications={filteredNotifications}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              isArabic={isArabic}
            />
          </TabsContent>

          <TabsContent value="settings">
            <NotificationPreferences 
              user={currentUser} 
              isArabic={isArabic}
              onUpdate={(prefs) => setCurrentUser(prev => ({ ...prev, notification_preferences: prefs }))}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function NotificationsList({ notifications, onMarkAsRead, onDelete, isArabic }) {
  if (notifications.length === 0) {
    return (
      <Card className="border-2 border-slate-200">
        <CardContent className="py-16 text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {isArabic ? "لا توجد إشعارات" : "No notifications"}
          </h3>
          <p className="text-slate-500">
            {isArabic ? "ستظهر إشعاراتك هنا" : "Your notifications will appear here"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const Icon = notificationIcons[notification.type] || Info;
        const colorClass = notificationColors[notification.type] || "text-slate-600 bg-slate-50 border-slate-200";
        
        return (
          <Card 
            key={notification.id} 
            className={`border-2 transition-all hover:shadow-md cursor-pointer ${!notification.is_read ? 'border-purple-300 bg-purple-50/30' : 'border-slate-200'}`}
            onClick={() => onMarkAsRead(notification)}
          >
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border ${colorClass}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`font-semibold ${!notification.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {notification.created_at && format(new Date(notification.created_at), "MMMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {notification.link && (
                        <Link to={notification.link} onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline" className="border-purple-300 hover:bg-purple-50">
                            {isArabic ? "عرض" : "View"}
                          </Button>
                        </Link>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(notification.id);
                        }}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}