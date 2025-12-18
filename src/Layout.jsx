import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { createPageUrl } from "@/utils";
import { BarChart3, Brain, FileText, Plus, Settings, User as UserIcon, LogOut, Shield, Globe, Pencil, Wallet, Bell, ChevronRight, Sparkles } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import { User } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import planLyzeLogo from "@assets/Main_logo-04_1766053107732.png";

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
  SidebarTrigger,
  useSidebar
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
      const userIsAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
      setNavigationItems(buildNavigationItems(userIsAdmin, next === 'ar'));
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
      const userIsAdmin = authUser.role === 'admin' || authUser.role === 'super_admin';
      setNavigationItems(buildNavigationItems(userIsAdmin, lang === 'ar'));
      setNewDisplayName(authUser?.full_name || '');
    } else if (isAuthenticated === false) {
      setCurrentUser(null);
      setIsLoggedIn(false);
      setNavigationItems(buildNavigationItems(false, false));
    }
  }, [authUser, isAuthenticated, i18n]);

  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      if (lng && (lng === 'en' || lng === 'ar')) {
        document.documentElement.lang = lng;
        document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
        localStorage.setItem('language', lng);
        localStorage.setItem('planlyze-language', lng);
        if (currentUser) {
          const userIsAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';
          setNavigationItems(buildNavigationItems(userIsAdmin, lng === 'ar'));
        }
      }
    };
    
    i18n.on('languageChanged', handleLanguageChanged);
    return () => i18n.off('languageChanged', handleLanguageChanged);
  }, [i18n, currentUser]);

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

  if (isLoggedIn === null) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>);
  }

  return (
    <SidebarProvider>
      <Toaster position="top-center" richColors />
      <style>{`
        [dir="rtl"] { direction: rtl; }
        [dir="rtl"] .text-left { text-align: right; }
        [dir="rtl"] .text-right { text-align: left; }

        @media print {
          @page { margin: 12mm; }
          html, body, #root, main { height: auto !important; overflow: visible !important; }
          .print-container, .print-container * { overflow: visible !important; max-height: none !important; }
          .min-h-screen, .h-screen, .max-h-screen { min-height: auto !important; height: auto !important; max-height: none !important; }
          .no-print { display: none !important; }
          section { break-inside: auto !important; page-break-inside: auto !important; }
          .fixed, .sticky { position: static !important; top: auto !important; }
        }
      `}</style>

      <div className={`min-h-screen flex w-full bg-gray-50`} dir={isArabic ? 'rtl' : 'ltr'}>
        {isLoggedIn &&
        <Sidebar
          className={`${isArabic ? 'order-2 border-l' : 'order-1 border-r'} border-gray-200 bg-white no-print`}
        >
            <SidebarHeader className="border-b border-gray-100 p-5">
              <Link
                to="/"
                className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                <img
                  src={planLyzeLogo}
                  alt="Planlyze logo"
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <h2 className="font-bold text-xl text-gray-900">Planlyze</h2>
                  <p className="text-xs text-gray-500">From idea to action plan</p>
                </div>
              </Link>
            </SidebarHeader>

            <SidebarContent className="p-3 overflow-y-auto">
              <div className="mb-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-3 shadow-lg relative overflow-hidden group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:rounded-lg">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-data-[collapsible=icon]:hidden"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 group-data-[collapsible=icon]:hidden"></div>
                
                <Link to={createPageUrl("Credits")} className="relative z-10 block">
                  <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div className="group-data-[collapsible=icon]:hidden flex-1 min-w-0">
                      <p className="text-xs text-orange-100 font-medium">{isArabic ? "الأرصدة المتاحة" : "Credits"}</p>
                      <p className="text-xl font-bold text-white">
                        {currentUser?.premium_credits || 0}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-md hover:shadow-lg transition-all duration-200 group-data-[collapsible=icon]:hidden"
                    >
                      {isArabic ? "شراء" : "Buy"}
                    </Button>
                  </div>
                </Link>
              </div>

              <Link to={createPageUrl("NewAnalysis")} className="block mb-4">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-5 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-[1.02] group group-data-[collapsible=icon]:p-3 group-data-[collapsible=icon]:rounded-lg">
                  <Plus className="w-5 h-5 group-data-[collapsible=icon]:mr-0 mr-2" />
                  <span className="group-data-[collapsible=icon]:hidden">{isArabic ? "تحليل جديد" : "New Analysis"}</span>
                  <Sparkles className="w-4 h-4 ml-2 opacity-70 group-hover:opacity-100 group-data-[collapsible=icon]:hidden" />
                </Button>
              </Link>

              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                  {isArabic ? "القائمة" : "Menu"}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {navigationItems.filter(item => item.id !== 'new_analysis').map((item) =>
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          className={`transition-all duration-200 rounded-lg px-3 py-2.5 ${
                            location.pathname === item.url
                              ? 'bg-orange-50 text-orange-600 font-semibold border-l-4 border-orange-500'
                              : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                          }`}
                        >
                          <Link to={item.url} className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <item.icon className={`w-5 h-5 ${location.pathname === item.url ? 'text-orange-500' : 'text-gray-400'}`} />
                            <span className="flex-1">{item.title}</span>
                            {location.pathname === item.url && (
                              <ChevronRight className={`w-4 h-4 text-orange-400 ${isArabic ? 'rotate-180' : ''}`} />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-gray-100 p-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {(currentUser?.full_name || currentUser?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {currentUser?.display_name || currentUser?.full_name || 'User'}
                    </p>
                    <Button variant="ghost" size="icon" className="w-6 h-6 text-gray-400 hover:text-gray-700" onClick={() => setIsEditingDisplayName(true)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <Button variant="ghost" size="sm" onClick={toggleLanguage} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100" title={isArabic ? "Switch to English" : "التبديل إلى العربية"}>
                  <Globe className="w-4 h-4 mr-1" />
                  <span className="text-xs">{isArabic ? 'EN' : 'AR'}</span>
                </Button>
                <div className="flex items-center gap-1">
                  <NotificationBell userEmail={currentUser?.email} isArabic={isArabic} />
                  <Button variant="ghost" size="icon" onClick={() => setIsLogoutConfirmOpen(true)} className="text-gray-400 hover:text-red-500 hover:bg-red-50">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>
        }

        <main className={`flex-1 flex flex-col ${isLoggedIn ? (isArabic ? 'order-1' : 'order-2') : ''}`}>
          {isLoggedIn &&
          <header className="bg-white border-b border-gray-200 px-4 py-3 md:hidden shadow-sm no-print">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200" />
                  <img
                    src={planLyzeLogo}
                    alt="Planlyze"
                    className="h-8 object-contain"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <NotificationBell userEmail={currentUser?.email} isArabic={isArabic} />
                  <Button variant="ghost" size="icon" onClick={() => setIsLogoutConfirmOpen(true)} className="text-gray-400 hover:text-red-500">
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </header>
          }

          <div className="flex-1 overflow-auto print-container bg-gray-50">
            {children}
          </div>
        </main>
      </div>

      <Dialog open={isEditingDisplayName} onOpenChange={setIsEditingDisplayName}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isArabic ? "تعديل الاسم" : "Edit Display Name"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="displayName" className="text-right">
                {isArabic ? "الاسم" : "Name"}
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
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
            </DialogClose>
            <Button onClick={handleSaveDisplayName} disabled={isSavingDisplayName} className="bg-orange-500 hover:bg-orange-600">
              {isSavingDisplayName ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ التغييرات' : 'Save changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showProfilePrompt}
        onOpenChange={(open) => {
          setShowProfilePrompt(open);
          if (!open && !profilePromptAcked) {
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
            <p className="text-gray-600">
              {isArabic
                ? "أضف بعض المعلومات إلى ملفك الشخصي لتحسين تجربتك."
                : "Add some information to your profile to enhance your experience."}
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => acknowledgeProfilePrompt(false)}>
                {isArabic ? "لاحقًا" : "Later"}
              </Button>
            </DialogClose>
            <Button onClick={() => acknowledgeProfilePrompt(true)} disabled={isAckingProfilePrompt} className="bg-orange-500 hover:bg-orange-600">
              {isArabic ? "إكمال الملف الشخصي" : "Complete Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{isArabic ? "تأكيد تسجيل الخروج" : "Confirm Logout"}</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            {isArabic ? "هل أنت متأكد أنك تريد تسجيل الخروج؟" : "Are you sure you want to log out?"}
          </p>
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
