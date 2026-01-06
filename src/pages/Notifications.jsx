import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { auth, Notification } from "@/api/client";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  Trash2,
  FileText,
  Wallet,
  AlertCircle,
  Info,
  Sparkles,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";
import PageLoader from "@/components/common/PageLoader";
import PageHeader from "@/components/common/PageHeader";
import EmptyList from "@/components/common/EmptyList";

const notificationIcons = {
  analysis_complete: FileText,
  analysis_failed: AlertCircle,
  credits_low: Wallet,
  credits_purchased: Sparkles,
  payment_approved: Check,
  payment_rejected: AlertCircle,
  system: Info,
  welcome: Sparkles,
};

const notificationColors = {
  analysis_complete: "text-emerald-600 bg-emerald-50 border-emerald-200",
  analysis_failed: "text-red-600 bg-red-50 border-red-200",
  credits_low: "text-orange-600 bg-orange-50 border-orange-200",
  credits_purchased: "text-purple-600 bg-purple-50 border-purple-200",
  payment_approved: "text-green-600 bg-green-50 border-green-200",
  payment_rejected: "text-red-600 bg-red-50 border-red-200",
  system: "text-blue-600 bg-blue-50 border-blue-200",
  welcome: "text-purple-600 bg-purple-50 border-purple-200",
};

export default function NotificationsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const isArabic =
    i18n.language === "ar" || currentUser?.preferred_language === "arabic";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();
      setCurrentUser(user);

      const data = await Notification.filter({ user_email: user.email });
      const sorted = Array.isArray(data)
        ? data
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 100)
        : [];
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
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      toast.success(t("notifications.markedAsRead"));
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error(t("notifications.markReadFailed"));
    }
  };

  const markAllAsRead = async () => {
    try {
      await Notification.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success(t("notifications.allMarkedAsRead"));
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error(t("notifications.markAllReadFailed"));
    }
  };

  const deleteNotification = async (id) => {
    try {
      await Notification.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success(t("notifications.deleted"));
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error(t("notifications.deleteFailed"));
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  if (isLoading) {
    return <PageLoader isArabic={isArabic} />;
  }

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <PageHeader
            title={t("notifications.title")}
            description={t("notifications.subtitle")}
            // backUrl={createPageUrl("Dashboard")}
            icon={Bell}
            isArabic={isArabic}
          />

          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="border-2 border-purple-300 hover:bg-purple-50"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6 [&>button]:text-slate-600 [&>button[data-state=inactive]]:text-slate-500">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              {t("notifications.all")}
              <Badge variant="secondary" className="ml-1">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              {t("notifications.unread")}
              {unreadCount > 0 && (
                <Badge className="ml-1 bg-red-500">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {t("notifications.settings")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <NotificationsList
              notifications={filteredNotifications}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              t={t}
              isArabic={isArabic}
            />
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            <NotificationsList
              notifications={filteredNotifications}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              t={t}
              isArabic={isArabic}
            />
          </TabsContent>

          <TabsContent value="settings">
            <NotificationPreferences
              user={currentUser}
              isArabic={isArabic}
              onUpdate={(prefs) =>
                setCurrentUser((prev) => ({
                  ...prev,
                  notification_preferences: prefs,
                }))
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function NotificationsList({ notifications, onMarkAsRead, onDelete, t, isArabic }) {
  if (notifications.length === 0) {
    return (
      <EmptyList
        title={t("notifications.noNotifications")}
        description={t("notifications.notificationsAppearHere")}
        icon={Bell}
        isArabic={isArabic}        
      />
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const Icon = notificationIcons[notification.type] || Info;
        const colorClass =
          notificationColors[notification.type] ||
          "text-slate-600 bg-slate-50 border-slate-200";

        return (
          <Card
            key={notification.id}
            className={`border-2 transition-all hover:shadow-md cursor-pointer ${
              !notification.is_read
                ? "border-purple-300 bg-purple-50/30"
                : "border-slate-200"
            }`}
            onClick={() => onMarkAsRead(notification)}
          >
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border ${colorClass}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4
                          className={`font-semibold ${
                            !notification.is_read
                              ? "text-slate-900"
                              : "text-slate-700"
                          }`}
                        >
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {notification.created_at &&
                          format(
                            new Date(notification.created_at),
                            "MMMM d, yyyy 'at' h:mm a"
                          )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {notification.link && (
                        <Link
                          to={notification.link}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-purple-300 hover:bg-purple-50"
                          >
                            {t("notifications.view")}
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
