// @ts-nocheck
import React, { useState, useEffect } from "react";
import { auth, api, Notification } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, CheckCheck, FileText, Wallet, AlertCircle, Info, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

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
  analysis_complete: "text-emerald-600 bg-emerald-50",
  analysis_failed: "text-red-600 bg-red-50",
  credits_low: "text-orange-600 bg-orange-50",
  credits_purchased: "text-purple-600 bg-purple-50",
  payment_approved: "text-green-600 bg-green-50",
  payment_rejected: "text-red-600 bg-red-50",
  system: "text-blue-600 bg-blue-50",
  welcome: "text-purple-600 bg-purple-50"
};

export default function NotificationBell({ userEmail, isArabic = false }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userEmail) {
      loadNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userEmail]);

  const loadNotifications = async () => {
    try {
      const data = await Notification.filter({ user_email: userEmail });
      const sorted = Array.isArray(data) ? data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20) : [];
      setNotifications(sorted);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
    setIsLoading(true);
    try {
      await Notification.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="icon" className="relative" onClick={() => setIsOpen(true)}>
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-3 border-b dark:border-gray-700">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-600" />
                {isArabic ? "الإشعارات" : "Notifications"}
                {unreadCount > 0 && (
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    {unreadCount} {isArabic ? "جديد" : "new"}
                  </Badge>
                )}
              </DialogTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  disabled={isLoading}
                  className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  {isArabic ? "قراءة الكل" : "Mark all read"}
                </Button>
              )}
            </div>
          </DialogHeader>
          
          <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-slate-400" />
                </div>
                <p className="font-medium">{isArabic ? "لا توجد إشعارات" : "No notifications yet"}</p>
                <p className="text-sm mt-1">{isArabic ? "ستظهر إشعاراتك هنا" : "Your notifications will appear here"}</p>
              </div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type] || Info;
                  const colorClass = notificationColors[notification.type] || "text-slate-600 bg-slate-50";
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${!notification.is_read ? 'bg-purple-50/50 dark:bg-purple-900/20' : ''}`}
                      onClick={() => markAsRead(notification)}
                    >
                      {notification.link ? (
                        <Link to={notification.link} onClick={() => setIsOpen(false)}>
                          <NotificationContent 
                            notification={notification}
                            Icon={Icon}
                            colorClass={colorClass}
                            isArabic={isArabic}
                          />
                        </Link>
                      ) : (
                        <NotificationContent 
                          notification={notification}
                          Icon={Icon}
                          colorClass={colorClass}
                          isArabic={isArabic}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          
          <div className="p-3 border-t dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
            <Link to={createPageUrl("Notifications")} onClick={() => setIsOpen(false)}>
              <Button variant="ghost" className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/30">
                {isArabic ? "عرض جميع الإشعارات" : "View all notifications"}
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function NotificationContent({ notification, Icon, colorClass, isArabic }) {
  return (
    <div className="flex gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`font-medium text-sm ${!notification.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {notification.created_at ? format(new Date(notification.created_at), "MMM d, h:mm a") : ''}
        </p>
      </div>
    </div>
  );
}