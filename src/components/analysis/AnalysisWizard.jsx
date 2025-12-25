import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Sparkles, Lightbulb, AlertCircle, CheckCircle } from "lucide-react";
import { INDUSTRIES as WIZARD_INDUSTRIES } from "@/components/constants/industries";
import { motion } from "framer-motion";
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
        report_language: formData.report_language
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

  return (
    <div className="max-w-2xl mx-auto" dir={isUIArabic ? 'rtl' : 'ltr'}>
      <Card className="border-2 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-3">
                <div className="p-2 bg-purple-100 border-2 border-purple-200 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {isUIArabic ? "فكرتك التقنية" : "Your Tech Idea"}
                </h2>
              </div>
              <p className="text-slate-600">{isUIArabic ? "أخبرنا عن مفهوم منتجك وتفضيلاتك" : "Tell us about your product concept and preferences"}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="business_idea" className="text-base font-semibold flex items-center gap-2">
                  {isUIArabic ? "ما هي فكرتك التقنية؟ *" : "What's your tech idea? *"}
                  <Badge variant="outline" className="text-xs">{isUIArabic ? "مطلوب" : "Required"}</Badge>
                </Label>
                <Textarea
                  id="business_idea"
                  placeholder={isUIArabic ? "صف فكرة منتجك البرمجي بالتفصيل. ما المشكلة التي يحلها؟ من سيستخدمه؟ ما الذي يجعله فريداً؟ كن محدداً!" : "Describe your software product idea in detail. What problem does it solve? Who will use it? What makes it unique? Be specific!"}
                  value={formData.business_idea}
                  onChange={(e) => handleInputChange('business_idea', e.target.value)}
                  className={`mt-2 min-h-[140px] resize-none border-2 ${validationErrors.business_idea ? 'border-red-400' : 'border-slate-300'} focus:border-purple-400`}
                  maxLength={5000}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-sm ${formData.business_idea.length >= 10 ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                    {formData.business_idea.length} {isUIArabic ? "حرف" : "characters"} {formData.business_idea.length < 10 && (isUIArabic ? '(10 أحرف على الأقل)' : '(min 10)')}
                  </p>
                </div>
                
                {validationErrors.business_idea && (
                  <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.business_idea}
                  </p>
                )}
                
                {aiValidationError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-red-700">
                          {isUIArabic ? 'فكرتك تحتاج تحسين' : 'Your idea needs improvement'}
                        </p>
                        <p className="text-sm text-red-600 mt-1">{aiValidationError}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-200 hover:border-purple-200 transition-colors">
                <div className="flex items-center gap-2">
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
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <Label htmlFor="auto_target" className="font-medium text-sm text-slate-700 select-none flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    {isUIArabic ? "دع الذكاء الاصطناعي يحدد الجمهور المستهدف" : "Let AI decide the target audience"}
                  </Label>
                </div>

                <div>
                  <Label htmlFor="target_market" className="text-base font-semibold">
                    {isUIArabic ? "الجمهور المستهدف" : "Target audience"} {autoTarget ? (isUIArabic ? "(اختياري)" : "(optional)") : "*"}
                  </Label>
                  <Input
                    id="target_market"
                    placeholder={autoTarget ? (isUIArabic ? "سيحدد الذكاء الاصطناعي أفضل جمهور" : "AI will determine the best audience") : (isUIArabic ? "مثال: الشركات الصغيرة في سوريا، طلاب الجامعات" : "e.g., Small businesses in Syria, university students")}
                    value={formData.target_market}
                    onChange={(e) => handleInputChange('target_market', e.target.value)}
                    disabled={autoTarget}
                    className={`mt-2 border-2 ${validationErrors.target_market ? 'border-red-400' : 'border-slate-300'} disabled:bg-slate-100 disabled:cursor-not-allowed`}
                  />
                  {validationErrors.target_market && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.target_market}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  {isUIArabic ? "فئة المجال *" : "Industry Category *"}
                  <Badge variant="outline" className="text-xs">{isUIArabic ? "مطلوب" : "Required"}</Badge>
                </Label>
                
                <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                  <SelectTrigger className={`mt-2 border-2 ${validationErrors.industry ? 'border-red-400' : 'border-slate-300'}`}>
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
                  <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.industry}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-base font-semibold">{isUIArabic ? "الدولة *" : "Country *"}</Label>
                <Input
                  id="country"
                  disabled={true}
                  placeholder={isUIArabic ? "مثال: المملكة العربية السعودية" : "e.g., Saudi Arabia"}
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)} />
                <p className="text-sm text-slate-500">{isUIArabic ? "سنخصص التحليل لهذه الدولة." : "We'll tailor the analysis to this country."}</p>
              </div>

              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {isUIArabic ? "لغة التقرير *" : "Report Language *"}
                  <Badge variant="outline" className="text-xs">{isUIArabic ? "مطلوب" : "Required"}</Badge>
                </Label>
                <Select value={formData.report_language} onValueChange={(value) => handleInputChange('report_language', value)}>
                  <SelectTrigger className={`mt-2 border-2 ${validationErrors.report_language ? 'border-red-400' : 'border-slate-300'}`}>
                    <SelectValue placeholder={isUIArabic ? "اختر لغة التقرير المفضلة" : "Choose your preferred language for the report"} />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_LANGUAGES.map((lang) =>
                      <SelectItem key={lang.value} value={lang.value}>
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {validationErrors.report_language && (
                  <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.report_language}
                  </p>
                )}
                <div className={`mt-2 p-3 rounded-lg ${formData.report_language === 'arabic' ? 'bg-purple-50 border border-purple-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <p className="text-sm font-medium">
                    {formData.report_language === 'arabic' ?
                      '✨ سيتم إنشاء التقرير باللغة العربية' :
                      '✨ Report will be generated in English'
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      <div className="flex justify-center mt-8">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit() || isSubmitting || isValidating}
          className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-3 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:bg-slate-400">
          {isValidating ? (
            <>
              <div className={`w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ${isUIArabic ? 'ml-2' : 'mr-2'}`} />
              {isUIArabic ? 'جاري التحقق من الفكرة...' : 'Validating idea...'}
            </>
          ) : isSubmitting ? (
            <>
              <div className={`w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ${isUIArabic ? 'ml-2' : 'mr-2'}`} />
              {isUIArabic ? 'جاري الإنشاء...' : 'Creating analysis...'}
            </>
          ) : (
            <>
              <Sparkles className={`w-4 h-4 ${isUIArabic ? 'ml-2' : 'mr-2'}`} />
              {isUIArabic ? 'بدء تحليل الذكاء الاصطناعي' : 'Start AI Analysis'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
