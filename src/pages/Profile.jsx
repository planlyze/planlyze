import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { User, auth } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User as UserIcon, Mail, Phone, MapPin, Lock, Save } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { logProfileUpdated } from "@/components/utils/activityHelper";
import { useAuth } from "@/lib/AuthContext";

export default function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { updateMyUserData } = useAuth();
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

  const isArabic = i18n.language === 'ar' || user?.preferred_language === 'arabic';

  useEffect(() => {
    const init = async () => {
      try {
        const me = await auth.me();
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
        window.location.href = "/login";
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
      const updateData = {
        display_name: form.display_name || "",
        phone_number: form.phone_number || "",
        country: form.country || "",
        city: form.city || ""
      };
      
      await updateMyUserData(updateData);
      
      setUser(prev => ({ ...prev, ...updateData }));
      
      if (user?.email) {
        await logProfileUpdated(user.email);
      }
      toast.success(t('profile.profileUpdated'));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t('profile.profileUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <div className="h-8 w-40 bg-slate-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
          <div className="h-72 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-purple-50/20 to-orange-50/10 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title={t('profile.title')}
          description={t('profile.subtitle')}
          backUrl={createPageUrl("Dashboard")}
          icon={UserIcon}
          isArabic={isArabic}
        />

        <Card className="glass-effect border-0 shadow-lg dark:bg-gray-800 dark:border dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
              <UserIcon className="w-5 h-5" />
              {t('profile.accountInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="dark:text-slate-300">{t('profile.fullName')}</Label>
                <div className="relative">
                  <UserIcon className={`w-4 h-4 text-slate-400 absolute ${isArabic ? 'right-3' : 'left-3'} top-3`} />
                  <Input
                    id="full_name"
                    value={form.full_name}
                    disabled
                    className={`${isArabic ? 'pr-9' : 'pl-9'} bg-slate-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                    placeholder={t('profile.fullNamePlaceholder')}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('profile.fullNameManaged')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name" className="dark:text-slate-300">{t('profile.displayName')}</Label>
                <Input
                  id="display_name"
                  value={form.display_name}
                  onChange={(e) => handleChange("display_name", e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder={t('profile.displayNamePlaceholder')}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('profile.displayNameNote')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-slate-300">{t('profile.email')}</Label>
                <div className="relative">
                  <Mail className={`w-4 h-4 text-slate-400 absolute ${isArabic ? 'right-3' : 'left-3'} top-3`} />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    disabled
                    className={`${isArabic ? 'pr-9' : 'pl-9'} bg-slate-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                    placeholder="you@example.com"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('profile.emailManaged')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="dark:text-slate-300">{t('profile.phoneNumber')}</Label>
                <div className="relative">
                  <Phone className={`w-4 h-4 text-slate-400 absolute ${isArabic ? 'right-3' : 'left-3'} top-3`} />
                  <Input
                    id="phone"
                    value={form.phone_number}
                    onChange={(e) => handleChange("phone_number", e.target.value)}
                    className={`${isArabic ? 'pr-9' : 'pl-9'} dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                    placeholder="+963 9xxxxxxxx"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="dark:text-slate-300">{t('profile.country')}</Label>
                <div className="relative">
                  <MapPin className={`w-4 h-4 text-slate-400 absolute ${isArabic ? 'right-3' : 'left-3'} top-3`} />
                  <Input
                    id="country"
                    value={form.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    className={`${isArabic ? 'pr-9' : 'pl-9'} dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                    placeholder={t('profile.countryPlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="dark:text-slate-300">{t('profile.city')}</Label>
                <div className="relative">
                  <MapPin className={`w-4 h-4 text-slate-400 absolute ${isArabic ? 'right-3' : 'left-3'} top-3`} />
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className={`${isArabic ? 'pr-9' : 'pl-9'} dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                    placeholder={t('profile.cityPlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="dark:text-slate-300">{t('profile.password')}</Label>
                <div className="relative">
                  <Lock className={`w-4 h-4 text-slate-400 absolute ${isArabic ? 'right-3' : 'left-3'} top-3`} />
                  <Input
                    id="password"
                    type="password"
                    value="********"
                    disabled
                    className={`${isArabic ? 'pr-9' : 'pl-9'} bg-slate-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('profile.passwordManaged')}
                </p>
              </div>

            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2 gradient-primary text-white">
                <Save className="w-4 h-4" />
                {saving ? t('profile.saving') : t('profile.saveChanges')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
