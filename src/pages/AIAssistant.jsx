import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Analysis } from "@/entities/Analysis";
import { ChatConversation } from "@/entities/ChatConversation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Bot, User as UserIcon, Sparkles, TrendingUp, AlertTriangle, Lightbulb, FileText, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function AIAssistant() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const messagesEndRef = useRef(null);
  const isArabic = currentUser?.preferred_language === 'arabic';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const userAnalyses = await Analysis.filter({ created_by: user.email }, "-created_date");
      const activeAnalyses = userAnalyses.filter(a => a.status === 'completed' && a.is_deleted !== true && a.is_premium === true);
      setAnalyses(activeAnalyses);

      // Load chat history
      const userConversations = await ChatConversation.filter({ user_email: user.email }, "-updated_date");
      setConversations(userConversations);

      // Welcome message only if there are premium reports
      if (activeAnalyses.length > 0) {
        setMessages([{
          role: 'assistant',
          content: user.preferred_language === 'arabic'
            ? `مرحباً! أنا مساعدك الذكي لتحليل الأعمال المتميزة. لدي إمكانية الوصول إلى ${activeAnalyses.length} تحليل(ات) متميزة مكتملة. يمكنني مساعدتك في:\n\n✨ فهم تقارير التحليل المتميزة\n📊 الإجابة على أسئلة حول بياناتك\n🎯 اقتراح استراتيجيات التحسين\n⚠️ تحديد المخاطر والفرص\n\nكيف يمكنني مساعدتك اليوم؟`
            : `Hello! I'm your AI business analysis assistant for premium reports. I have access to ${activeAnalyses.length} completed premium analysis report(s). I can help you:\n\n✨ Understand your premium analysis reports\n📊 Answer specific questions about your data\n🎯 Suggest optimization strategies\n⚠️ Identify potential risks and opportunities\n\nHow can I help you today?`,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      await base44.auth.redirectToLogin(window.location.href);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConversation = async (updatedMessages) => {
    try {
      const analysisIds = analyses.map(a => a.id);
      const title = updatedMessages.find(m => m.role === 'user')?.content.substring(0, 50) || 'New Conversation';
      
      if (currentConversationId) {
        await ChatConversation.update(currentConversationId, {
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: typeof m.timestamp === 'string' ? m.timestamp : m.timestamp.toISOString()
          })),
          analysis_ids: analysisIds
        });
      } else {
        const newConv = await ChatConversation.create({
          user_email: currentUser.email,
          title,
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: typeof m.timestamp === 'string' ? m.timestamp : m.timestamp.toISOString()
          })),
          analysis_ids: analysisIds
        });
        setCurrentConversationId(newConv.id);
      }
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsSending(true);

    try {
      // Build context from analyses
      const contextData = analyses.map(analysis => ({
        business_idea: analysis.business_idea,
        industry: analysis.industry,
        country: analysis.country,
        status: analysis.status,
        is_premium: analysis.is_premium,
        created_date: analysis.created_date,
        summary: {
          problem_solution: analysis.step1_problem_solution,
          target_audience: analysis.step2_target_audience,
          market_opportunity: analysis.step3_market_opportunity,
          competition: analysis.step6_competition,
          goto_market: analysis.step7_goto_market_revenue,
          technical: analysis.step8_technical_implementation,
          financials: analysis.step10_financials_risks_swot
        }
      }));

      const systemPrompt = `You are an expert business analysis assistant. You have access to the user's completed business analysis reports. Provide insightful, actionable advice based on their data. Be concise but thorough. If asked about specific analyses, reference them by business idea name. Proactively identify risks and opportunities when relevant.

User's Analyses:
${JSON.stringify(contextData, null, 2)}

When answering:
- Reference specific analyses by their business idea
- Provide concrete, actionable recommendations
- Highlight both opportunities and risks
- Use data from the reports to support your answers
- Be encouraging but realistic
- Format responses with clear structure using markdown`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nUser Question: ${userMessage.content}`,
        add_context_from_internet: false
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.response || response,
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      await saveConversation(finalMessages);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        role: 'assistant',
        content: isArabic 
          ? "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى."
          : "Sorry, there was an error processing your request. Please try again.",
        timestamp: new Date()
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      await saveConversation(finalMessages);
    } finally {
      setIsSending(false);
    }
  };

  const loadConversation = (conv) => {
    setCurrentConversationId(conv.id);
    setMessages(conv.messages.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp)
    })));
    setShowHistoryDialog(false);
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    const welcomeMsg = {
      role: 'assistant',
      content: isArabic 
        ? `مرحباً! أنا مساعدك الذكي لتحليل الأعمال المتميزة. لدي إمكانية الوصول إلى ${analyses.length} تحليل(ات) متميزة مكتملة. يمكنني مساعدتك في:\n\n✨ فهم تقارير التحليل المتميزة\n📊 الإجابة على أسئلة حول بياناتك\n🎯 اقتراح استراتيجيات التحسين\n⚠️ تحديد المخاطر والفرص\n\nكيف يمكنني مساعدتك اليوم؟`
        : `Hello! I'm your AI business analysis assistant for premium reports. I have access to ${analyses.length} completed premium analysis report(s). I can help you:\n\n✨ Understand your premium analysis reports\n📊 Answer specific questions about your data\n🎯 Suggest optimization strategies\n⚠️ Identify potential risks and opportunities\n\nHow can I help you today?`,
      timestamp: new Date()
    };
    setMessages([welcomeMsg]);
    setShowHistoryDialog(false);
  };

  const deleteConversation = async (convId) => {
    try {
      await ChatConversation.delete(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (currentConversationId === convId) {
        startNewConversation();
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const suggestedQuestions = [
    {
      icon: TrendingUp,
      question: isArabic ? "ما هي أفضل فرص النمو في تحليلاتي؟" : "What are the best growth opportunities in my analyses?",
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      icon: AlertTriangle,
      question: isArabic ? "ما هي المخاطر الرئيسية التي يجب أن أكون على دراية بها؟" : "What are the key risks I should be aware of?",
      color: "text-orange-600",
      bg: "bg-orange-50"
    },
    {
      icon: Lightbulb,
      question: isArabic ? "كيف يمكنني تحسين استراتيجية التسويق؟" : "How can I improve my go-to-market strategy?",
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      icon: FileText,
      question: isArabic ? "قارن بين تحليلاتي المختلفة" : "Compare my different analyses",
      color: "text-blue-600",
      bg: "bg-blue-50"
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Show upgrade prompt if no premium reports
  if (analyses.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-orange-50/20 p-4 md:p-8" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="shadow-sm border-2 border-purple-300 hover:bg-purple-50"
            >
              <ArrowLeft className="w-4 h-4 text-purple-600" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                {isArabic ? 'المساعد الذكي' : 'AI Assistant'}
              </h1>
            </div>
          </div>

          <Card className="glass-effect border-2 border-purple-200 shadow-2xl">
            <CardContent className="p-12 text-center space-y-6">
              <div className="inline-flex p-6 bg-gradient-to-br from-purple-100 to-orange-100 rounded-full">
                <Bot className="w-16 h-16 text-purple-600" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-slate-800">
                  {isArabic ? 'المساعد الذكي متاح للتقارير المتميزة فقط' : 'AI Assistant is Available for Premium Reports Only'}
                </h2>
                <p className="text-slate-600 max-w-2xl mx-auto">
                  {isArabic 
                    ? 'لاستخدام المساعد الذكي، تحتاج إلى تقرير تحليل متميز مكتمل واحد على الأقل. قم بإنشاء تقرير متميز للوصول إلى هذه الميزة القوية.'
                    : 'To use the AI Assistant, you need at least one completed premium analysis report. Create a premium report to access this powerful feature.'
                  }
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => navigate(createPageUrl("NewAnalysis"))}
                  className="bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white shadow-lg px-8"
                >
                  <Sparkles className={`w-5 h-5 ${isArabic ? 'ml-2' : 'mr-2'}`} />
                  {isArabic ? 'إنشاء تحليل متميز' : 'Create Premium Analysis'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl("Credits"))}
                  className="border-2 border-purple-300 hover:bg-purple-50"
                >
                  {isArabic ? 'شراء أرصدة' : 'Buy Credits'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-orange-50/20 p-4 md:p-8" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="shadow-sm border-2 border-purple-300 hover:bg-purple-50"
          >
            <ArrowLeft className="w-4 h-4 text-purple-600" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-orange-600 rounded-xl shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                  {isArabic ? 'المساعد الذكي' : 'AI Assistant'}
                </h1>
                <p className="text-slate-600 font-medium">
                  {isArabic ? 'مساعدك الشخصي لتحليل الأعمال' : 'Your personal business analysis advisor'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowHistoryDialog(true)}
              className="border-2 border-purple-300 hover:bg-purple-50"
            >
              <MessageSquare className={`w-4 h-4 ${isArabic ? 'ml-2' : 'mr-2'}`} />
              {isArabic ? 'السجل' : 'History'}
            </Button>
            <Button
              onClick={startNewConversation}
              className="bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white"
            >
              <Plus className={`w-4 h-4 ${isArabic ? 'ml-2' : 'mr-2'}`} />
              {isArabic ? 'محادثة جديدة' : 'New Chat'}
            </Button>
            <Badge className="bg-gradient-to-r from-purple-600 to-orange-600 text-white shadow-lg px-4 py-2">
              <Sparkles className={`w-4 h-4 ${isArabic ? 'ml-1' : 'mr-1'}`} />
              {analyses.length} {isArabic ? 'تحليلات متميزة' : 'Premium Analyses'}
            </Badge>
          </div>
        </div>

        {/* Chat Container */}
        <Card className="glass-effect border-2 border-purple-200 shadow-2xl">
          <CardContent className="p-0">
            {/* Messages Area */}
            <div className="h-[600px] overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                      <div className={`rounded-2xl p-4 shadow-md ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white' 
                          : 'bg-white border-2 border-slate-200'
                      }`}>
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-white">{message.content}</p>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 px-2">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center shadow-lg order-2">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                    )}
                    </motion.div>
                    ))}
                    </AnimatePresence>
                    {isSending && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-md">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {messages.length === 1 && (
              <div className="px-6 pb-4 border-t-2 border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">
                  {isArabic ? 'أسئلة مقترحة:' : 'Suggested questions:'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {suggestedQuestions.map((sq, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(sq.question)}
                      className={`text-left p-3 ${sq.bg} border-2 border-transparent hover:border-purple-300 rounded-xl transition-all duration-300 hover:shadow-md group`}
                    >
                      <div className="flex items-center gap-2">
                        <sq.icon className={`w-4 h-4 ${sq.color} group-hover:scale-110 transition-transform`} />
                        <span className="text-sm font-medium text-slate-700">{sq.question}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-6 border-t-2 border-slate-200 bg-gradient-to-r from-purple-50/50 to-orange-50/50">
              <div className="flex gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={isArabic ? "اكتب سؤالك هنا..." : "Type your question here..."}
                  className="flex-1 min-h-[80px] resize-none border-2 border-slate-300 focus:border-purple-400 rounded-xl"
                  disabled={isSending}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isSending}
                  className="self-end bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-[80px] px-8"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {isArabic ? 'اضغط Enter للإرسال، Shift+Enter لسطر جديد' : 'Press Enter to send, Shift+Enter for new line'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Chat History Dialog */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {isArabic ? 'سجل المحادثات' : 'Chat History'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  {isArabic ? 'لا توجد محادثات سابقة' : 'No previous conversations'}
                </div>
              ) : (
                conversations.map((conv) => (
                  <Card 
                    key={conv.id} 
                    className={`cursor-pointer hover:shadow-md transition-all ${currentConversationId === conv.id ? 'border-2 border-purple-500' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0" onClick={() => loadConversation(conv)}>
                          <h4 className="font-semibold text-slate-800 truncate mb-1">
                            {conv.title}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {new Date(conv.updated_date).toLocaleDateString()} • {conv.messages.length} {isArabic ? 'رسائل' : 'messages'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}