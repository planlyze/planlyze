import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { createPageUrl } from "@/utils";
import { BarChart3, Brain, FileText, Plus, Settings, User as UserIcon, LogOut, Shield, Globe, Pencil, Wallet, Bell } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import { User } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


const baseNavigationItems = [
  {
    id: "dashboard",
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: BarChart3
  },
  {
    id: "new_analysis",
    title: "New Analysis",
    url: createPageUrl("NewAnalysis"),
    icon: Plus
  },
  {
    id: "reports",
    title: "My Reports",
    url: createPageUrl("Reports"),
    icon: FileText
  },
  {
    id: "credits",
    title: "Credits",
    url: createPageUrl("Credits"),
    icon: Wallet
  },
  {
    id: "referrals",
    title: "Referrals",
    url: createPageUrl("Referrals"),
    icon: UserIcon
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    url: createPageUrl("Subscriptions"),
    icon: FileText
  },
  {
        id: "profile",
        title: "Profile",
        url: createPageUrl("Profile"),
        icon: Settings
      },
      {
        id: "notifications",
        title: "Notifications",
        url: createPageUrl("Notifications"),
        icon: Bell
      }
    ];


const adminNavigationItems = [
  {
    id: "owner_dashboard",
    title: "Owner Dashboard",
    url: createPageUrl("OwnerDashboard"),
    icon: Shield
  },
  {
    id: "admin_credits",
    title: "Credits Management",
    url: createPageUrl("AdminCredits"),
    icon: Wallet
  },
  {
    id: "admin_payments",
    title: "Payment Requests",
    url: createPageUrl("AdminPayments"),
    icon: Wallet
  },
  {
    id: "payment_analytics",
    title: "Payment Analytics",
    url: createPageUrl("PaymentAnalytics"),
    icon: BarChart3
  },
  {
    id: "email_templates",
    title: "Email Templates",
    url: createPageUrl("EmailTemplates"),
    icon: Bell
  },
  {
    id: "admin_notifications",
    title: "Send Notifications",
    url: createPageUrl("AdminNotifications"),
    icon: Bell
  },
  {
    id: "admin_discounts",
    title: "Discount Codes",
    url: createPageUrl("AdminDiscounts"),
    icon: Shield
  },
  {
    id: "role_management",
    title: "Roles & Permissions",
    url: createPageUrl("RoleManagement"),
    icon: Shield
  },
  {
    id: "user_roles",
    title: "Assign User Roles",
    url: createPageUrl("UserRoleAssignment"),
    icon: UserIcon
  },
  {
    id: "audit_logs",
    title: "Audit Logs",
    url: createPageUrl("AuditLogs"),
    icon: Shield
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const { user: authUser, isAuthenticated, logout: authLogout, updateMyUserData } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [navigationItems, setNavigationItems] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [profilePromptAcked, setProfilePromptAcked] = useState(false);
  const [isAckingProfilePrompt, setIsAckingProfilePrompt] = useState(false);

  const isArabic = currentUser?.language === 'ar';

  // Helper: build localized nav items
  const buildNavigationItems = (isAdmin, isArabicLang) => {
    const t = (id, en) => {
      if (!isArabicLang) return en;
      switch (id) {
        case "dashboard": return "لوحة التحكم";
        case "new_analysis": return "تحليل جديد";
        case "reports": return "تقاريري";
        case "credits": return "الأرصدة";
        case "referrals": return "الإحالات";
        case "subscriptions": return "الاشتراكات";
        case "profile": return "الملف الشخصي";
        case "notifications": return "الإشعارات";
        case "owner_dashboard": return "لوحة المالك";
        case "admin_credits": return "إدارة الأرصدة";
        case "admin_payments": return "طلبات الدفع";
        case "payment_analytics": return "تحليلات الدفع";
        case "email_templates": return "قوالب البريد";
        case "admin_notifications": return "إرسال إشعارات";
        case "admin_discounts": return "أكواد الخصم";
        case "role_management": return "الأدوار والصلاحيات";
        case "user_roles": return "تعيين أدوار المستخدمين";
        case "audit_logs": return "سجلات التدقيق";
        default: return en;
      }
    };
    const base = baseNavigationItems.map(item => ({ ...item, title: t(item.id, item.title) }));
    const admin = adminNavigationItems.map(item => ({ ...item, title: t(item.id, item.title) }));
    return isAdmin ? [...base, ...admin] : base;
  };

  const toggleLanguage = async () => {
    const next = isArabic ? 'en' : 'ar';
    try {
      await updateMyUserData({ language: next });
      setCurrentUser((prev) => prev ? { ...prev, language: next } : prev);
      i18n.changeLanguage(next);
      document.documentElement.lang = next;
      document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
      localStorage.setItem('language', next);
      localStorage.setItem('planlyze-language', next);
      const isAdmin = currentUser?.role === 'admin';
      setNavigationItems(buildNavigationItems(isAdmin, next === 'ar'));
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser);
      setIsLoggedIn(true);
      const lang = authUser.language || 'en';
      i18n.changeLanguage(lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      localStorage.setItem('language', lang);
      localStorage.setItem('planlyze-language', lang);
      const isAdmin = authUser.role === 'admin';
      setNavigationItems(buildNavigationItems(isAdmin, lang === 'ar'));
      setNewDisplayName(authUser?.full_name || '');
    } else if (isAuthenticated === false) {
      setCurrentUser(null);
      setIsLoggedIn(false);
      setNavigationItems(buildNavigationItems(false, false));
    }
  }, [authUser, isAuthenticated, i18n]);

  // Listen for i18n language changes (works within same window and across tabs)
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      if (lng && (lng === 'en' || lng === 'ar')) {
        document.documentElement.lang = lng;
        document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
        localStorage.setItem('language', lng);
        localStorage.setItem('planlyze-language', lng);
        if (currentUser) {
          const isAdmin = currentUser.role === 'admin';
          setNavigationItems(buildNavigationItems(isAdmin, lng === 'ar'));
        }
      }
    };
    
    i18n.on('languageChanged', handleLanguageChanged);
    return () => i18n.off('languageChanged', handleLanguageChanged);
  }, [i18n, currentUser]);

  // Listen for language changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'planlyze-language' || e.key === 'language') {
        const newLang = e.newValue;
        if (newLang && (newLang === 'en' || newLang === 'ar')) {
          i18n.changeLanguage(newLang);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [i18n]);

  const handleSaveDisplayName = async () => {
    setIsSavingDisplayName(true);
    try {
      await updateMyUserData({ full_name: newDisplayName });
      setCurrentUser((prev) => prev ? { ...prev, full_name: newDisplayName } : prev);
      toast.success('Display name updated successfully!');
      setIsEditingDisplayName(false);
    } catch (error) {
      console.error('Failed to update display name:', error);
      toast.error('Failed to update display name. Please try again.');
    } finally {
      setIsSavingDisplayName(false);
    }
  };

  const acknowledgeProfilePrompt = async (redirect = false) => {
    if (profilePromptAcked) return;
    setIsAckingProfilePrompt(true);
    try {
      setProfilePromptAcked(true);
      setShowProfilePrompt(false);
      if (redirect) {
        const url = createPageUrl("Profile");
        if (location.pathname !== url) {
          navigate(url);
        }
      }
    } catch (error) {
      console.error("Failed to acknowledge profile prompt:", error);
    } finally {
      setIsAckingProfilePrompt(false);
    }
  };

  const handleLogout = async () => {
    await authLogout(false);
    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsLogoutConfirmOpen(false);
    navigate('/');
  };

  // Initial loading state before we know if user is logged in
  if (isLoggedIn === null) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-slate-50">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>);

  }

  return (
    <SidebarProvider>
      <Toaster position="top-center" richColors />
      <style>{`
        :root {
          /* Brand palette based on provided logos (purple + orange) */
          --primary: 88 28 135;           /* purple-700 */
          --primary-foreground: 248 250 252;
          --secondary: 234 88 12;         /* orange-600 */
          --secondary-foreground: 255 255 255;
          --accent: 168 85 247;           /* purple-500 */
          --accent-foreground: 30 41 59;
          --muted: 250 245 255;           /* purple-50 */
          --muted-foreground: 71 85 105;
        }

        .glass-effect {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        /* RTL Support */
        [dir="rtl"] { direction: rtl; }
        [dir="rtl"] .text-left { text-align: right; }
        [dir="rtl"] .text-right { text-align: left; }

        @media print {
          /* Use full page and allow multi-page content */
          @page { margin: 12mm; }
          html, body, #root, main { height: auto !important; overflow: visible !important; }

          /* Unclip any scroll containers */
          .print-container, .print-container * { overflow: visible !important; max-height: none !important; }

          /* Reset screen-only sizing that can truncate print */
          .min-h-screen, .h-screen, .max-h-screen { min-height: auto !important; height: auto !important; max-height: none !important; }

          /* Hide UI chrome */
          .no-print { display: none !important; }

          /* Allow long sections/cards to break across pages to avoid missing tails */
          section, .glass-effect { 
            break-inside: auto !important; 
            page-break-inside: auto !important; 
          }

          /* Avoid position tricks during print */
          .fixed, .sticky { position: static !important; top: auto !important; }
        }
      `}</style>

      <div className={`min-h-screen flex w-full bg-slate-50`} dir={isArabic ? 'rtl' : 'ltr'}>
        {isLoggedIn &&
        <Sidebar
          className={`${isArabic ? 'order-2 border-l' : 'order-1 border-r'} border-slate-200/50 glass-effect no-print`}
        >
            <SidebarHeader className="border-b border-slate-200/50 p-6">
              <a
                href="https://planlyze.ai/PlanlyzeAI/"
                className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center">
                  <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6919d88779509b26dfa9f6be/001aecb88_Main_logo-04.png"
                  alt="Planlyze logo"
                  className="w-9 h-9 object-contain" />

                </div>
                <div>
                  <h2 className="font-bold text-xl text-slate-800">Planlyze</h2>
                  <p className="text-xs text-slate-500 font-medium">From idea to action Plan</p>
                </div>
              </a>
            </SidebarHeader>

            <SidebarContent className="p-4 overflow-y-auto">
              {/* Enhanced Credit Summary Card - Moved to top */}
              <div className="mb-4 bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 rounded-2xl p-4 shadow-lg border border-purple-400/30 relative">
                {/* Decorative background pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.15),transparent)] pointer-events-none rounded-2xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md flex-shrink-0">
                        <Wallet className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-purple-100 font-medium uppercase tracking-wide mb-0.5">{isArabic ? "الأرصدة المتاحة" : "Available Credits"}</p>
                        <p className="text-2xl font-bold text-white drop-shadow-sm">
                          {currentUser?.premium_credits || 0}
                        </p>
                      </div>
                    </div>
                    <Link to={createPageUrl("Credits")} className="flex-shrink-0 mt-1" data-tour="new-analysis">
                      <Button 
                        size="sm" 
                        className="h-8 px-4 text-sm bg-white/95 hover:bg-white text-purple-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                      >
                        {isArabic ? "شراء" : "Buy"}
                      </Button>
                    </Link>
                  </div>
                  
                  {/* Usage Progress */}
                  {(() => {
                    const purchased = currentUser?.total_credits_purchased || 0;
                    const used = currentUser?.total_credits_used || 0;
                    const usagePercent = purchased > 0 ? Math.round((used / purchased) * 100) : 0;
                    return purchased > 0 ? (
                      <div className="pt-3 border-t border-white/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-purple-100 font-medium uppercase tracking-wide">
                            {isArabic ? "الاستخدام" : "Usage"}
                          </span>
                          <span className="text-sm font-bold text-white tabular-nums">
                            {used}/{purchased}
                          </span>
                        </div>
                        <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-2 overflow-hidden shadow-inner">
                          <div 
                            className="h-full bg-white/90 transition-all duration-500 shadow-sm rounded-full"
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {navigationItems.map((item) =>
                  <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                              asChild
                              className={`transition-all duration-300 rounded-xl px-4 py-3 ${
                              location.pathname === item.url ?
                              'bg-purple-600 text-white shadow-lg hover:bg-orange-600 hover:text-white' :
                              'hover:bg-purple-100 text-slate-700 hover:text-purple-700'}`
                              }>

                          <Link to={item.url} className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <item.icon className={`w-5 h-5 ${item.id === 'owner_dashboard' ? (location.pathname === item.url ? 'text-white' : 'text-purple-600') : ''}`} />
                            <span className="font-semibold">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                  )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200/50 p-4">
                {/* User Profile */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-slate-800 text-sm truncate">
                      {currentUser?.display_name || currentUser?.full_name}
                    </p>
                    <Button variant="ghost" size="icon" className="w-6 h-6 text-slate-500 hover:text-slate-800" onClick={() => setIsEditingDisplayName(true)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-600 truncate">{currentUser?.email}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleLanguage} className="text-slate-500 hover:text-slate-800" title={isArabic ? "Switch to English" : "التبديل إلى العربية"}>
                  <Globe className="w-5 h-5" />
                </Button>
                <NotificationBell userEmail={currentUser?.email} isArabic={isArabic} />
                <Button variant="ghost" size="icon" onClick={() => setIsLogoutConfirmOpen(true)} className="text-slate-500 hover:text-slate-800">
                  <LogOut className="w-5 h-5" />
                </Button>
                </div>
                </SidebarFooter>
          </Sidebar>
        }

        <main className={`flex-1 flex flex-col ${isLoggedIn ? (isArabic ? 'order-1' : 'order-2') : ''}`}>
          {isLoggedIn &&
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 py-4 md:hidden shadow-sm no-print">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
                  <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6919d88779509b26dfa9f6be/a0909d13b_Main_logo-01.png"
                  alt="Planlyze"
                  className="h-6 object-contain" />

                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsLogoutConfirmOpen(true)} className="text-slate-500 hover:text-slate-800">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </header>
          }

          <div className="flex-1 overflow-auto print-container">
            {children}
          </div>
        </main>
      </div>

      {/* Display Name Edit Dialog */}
      <Dialog open={isEditingDisplayName} onOpenChange={setIsEditingDisplayName}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Display Name</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="displayName" className="text-right">
                Name
              </Label>
              <Input
                id="displayName"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSaveDisplayName} disabled={isSavingDisplayName}>
              {isSavingDisplayName ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* One-time Complete Profile Prompt */}
      <Dialog
        open={showProfilePrompt}
        onOpenChange={(open) => {
          setShowProfilePrompt(open);
          if (!open && !profilePromptAcked) {
            // If user dismisses by clicking outside/ESC, still mark as shown once
            acknowledgeProfilePrompt(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {isArabic ? "أكمل ملفك الشخصي" : "Complete Your Profile"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-slate-600">
              {isArabic
                ? "أضف معلومات الاتصال والموقع لتحصل على تقارير أدق وتجربة أفضل."
                : "Add your contact and location details for more accurate reports and a better experience."}
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-600">
              <li>{isArabic ? "رقم الهاتف" : "Phone number"}</li>
              <li>{isArabic ? "الدولة" : "Country"}</li>
              <li>{isArabic ? "المدينة" : "City"}</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => acknowledgeProfilePrompt(false)}
              disabled={isAckingProfilePrompt}
            >
              {isArabic ? "لاحقًا" : "Later"}
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => acknowledgeProfilePrompt(true)}
              disabled={isAckingProfilePrompt}
            >
              {isArabic ? "أكمل الآن" : "Complete now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{isArabic ? "تأكيد تسجيل الخروج" : "Confirm Logout"}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-slate-600">
              {isArabic
                ? "هل أنت متأكد أنك تريد تسجيل الخروج؟"
                : "Are you sure you want to log out?"}
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleLogout}>
              {isArabic ? "تسجيل الخروج" : "Log out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </SidebarProvider>);

}