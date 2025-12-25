import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { FileDown, CheckCircle2, Loader2, FileText, BarChart3, PieChart, Table2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  { id: "prepare", icon: FileText, labelEn: "Preparing report data", labelAr: "جارٍ تحضير بيانات التقرير" },
  { id: "sections", icon: Table2, labelEn: "Loading all sections", labelAr: "جارٍ تحميل جميع الأقسام" },
  { id: "charts", icon: BarChart3, labelEn: "Capturing visual charts", labelAr: "جارٍ التقاط المخططات المرئية" },
  { id: "generate", icon: PieChart, labelEn: "Generating PDF document", labelAr: "جارٍ إنشاء مستند PDF" },
  { id: "save", icon: FileDown, labelEn: "Saving file", labelAr: "جارٍ الحفظ" },
  { id: "done", icon: CheckCircle2, labelEn: "Download complete!", labelAr: "تم التنزيل!" },
];

export default function PDFExportModal({ isOpen, progress, currentStep, isArabic = false }) {
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" dir={isArabic ? "rtl" : "ltr"}>
        <div className="flex flex-col items-center py-6">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              {currentStep === "done" ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <FileDown className="w-10 h-10 text-white" />
                </motion.div>
              )}
            </div>
            {currentStep !== "done" && (
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-indigo-300 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {isArabic ? "تصدير التقرير" : "Exporting Report"}
          </h3>
          
          <p className="text-sm text-slate-500 mb-6 text-center">
            {isArabic 
              ? "جارٍ إنشاء ملف PDF مع جميع المخططات والتحليلات" 
              : "Creating PDF with all charts and analysis data"}
          </p>

          <div className="w-full px-4 mb-6">
            <Progress value={progress} className="h-3 bg-slate-100" />
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>{Math.round(progress)}%</span>
              <span>{isArabic ? "مكتمل" : "Complete"}</span>
            </div>
          </div>

          <div className="w-full space-y-2 px-2">
            <AnimatePresence>
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const isActive = step.id === currentStep;
                const isComplete = idx < currentStepIndex;
                const isPending = idx > currentStepIndex;
                
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isActive 
                        ? "bg-indigo-50 border border-indigo-200" 
                        : isComplete 
                          ? "bg-green-50" 
                          : "bg-slate-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive 
                        ? "bg-indigo-500 text-white" 
                        : isComplete 
                          ? "bg-green-500 text-white" 
                          : "bg-slate-200 text-slate-400"
                    }`}>
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isActive ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <StepIcon className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`text-sm ${
                      isActive 
                        ? "text-indigo-700 font-medium" 
                        : isComplete 
                          ? "text-green-700" 
                          : "text-slate-400"
                    }`}>
                      {isArabic ? step.labelAr : step.labelEn}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {currentStep === "done" && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-green-600 font-medium text-center"
            >
              {isArabic ? "تم تنزيل ملف PDF بنجاح!" : "PDF downloaded successfully!"}
            </motion.p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
