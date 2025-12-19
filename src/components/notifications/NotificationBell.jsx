// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Notification } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, CheckCheck, FileText, Wallet, AlertCircle, Info, Sparkles } from "lucide-react";
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
  analysis_complete: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
  analysis_failed: "text-red-600 bg-red-50 dark:bg-red-900/30",
  credits_low: "text-orange-600 bg-orange-50 dark:bg-orange-900/30",
  credits_purchased: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",
  payment_approved: "text-green-600 bg-green-50 dark:bg-green-900/30",
  payment_rejected: "text-red-600 bg-red-50 dark:bg-red-900/30",
  system: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
  welcome: "text-purple-600 bg-purple-50 dark:bg-purple-900/30"
};

export default function NotificationBell({ userEmail, isArabic = false }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userEmail) {
      loadNotifications();
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[380px] p-0 shadow-xl border-0 dark:bg-gray-800" 
        align="end" 
        sideOffset={8}
      >
        <div className="p-3 border-b dark:border-gray-700 bg-gradient-to-r from-purple-50 to-orange-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-semibold text-slate-800 dark:text-white">
                {isArabic ? "الإشعارات" : "Notifications"}
              </span>
              {unreadCount > 0 && (
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                disabled={isLoading}
                className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/30 h-7 px-2"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                {isArabic ? "قراءة الكل" : "Read all"}
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[320px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-7 h-7 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="font-medium text-sm">{isArabic ? "لا توجد إشعارات" : "No notifications"}</p>
              <p className="text-xs mt-1">{isArabic ? "ستظهر إشعاراتك هنا" : "Your notifications will appear here"}</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-700">
              {notifications.slice(0, 8).map((notification) => {
                const Icon = notificationIcons[notification.type] || Info;
                const colorClass = notificationColors[notification.type] || "text-slate-600 bg-slate-50 dark:bg-slate-800";
                
                return (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${!notification.is_read ? 'bg-purple-50/50 dark:bg-purple-900/20' : ''}`}
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
        
        <div className="p-2 border-t dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50">
          <Link to={createPageUrl("Notifications")} onClick={() => setIsOpen(false)}>
            <Button variant="ghost" className="w-full h-9 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/30">
              {isArabic ? "عرض جميع الإشعارات" : "View all notifications"}
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationContent({ notification, Icon, colorClass, isArabic }) {
  return (
    <div className="flex gap-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`font-medium text-sm leading-tight ${!notification.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1" />
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
