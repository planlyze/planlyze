import React, { useState, useEffect } from "react";
import { auth, api, Analysis, Payment, User, AI, EmailTemplate } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Mail, Plus, Edit, Save, X, Send, Info } from "lucide-react";
import { toast } from "sonner";
import { hasPermission, PERMISSIONS } from "@/components/utils/permissions";

const defaultTemplates = [
  {
    template_key: "analysis_completed",
    name_en: "Analysis Completed",
    name_ar: "اكتمل التحليل",
    subject_en: "Your Analysis Report is Ready! 🎉",
    subject_ar: "تقرير التحليل الخاص بك جاهز! 🎉",
    body_en: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #7c3aed;">Analysis Complete!</h2>
  <p>Hi {{user_name}},</p>
  <p>Great news! Your business analysis report for "<strong>{{business_idea}}</strong>" is ready to view.</p>
  <a href="{{report_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">View Your Report</a>
  <p style="color: #64748b; font-size: 14px;">If you have any questions, feel free to reach out to our support team.</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. All rights reserved.</p>
</div>`,
    body_ar: `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #7c3aed;">اكتمل التحليل!</h2>
  <p>مرحباً {{user_name}}،</p>
  <p>أخبار رائعة! تقرير تحليل عملك لـ "<strong>{{business_idea}}</strong>" جاهز للعرض.</p>
  <a href="{{report_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">عرض تقريرك</a>
  <p style="color: #64748b; font-size: 14px;">إذا كان لديك أي أسئلة، لا تتردد في التواصل مع فريق الدعم لدينا.</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. جميع الحقوق محفوظة.</p>
</div>`,
    available_variables: ["user_name", "business_idea", "report_url"],
    is_active: true
  },
  {
    template_key: "credit_deducted",
    name_en: "Credit Deducted",
    name_ar: "تم خصم الرصيد",
    subject_en: "Premium Credit Used for Analysis",
    subject_ar: "تم استخدام رصيد متميز للتحليل",
    body_en: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #ea580c;">Credit Used</h2>
  <p>Hi {{user_name}},</p>
  <p>A premium credit has been deducted from your account for the analysis: "<strong>{{business_idea}}</strong>".</p>
  <p><strong>Credits Remaining:</strong> {{remaining_credits}}</p>
  <a href="{{credits_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #ea580c, #f97316); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Manage Credits</a>
  <p style="color: #64748b; font-size: 14px;">Thank you for using Planlyze premium features!</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. All rights reserved.</p>
</div>`,
    body_ar: `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #ea580c;">تم استخدام الرصيد</h2>
  <p>مرحباً {{user_name}}،</p>
  <p>تم خصم رصيد متميز من حسابك للتحليل: "<strong>{{business_idea}}</strong>".</p>
  <p><strong>الأرصدة المتبقية:</strong> {{remaining_credits}}</p>
  <a href="{{credits_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #ea580c, #f97316); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">إدارة الأرصدة</a>
  <p style="color: #64748b; font-size: 14px;">شكراً لاستخدامك ميزات Planlyze المتميزة!</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. جميع الحقوق محفوظة.</p>
</div>`,
    available_variables: ["user_name", "business_idea", "remaining_credits", "credits_url"],
    is_active: true
  },
  {
    template_key: "low_credits",
    name_en: "Low Credits Warning",
    name_ar: "تحذير رصيد منخفض",
    subject_en: "Running Low on Credits ⚠️",
    subject_ar: "رصيدك ينفد ⚠️",
    body_en: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #f59e0b;">Low Credits Alert</h2>
  <p>Hi {{user_name}},</p>
  <p>You're running low on premium credits! You currently have <strong>{{remaining_credits}}</strong> credit(s) left.</p>
  <p>Purchase more credits to continue creating premium analysis reports.</p>
  <a href="{{credits_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Buy More Credits</a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. All rights reserved.</p>
</div>`,
    body_ar: `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #f59e0b;">تنبيه رصيد منخفض</h2>
  <p>مرحباً {{user_name}}،</p>
  <p>رصيدك المتميز ينفد! لديك حالياً <strong>{{remaining_credits}}</strong> رصيد متبقي.</p>
  <p>اشترِ المزيد من الأرصدة لمواصلة إنشاء تقارير التحليل المتميزة.</p>
  <a href="{{credits_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">شراء المزيد من الأرصدة</a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. جميع الحقوق محفوظة.</p>
</div>`,
    available_variables: ["user_name", "remaining_credits", "credits_url"],
    is_active: true
  },
  {
    template_key: "shared_report_accessed",
    name_en: "Shared Report Accessed",
    name_ar: "تم الوصول إلى التقرير المشترك",
    subject_en: "Your Shared Report Was Viewed",
    subject_ar: "تم عرض تقريرك المشترك",
    body_en: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #7c3aed;">Report Activity</h2>
  <p>Hi {{user_name}},</p>
  <p>Someone just accessed your shared analysis report for "<strong>{{business_idea}}</strong>".</p>
  <p><strong>Accessed by:</strong> {{accessor_email}}<br>
  <strong>Date:</strong> {{access_date}}</p>
  <a href="{{report_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">View Report</a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. All rights reserved.</p>
  </div>`,
    body_ar: `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #7c3aed;">نشاط التقرير</h2>
  <p>مرحباً {{user_name}}،</p>
  <p>قام شخص ما بالوصول إلى تقرير التحليل المشترك الخاص بك لـ "<strong>{{business_idea}}</strong>".</p>
  <p><strong>تم الوصول بواسطة:</strong> {{accessor_email}}<br>
  <strong>التاريخ:</strong> {{access_date}}</p>
  <a href="{{report_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">عرض التقرير</a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. جميع الحقوق محفوظة.</p>
  </div>`,
    available_variables: ["user_name", "business_idea", "accessor_email", "access_date", "report_url"],
    is_active: true
  },
  {
    template_key: "payment_approved",
    name_en: "Payment Approved",
    name_ar: "تمت الموافقة على الدفع",
    subject_en: "Payment Approved - Credits Added! 🎉",
    subject_ar: "تمت الموافقة على الدفع - تمت إضافة الأرصدة! 🎉",
    body_en: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #16a34a;">Payment Approved!</h2>
  <p>Hi {{user_name}},</p>
  <p>Great news! Your payment has been approved and <strong>{{credits}} credits</strong> have been added to your account.</p>
  <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 0; color: #15803d;"><strong>Payment Details:</strong></p>
    <p style="margin: 8px 0 0 0; color: #166534;">Amount: {{amount}}<br>Credits Added: {{credits}}</p>
  </div>
  <p>You can now use your credits to create comprehensive business analysis reports.</p>
  <a href="{{credits_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #16a34a, #22c55e); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">View Credits</a>
  <p style="color: #64748b; font-size: 14px;">Thank you for your purchase!</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. All rights reserved.</p>
  </div>`,
    body_ar: `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #16a34a;">تمت الموافقة على الدفع!</h2>
  <p>مرحباً {{user_name}}،</p>
  <p>أخبار رائعة! تمت الموافقة على دفعتك وتمت إضافة <strong>{{credits}} رصيد</strong> إلى حسابك.</p>
  <div style="background: #f0fdf4; border-right: 4px solid #16a34a; padding: 12px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 0; color: #15803d;"><strong>تفاصيل الدفع:</strong></p>
    <p style="margin: 8px 0 0 0; color: #166534;">المبلغ: {{amount}}<br>الأرصدة المضافة: {{credits}}</p>
  </div>
  <p>يمكنك الآن استخدام أرصدتك لإنشاء تقارير تحليل عمل شاملة.</p>
  <a href="{{credits_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #16a34a, #22c55e); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">عرض الأرصدة</a>
  <p style="color: #64748b; font-size: 14px;">شكراً لشرائك!</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. جميع الحقوق محفوظة.</p>
  </div>`,
    available_variables: ["user_name", "credits", "amount", "credits_url"],
    is_active: true
  },
  {
    template_key: "payment_rejected",
    name_en: "Payment Rejected",
    name_ar: "تم رفض الدفع",
    subject_en: "Payment Status Update",
    subject_ar: "تحديث حالة الدفع",
    body_en: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
    <h2 style="color: #dc2626;">Payment Update</h2>
    <p>Hi {{user_name}},</p>
    <p>We regret to inform you that your recent payment request has not been approved.</p>
    <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> {{reason}}</p>
    </div>
    <p>If you believe this is an error or need assistance, please contact our support team.</p>
    <a href="{{credits_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Try Again</a>
    <p style="color: #64748b; font-size: 14px;">We're here to help if you have any questions.</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
    <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. All rights reserved.</p>
  </div>`,
    body_ar: `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
    <h2 style="color: #dc2626;">تحديث الدفع</h2>
    <p>مرحباً {{user_name}}،</p>
    <p>يؤسفنا إبلاغك بأن طلب الدفع الأخير الخاص بك لم تتم الموافقة عليه.</p>
    <div style="background: #fef2f2; border-right: 4px solid #dc2626; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #991b1b;"><strong>السبب:</strong> {{reason}}</p>
    </div>
    <p>إذا كنت تعتقد أن هذا خطأ أو تحتاج إلى المساعدة، يرجى الاتصال بفريق الدعم لدينا.</p>
    <a href="{{credits_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">حاول مرة أخرى</a>
    <p style="color: #64748b; font-size: 14px;">نحن هنا للمساعدة إذا كان لديك أي أسئلة.</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
    <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. جميع الحقوق محفوظة.</p>
  </div>`,
    available_variables: ["user_name", "reason", "credits_url"],
    is_active: true
  }
];

export default function EmailTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();
      setCurrentUser(user);
      
      if (!hasPermission(user, PERMISSIONS.VIEW_EMAIL_TEMPLATES)) {
        navigate(createPageUrl("Dashboard"));
        toast.error("Unauthorized access");
        return;
      }

      const existingTemplates = await EmailTemplate.list();
      
      if (existingTemplates.length === 0) {
        // Initialize default templates
        for (const template of defaultTemplates) {
          await EmailTemplate.create(template);
        }
        const newTemplates = await EmailTemplate.list();
        setTemplates(newTemplates);
      } else {
        setTemplates(existingTemplates);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (template) => {
    try {
      await EmailTemplate.update(template.id, template);
      toast.success("Template saved successfully");
      setEditingTemplate(null);
      loadData();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    }
  };

  const handleSendTest = async (template) => {
    if (!testEmail) {
      toast.error("Please enter a test email address");
      return;
    }

    setIsSending(true);
    try {
      const testVariables = {};
      template.available_variables?.forEach(v => {
        testVariables[v] = `[TEST_${v.toUpperCase()}]`;
      });

      const response = await api.post('sendTemplatedEmail', {
        userEmail: testEmail,
        templateKey: template.template_key,
        variables: testVariables,
        language: 'english'
      });

      if (response.data?.success) {
        toast.success("Test email sent successfully!");
      } else {
        toast.error("Failed to send test email");
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      toast.error("Failed to send test email");
    } finally {
      setIsSending(false);
    }
  };

  const isArabic = currentUser?.preferred_language === 'arabic';

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-purple-50/20 to-orange-50/10" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600">
              {isArabic ? "قوالب البريد الإلكتروني" : "Email Templates"}
            </h1>
            <p className="text-slate-600 mt-1">{isArabic ? "إدارة قوالب إشعارات البريد الإلكتروني" : "Manage email notification templates"}</p>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all bg-white">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{isArabic ? template.name_ar || template.name_en : template.name_en}</CardTitle>
                      <p className="text-sm text-slate-500">{template.template_key}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={template.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
                      {template.is_active ? (isArabic ? "نشط" : "Active") : (isArabic ? "غير نشط" : "Inactive")}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                      className="gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      {isArabic ? "تعديل" : "Edit"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">{isArabic ? "الموضوع (إنجليزي):" : "Subject (English):"}</p>
                    <p className="text-slate-600">{template.subject_en}</p>
                  </div>
                  {template.subject_ar && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">{isArabic ? "الموضوع (عربي):" : "Subject (Arabic):"}</p>
                      <p className="text-slate-600">{template.subject_ar}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-700">{isArabic ? "المتغيرات المتاحة:" : "Available Variables:"}</span>
                    {template.available_variables?.map((v) => (
                      <Badge key={v} variant="outline" className="text-xs">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isArabic ? "تعديل القالب" : "Edit Template"}</DialogTitle>
          </DialogHeader>
          
          {editingTemplate && (
            <Tabs defaultValue="english" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="english">English</TabsTrigger>
                <TabsTrigger value="arabic">Arabic</TabsTrigger>
              </TabsList>
              
              <TabsContent value="english" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Input
                    value={editingTemplate.subject_en}
                    onChange={(e) => setEditingTemplate({...editingTemplate, subject_en: e.target.value})}
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Body (HTML)</label>
                  <Textarea
                    value={editingTemplate.body_en}
                    onChange={(e) => setEditingTemplate({...editingTemplate, body_en: e.target.value})}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder="HTML email body"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="arabic" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject (Arabic)</label>
                  <Input
                    value={editingTemplate.subject_ar || ""}
                    onChange={(e) => setEditingTemplate({...editingTemplate, subject_ar: e.target.value})}
                    placeholder="Email subject in Arabic"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Body (HTML - Arabic)</label>
                  <Textarea
                    value={editingTemplate.body_ar || ""}
                    onChange={(e) => setEditingTemplate({...editingTemplate, body_ar: e.target.value})}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder="HTML email body in Arabic"
                    dir="rtl"
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="space-y-4 border-t pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">{isArabic ? "المتغيرات المتاحة:" : "Available Variables:"}</p>
                  <div className="flex flex-wrap gap-2">
                    {editingTemplate?.available_variables?.map((v) => (
                      <code key={v} className="bg-blue-100 px-2 py-1 rounded text-xs">{`{{${v}}}`}</code>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="email"
                placeholder={isArabic ? "أدخل البريد الإلكتروني للاختبار" : "Enter test email"}
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => handleSendTest(editingTemplate)}
                disabled={isSending}
                variant="outline"
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                {isSending ? (isArabic ? "جارٍ الإرسال..." : "Sending...") : (isArabic ? "إرسال اختبار" : "Send Test")}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={() => handleSave(editingTemplate)} className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Save className="w-4 h-4" />
              {isArabic ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}