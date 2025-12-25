import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Globe, Sparkles, Lightbulb, AlertCircle, CheckCircle2, Target, Building2, MapPin } from "lucide-react";
import { INDUSTRIES as WIZARD_INDUSTRIES } from "@/components/constants/industries";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/api/client";
import { toast } from "sonner";

const REPORT_LANGUAGES = [
  { value: "english", label: "English", flag: "🇺🇸" },
  { value: "arabic", label: "العربية", flag: "🇸🇾" }
];

export default function AnalysisWizard({ onSubmit }) {
  const { user } = useAuth();
  const isUIArabic = user?.language === 'arabic';
  const [autoTarget, setAutoTarget] = useState(true);
  const [formData, setFormData] = useState({
    business_idea: "",
    target_market: "",
    industry: "",
    report_language: "english",
    country: "Syria"
  });

  useEffect(() => {
    if (user?.language) {
      setFormData(prev => ({
        ...prev,
        report_language: user.language === 'arabic' ? 'arabic' : 'english'
      }));
    }
  }, [user]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [aiValidationError, setAiValidationError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
    
    if (field === 'business_idea' && aiValidationError) {
      setAiValidationError(null);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (formData.business_idea.trim().length < 1) {
      errors.business_idea = isUIArabic ? "يرجى وصف فكرتك" : "Please describe your idea";
    }
    if (!formData.industry) {
      errors.industry = isUIArabic ? "يرجى اختيار مجال العمل" : "Please select an industry";
    }
    if (!autoTarget && formData.target_market.trim().length < 3) {
      errors.target_market = isUIArabic ? "يرجى تحديد جمهورك المستهدف" : "Please specify your target audience";
    }
    if (!formData.country || formData.country.trim().length === 0) {
      errors.country = isUIArabic ? "الدولة مطلوبة" : "Country is required";
    }
    if (!formData.report_language) {
      errors.report_language = isUIArabic ? "يرجى اختيار لغة التقرير" : "Please select report language";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const canSubmit = () => {
    return formData.business_idea.trim().length >= 10 && 
           !!formData.industry && 
           (autoTarget || formData.target_market.trim().length >= 3) &&
           !!formData.country?.trim() &&
           !!formData.report_language;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setAiValidationError(null);
    setIsValidating(true);
    
    try {
      const validationResp = await api.post('/analyses/validate-idea', {
        business_idea: formData.business_idea,
        report_language: formData.report_language,
        industry: formData.industry
      });
      
      const validation = validationResp?.data || validationResp;
      
      if (!validation.valid) {
        setAiValidationError(validation.reason);
        setIsValidating(false);
        return;
      }
      
      setIsValidating(false);
      setIsSubmitting(true);
      await onSubmit(formData);
      setIsSubmitting(false);
      
    } catch (error) {
      console.error("Validation failed:", error);
      const errorMsg = error?.response?.data?.error || error.message || "Validation failed";
      toast.error(errorMsg);
      setIsValidating(false);
    }
  };

  const getCharacterStatus = () => {
    const len = formData.business_idea.length;
    if (len === 0) return { color: 'text-slate-400', status: isUIArabic ? 'ابدأ الكتابة...' : 'Start typing...' };
    if (len < 10) return { color: 'text-orange-500', status: isUIArabic ? 'قصير جداً' : 'Too short' };
    if (len < 50) return { color: 'text-yellow-500', status: isUIArabic ? 'جيد' : 'Good' };
    if (len < 200) return { color: 'text-emerald-500', status: isUIArabic ? 'ممتاز' : 'Great' };
    return { color: 'text-purple-500', status: isUIArabic ? 'مفصل جداً!' : 'Very detailed!' };
  };

  const charStatus = getCharacterStatus();

  return (
    <div className="max-w-2xl mx-auto" dir={isUIArabic ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 font-bold text-sm">
              1
            </div>
            <Label htmlFor="business_idea" className="text-base font-semibold text-slate-800 dark:text-white">
              {isUIArabic ? "ما هي فكرتك؟" : "What's your idea?"}
            </Label>
            <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs">
              {isUIArabic ? "مطلوب" : "Required"}
            </Badge>
          </div>
          
          <div className="relative">
            <Textarea
              id="business_idea"
              placeholder={isUIArabic 
                ? "صف فكرة منتجك بالتفصيل...\n\n• ما المشكلة التي يحلها؟\n• من سيستخدمه؟\n• ما الذي يجعله فريداً؟" 
                : "Describe your product idea in detail...\n\n• What problem does it solve?\n• Who will use it?\n• What makes it unique?"}
              value={formData.business_idea}
              onChange={(e) => handleInputChange('business_idea', e.target.value)}
              className={`min-h-[160px] resize-none border-2 transition-all duration-200 bg-slate-50/50 dark:bg-gray-700/50 focus:bg-white dark:focus:bg-gray-700 dark:text-white ${
                validationErrors.business_idea 
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100' 
                  : 'border-slate-200 dark:border-gray-600 focus:border-purple-400 focus:ring-purple-100'
              }`}
              maxLength={5000}
            />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className={`text-xs font-medium ${charStatus.color}`}>
                {charStatus.status}
              </span>
              <span className="text-xs text-slate-400">
                {formData.business_idea.length}/5000
              </span>
            </div>
          </div>

          {validationErrors.business_idea && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 flex items-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4" />
              {validationErrors.business_idea}
            </motion.p>
          )}
          
          <AnimatePresence>
            {aiValidationError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl overflow-hidden"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                      {isUIArabic ? 'فكرتك تحتاج تحسين' : 'Your idea needs improvement'}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">{aiValidationError}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 bg-gradient-to-r from-slate-50 to-purple-50/50 dark:from-gray-700/50 dark:to-purple-900/20 rounded-xl border border-slate-200 dark:border-gray-600">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 font-bold text-sm">
              2
            </div>
            <Label className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500" />
              {isUIArabic ? "الجمهور المستهدف" : "Target Audience"}
            </Label>
          </div>

          <div className="flex items-center gap-3 mb-4 p-3 bg-white dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-gray-600">
            <input
              id="auto_target"
              type="checkbox"
              checked={autoTarget}
              onChange={(e) => {
                const checked = e.target.checked;
                setAutoTarget(checked);
                if (checked) {
                  handleInputChange('target_market', '');
                }
              }}
              className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <Label htmlFor="auto_target" className="font-medium text-sm text-slate-700 dark:text-slate-200 select-none cursor-pointer flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              {isUIArabic ? "دع الذكاء الاصطناعي يحدد الجمهور المستهدف" : "Let AI determine the best target audience"}
            </Label>
          </div>

          <AnimatePresence>
            {!autoTarget && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Input
                  id="target_market"
                  placeholder={isUIArabic ? "مثال: الشركات الصغيرة، طلاب الجامعات..." : "e.g., Small businesses, university students..."}
                  value={formData.target_market}
                  onChange={(e) => handleInputChange('target_market', e.target.value)}
                  className={`border-2 ${validationErrors.target_market ? 'border-red-300' : 'border-slate-200 dark:border-gray-600'} bg-white dark:bg-gray-700 dark:text-white`}
                />
                {validationErrors.target_market && (
                  <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.target_market}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 font-bold text-sm">
                3
              </div>
              <Label className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-500" />
                {isUIArabic ? "المجال" : "Industry"}
              </Label>
            </div>
            
            <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
              <SelectTrigger className={`border-2 bg-slate-50/50 dark:bg-gray-700/50 dark:text-white ${validationErrors.industry ? 'border-red-300' : 'border-slate-200 dark:border-gray-600'}`}>
                <SelectValue placeholder={isUIArabic ? "اختر المجال" : "Select industry"} />
              </SelectTrigger>
              <SelectContent>
                {WIZARD_INDUSTRIES.map((industry) =>
                  <SelectItem key={industry.value} value={industry.value}>
                    {isUIArabic ? industry.label_ar || industry.label : industry.label}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {validationErrors.industry && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.industry}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 font-bold text-sm">
                4
              </div>
              <Label className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-500" />
                {isUIArabic ? "الدولة" : "Country"}
              </Label>
            </div>
            
            <Input
              id="country"
              disabled={true}
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="border-2 border-slate-200 dark:border-gray-600 bg-slate-100 dark:bg-gray-700/50 dark:text-white cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {isUIArabic ? "التحليل مخصص لسوريا حالياً" : "Analysis is tailored for Syria"}
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 font-bold text-sm">
              5
            </div>
            <Label className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-500" />
              {isUIArabic ? "لغة التقرير" : "Report Language"}
            </Label>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {REPORT_LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                type="button"
                onClick={() => handleInputChange('report_language', lang.value)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                  formData.report_language === lang.value
                    ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/30 ring-2 ring-purple-100 dark:ring-purple-900/50'
                    : 'border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-slate-300 dark:hover:border-gray-500 hover:bg-slate-50 dark:hover:bg-gray-600'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="text-left">
                  <p className={`font-semibold ${formData.report_language === lang.value ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-200'}`}>
                    {lang.label}
                  </p>
                </div>
                {formData.report_language === lang.value && (
                  <CheckCircle2 className="w-5 h-5 text-purple-500 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || isSubmitting || isValidating}
            className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-lg font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 disabled:opacity-50 disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none rounded-xl"
          >
            {isValidating ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isUIArabic ? 'جاري التحقق من الفكرة...' : 'Validating your idea...'}
              </span>
            ) : isSubmitting ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isUIArabic ? 'جاري إنشاء التحليل...' : 'Creating your analysis...'}
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <Sparkles className="w-5 h-5" />
                {isUIArabic ? 'بدء تحليل الذكاء الاصطناعي' : 'Start AI Analysis'}
              </span>
            )}
          </Button>
          
          {!canSubmit() && formData.business_idea.length > 0 && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-3">
              {isUIArabic ? 'أكمل جميع الحقول المطلوبة للمتابعة' : 'Complete all required fields to continue'}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
