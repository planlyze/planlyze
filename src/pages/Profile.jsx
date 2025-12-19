import React, { useEffect, useState } from "react";
import { User } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, User as UserIcon, Mail, Phone, MapPin, Lock, Save, Globe } from "lucide-react";
import { logProfileUpdated } from "@/components/utils/activityHelper";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    display_name: "",
    email: "",
    phone_number: "",
    country: "",
    city: ""
  });

  const isArabic = user?.preferred_language === 'arabic';

  useEffect(() => {
    const init = async () => {
      try {
        const me = await User.me();
        setUser(me);
        setForm({
          full_name: me.full_name || "",
          display_name: me.display_name || "",
          email: me.email || "",
          phone_number: me.phone_number || "",
          country: me.country || "",
          city: me.city || ""
        });
      } catch (e) {
        await User.loginWithRedirect(window.location.href);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await User.updateProfile({
        full_name: form.full_name || "",
        language: user?.language || "en"
      });
      if (user?.email) {
        await logProfileUpdated(user.email);
      }
      toast.success(isArabic ? "تم تحديث الملف الشخصي" : "Profile updated");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(isArabic ? "فشل في تحديث الملف الشخصي" : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="h-8 w-40 bg-slate-200 rounded animate-pulse mb-6" />
          <div className="h-72 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("Dashboard"))} className="shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-orange-600">
              {isArabic ? "الملف الشخصي" : "Profile"}
            </h1>
            <p className="text-slate-600 mt-1">{isArabic ? "إدارة معلوماتك الشخصية" : "Manage your personal information"}</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <UserIcon className="w-5 h-5" />
              {isArabic ? "معلومات الحساب" : "Account Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">{isArabic ? "الاسم الكامل" : "Full name"}</Label>
                <div className="relative">
                  <UserIcon className={`w-4 h-4 text-slate-400 absolute ${isArabic ? 'right-3' : 'left-3'} top-3`} />
                  <Input
                    id="full_name"
                    value={form.full_name}
                    disabled
                    className={`${isArabic ? 'pr-9' : 'pl-9'} bg-slate-50`}
                    placeholder={isArabic ? "اسمك" : "Your name"}
                  />
                </div>
                <p className="text-xs text-slate-500">{isArabic ? "يُدار بواسطة مزود تسجيل الدخول." : "Managed by your login provider."}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">{isArabic ? "الاسم المعروض" : "Display name"}</Label>
                <Input
                  id="display_name"
                  value={form.display_name}
                  onChange={(e) => handleChange("display_name", e.target.value)}
                  placeholder={isArabic ? "الاسم المعروض في التطبيق" : "Name shown in the app"}
                />
                <p className="text-xs text-slate-500">{isArabic ? "يظهر في التطبيق؛ لا يغير اسم تسجيل الدخول." : "Shown across the app; does not change your login name."}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{isArabic ? "البريد الإلكتروني" : "Email"}</Label>
                <div className="relative">
                  <Mail className={`w-4 h-4 text-slate-400 absolute ${isArabic ? 'right-3' : 'left-3'} top-3`} />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    disabled
                    className={`${isArabic ? 'pr-9' : 'pl-9'} bg-slate-50`}
                    placeholder="you@example.com"
                  />
                </div>
                <p className="text-xs text-slate-500">{isArabic ? "البريد الإلكتروني يُدار بواسطة المنصة ولا يمكن تغييره هنا." : "Email is managed by the platform and cannot be changed here."}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{isArabic ? "رقم الهاتف" : "Phone number"}</Label>
                <div className="relative">
                  <Phone className={`w-4 h-4 text-slate-400 absolute ${isArabic ? 'right-3' : 'left-3'} top-3`} />
                  <Input
                    id="phone"
                    value={form.phone_number}
                    onChange={(e) => handleChange("phone_number", e.target.value)}
                    className={isArabic ? 'pr-9' : 'pl-9'}
                    placeholder="+963 9xxxxxxxx"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">{isArabic ? "الدولة" : "Country"}</Label>
                <div className="relative">
                  <MapPin className={`w-4 h-4 text-slate-400 absolute ${isArabic ? 'right-3' : 'left-3'} top-3`} />
                  <Input
                    id="country"
                    value={form.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    className={isArabic ? 'pr-9' : 'pl-9'}
                    placeholder={isArabic ? "سوريا" : "Syria"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">{isArabic ? "المدينة" : "City"}</Label>
                <div className="relative">
                  <MapPin className={`w-4 h-4 text-slate-400 absolute ${isArabic ? 'right-3' : 'left-3'} top-3`} />
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className={isArabic ? 'pr-9' : 'pl-9'}
                    placeholder={isArabic ? "دمشق" : "Damascus"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{isArabic ? "كلمة المرور" : "Password"}</Label>
                <div className="relative">
                  <Lock className={`w-4 h-4 text-slate-400 absolute ${isArabic ? 'right-3' : 'left-3'} top-3`} />
                  <Input
                    id="password"
                    type="password"
                    value="********"
                    disabled
                    className={`${isArabic ? 'pr-9' : 'pl-9'} bg-slate-50`}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {isArabic ? "تغييرات كلمة المرور تتم بواسطة مزود تسجيل الدخول ولا يمكن تغييرها هنا." : "Password changes are handled by the login provider and cannot be changed here."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">{isArabic ? "اللغة" : "Language"}</Label>
                <div className="relative">
                  <Globe className={`w-4 h-4 text-slate-400 absolute ${isArabic ? 'right-3' : 'left-3'} top-3 z-10`} />
                  <Select
                    value={user?.preferred_language || 'english'}
                    onValueChange={async (value) => {
                      await User.updateMyUserData({ preferred_language: value });
                      setUser(prev => ({ ...prev, preferred_language: value }));
                      toast.success(value === 'arabic' ? "تم تغيير اللغة" : "Language changed");
                    }}
                  >
                    <SelectTrigger className={isArabic ? 'pr-9' : 'pl-9'}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="arabic">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-slate-500">
                  {isArabic ? "اختر لغة واجهة التطبيق" : "Choose the app interface language"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2 gradient-primary text-white">
                <Save className="w-4 h-4" />
                {saving ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ التغييرات" : "Save Changes")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}