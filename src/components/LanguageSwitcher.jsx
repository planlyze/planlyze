import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('planlyze-language', lang);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-slate-600" />
      <Select value={i18n.language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-32 border border-slate-300 rounded-lg bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t('common.english')}</SelectItem>
          <SelectItem value="ar">{t('common.arabic')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
