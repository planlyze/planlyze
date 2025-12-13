import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function AIAssistantQuickAction({ isArabic = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-orange-500 border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                <Bot className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-white">
                  {isArabic ? 'المساعد الذكي' : 'AI Assistant'}
                </h3>
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              </div>
              <p className="text-white/90 text-sm mb-4 leading-relaxed">
                {isArabic 
                  ? 'احصل على رؤى مدعومة بالذكاء الاصطناعي، وتحديد المخاطر، واستراتيجيات التحسين لتحليلاتك'
                  : 'Get AI-powered insights, risk identification, and optimization strategies for your analyses'}
              </p>
              <Link to={createPageUrl("AIAssistant")}>
                <Button 
                  className="bg-white hover:bg-white/90 text-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {isArabic ? 'ابدأ المحادثة' : 'Start Chat'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}