import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Globe, Sparkles, Lightbulb, AlertCircle, CheckCircle2 } from "lucide-react";
import { INDUSTRIES as WIZARD_INDUSTRIES } from "@/components/constants/industries";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";


// BUDGET_RANGES and TIMELINES are no longer used in the simplified wizard, so they are removed.

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner - New to tech entrepreneurship" },
  { value: "intermediate", label: "Intermediate - Some experience with tech projects" },
  { value: "experienced", label: "Experienced - Led multiple tech initiatives" },
  { value: "expert", label: "Expert - Seasoned entrepreneur/developer" }
];


const REPORT_LANGUAGES = [
  { value: "english", label: "English", flag: "🇺🇸" },
  { value: "arabic", label: "العربية", flag: "🇸🇾" }
];


export default function AnalysisWizard({ onSubmit }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [autoTarget, setAutoTarget] = useState(true);
  const [formData, setFormData] = useState({
    business_idea: "",
    target_market: "",
    industry: "",
    budget_range: "",
    timeline: "",
    experience_level: "",
    report_language: "english",
    country: "Syria"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState({
    industries: [],
    loading: false,
    marketTrends: "",
    targetAudience: ""
  });
  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // AI-powered industry suggestions based on business idea
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (formData.business_idea.length >= 30 && !formData.industry) {
        setAiSuggestions(prev => ({ ...prev, loading: true }));
        
        try {
          const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Based on this business idea: "${formData.business_idea}"
            
Suggest 3 most relevant industries from this list: ${WIZARD_INDUSTRIES.map(i => i.value).join(', ')}

Also provide:
1. A brief market trend insight (1-2 sentences)
2. Suggested target audience (1 sentence)

Return ONLY a JSON object with this exact structure:
{
  "industries": ["industry1", "industry2", "industry3"],
  "marketTrend": "brief trend insight",
  "targetAudience": "suggested audience"
}`,
            response_json_schema: {
              type: "object",
              properties: {
                industries: { type: "array", items: { type: "string" } },
                marketTrend: { type: "string" },
                targetAudience: { type: "string" }
              }
            }
          });

          setAiSuggestions({
            industries: response.industries || [],
            marketTrends: response.marketTrend || "",
            targetAudience: response.targetAudience || "",
            loading: false
          });
        } catch (error) {
          console.error("AI suggestion failed:", error);
          setAiSuggestions(prev => ({ ...prev, loading: false }));
        }
      }
    }, 1500);

    return () => clearTimeout(debounceTimer);
  }, [formData.business_idea]);

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      if (formData.business_idea.trim().length < 30) {
        errors.business_idea = "Please provide at least 30 characters describing your idea";
      }
      if (!formData.industry) {
        errors.industry = "Please select an industry";
      }
      if (!autoTarget && formData.target_market.trim().length < 3) {
        errors.target_market = "Please specify your target audience";
      }
      if (!formData.country || formData.country.trim().length === 0) {
        errors.country = "Country is required";
      }
    }
    
    if (step === 2) {
      if (!formData.experience_level) {
        errors.experience_level = "Please select your experience level";
      }
      if (!formData.report_language) {
        errors.report_language = "Please select report language";
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const canProceed = (step) => {
    switch (step) {
      case 1:
        return formData.business_idea.trim().length >= 30 && 
               !!formData.industry && 
               (autoTarget || formData.target_market.trim().length >= 3) &&
               !!formData.country?.trim();
      case 2:
        return !!formData.experience_level && !!formData.report_language;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          {[
            { num: 1, label: "Business Idea" },
            { num: 2, label: "Preferences" }
          ].map((step, idx) => (
            <div key={step.num} className="flex items-center flex-1">
              <button 
                onClick={() => step.num < currentStep && setCurrentStep(step.num)}
                disabled={step.num > currentStep}
                className="flex flex-col items-center gap-2 group cursor-pointer disabled:cursor-default"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2 ${
                  step.num < currentStep ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg group-hover:scale-105' :
                  step.num === currentStep ? 'bg-purple-600 border-purple-700 text-white shadow-xl scale-110' :
                  'bg-slate-100 border-slate-300 text-slate-500'
                }`}>
                  {step.num < currentStep ? <CheckCircle2 className="w-6 h-6" /> : step.num}
                </div>
                <span className={`text-xs font-semibold transition-colors ${
                  step.num === currentStep ? 'text-purple-700' : 
                  step.num < currentStep ? 'text-emerald-600 group-hover:text-emerald-700' : 'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </button>
              {idx < 1 && (
                <div className={`h-1 flex-1 mx-4 rounded-full transition-all duration-500 ${
                  step.num < currentStep ? 'bg-emerald-500' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="border-2 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-8">
          {currentStep === 1 &&
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="p-2 bg-purple-100 border-2 border-purple-200 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    Your Tech Idea
                  </h2>
                </div>
                <p className="text-slate-600">Tell us about your product concept and market</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="business_idea" className="text-base font-semibold flex items-center gap-2">
                    What's your tech idea? *
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  </Label>
                  <Textarea
                    id="business_idea"
                    placeholder="Describe your software product idea in detail. What problem does it solve? Who will use it? What makes it unique? Be specific!"
                    value={formData.business_idea}
                    onChange={(e) => handleInputChange('business_idea', e.target.value)}
                    className={`mt-2 min-h-[140px] resize-none border-2 ${validationErrors.business_idea ? 'border-red-400' : 'border-slate-300'} focus:border-purple-400`}
                    maxLength={100}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-sm ${formData.business_idea.length >= 30 ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                      {formData.business_idea.length}/100 characters (minimum 30 required)
                    </p>
                    {formData.business_idea.length >= 30 && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  {validationErrors.business_idea && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.business_idea}
                    </p>
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
                      Let AI decide the target audience
                    </Label>
                  </div>

                  {aiSuggestions.targetAudience && !autoTarget && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-xs font-semibold text-purple-700 mb-1">💡 AI Suggestion:</p>
                      <p className="text-sm text-purple-900">{aiSuggestions.targetAudience}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleInputChange('target_market', aiSuggestions.targetAudience)}
                        className="mt-2 text-xs border-purple-300 hover:bg-purple-600 hover:text-white"
                      >
                        Use this suggestion
                      </Button>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="target_market" className="text-base font-semibold">
                      Target audience {autoTarget ? "(optional)" : "*"}
                    </Label>
                    <Input
                      id="target_market"
                      placeholder={autoTarget ? "AI will determine the best audience" : "e.g., Small businesses in Syria, university students"}
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
                    Industry Category *
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  </Label>
                  
                  {aiSuggestions.loading && (
                    <div className="mt-2 p-3 bg-purple-50 border-2 border-purple-200 rounded-lg flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                      <span className="text-sm text-purple-700 font-medium">AI is analyzing your idea...</span>
                    </div>
                  )}
                  
                  {aiSuggestions.industries.length > 0 && !formData.industry && (
                    <div className="mt-2 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-bold text-purple-700">AI Suggestions:</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {aiSuggestions.industries.map((ind) => (
                          <Button
                            key={ind}
                            type="button"
                            onClick={() => handleInputChange('industry', ind)}
                            variant="outline"
                            size="sm"
                            className="border-2 border-purple-300 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all duration-200"
                          >
                            {WIZARD_INDUSTRIES.find(i => i.value === ind)?.label || ind}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger className={`mt-2 border-2 ${validationErrors.industry ? 'border-red-400' : 'border-slate-300'}`}>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {WIZARD_INDUSTRIES.map((industry) =>
                        <SelectItem key={industry.value} value={industry.value}>
                          {industry.label}
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
                  
                  {aiSuggestions.marketTrends && formData.industry && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-semibold text-blue-700 mb-1">💡 Market Insight:</p>
                      <p className="text-sm text-blue-900">{aiSuggestions.marketTrends}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-base font-semibold">Country *</Label>
                <Input
                  id="country"
                  disabled={true}
                  placeholder="e.g., Saudi Arabia"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)} />
                <p className="text-sm text-slate-500">We'll tailor the analysis to this country.</p>
              </div>
            </motion.div>
          }

          {currentStep === 2 &&
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="p-2 bg-purple-100 border-2 border-purple-200 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    Preferences
                  </h2>
                </div>
                <p className="text-slate-600">Tell us about your background and preferred language</p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2">
                    Your Experience Level *
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  </Label>
                  <Select value={formData.experience_level} onValueChange={(value) => handleInputChange('experience_level', value)}>
                    <SelectTrigger className={`mt-2 border-2 ${validationErrors.experience_level ? 'border-red-400' : 'border-slate-300'}`}>
                      <SelectValue placeholder="Select your technical/business experience" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((level) =>
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {validationErrors.experience_level && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.experience_level}
                    </p>
                  )}
                  <p className="text-sm text-slate-500 mt-2">This helps us tailor recommendations to your level</p>
                </div>

                <div>
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Report Language *
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  </Label>
                  <Select value={formData.report_language} onValueChange={(value) => handleInputChange('report_language', value)}>
                    <SelectTrigger className={`mt-2 border-2 ${validationErrors.report_language ? 'border-red-400' : 'border-slate-300'}`}>
                      <SelectValue placeholder="Choose your preferred language for the report" />
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
          }
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => prev - 1)}
          disabled={currentStep === 1}
          className="px-6 border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStep < 2 ?
          <Button
            onClick={handleNextStep}
            disabled={!canProceed(currentStep)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:bg-slate-400">
            Next Step
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button> :
          <Button
            onClick={handleSubmit}
            disabled={!canProceed(2) || isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white px-10 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:bg-slate-400">
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Start AI Analysis
              </>
            )}
          </Button>
        }
      </div>
    </div>
  );
}