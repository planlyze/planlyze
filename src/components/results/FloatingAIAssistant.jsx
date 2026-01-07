import React, { useState, useEffect, useRef } from "react";
import { auth, api, Analysis, Payment, User, AI, ChatConversation } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, X, Sparkles, Send, Trash2, RefreshCw, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const MAX_REGENERATIONS = 3;

export default function FloatingAIAssistant({ analysis, isArabic = false, isReportArabic = false, onRegenerate, isLocked = false, onUnlock }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationCount, setRegenerationCount] = useState(analysis?.regeneration_count || 0);
  const messagesEndRef = useRef(null);

  const canRegenerate = regenerationCount < MAX_REGENERATIONS;

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      if (text.length > 0 && text.length < 1000) {
        setSelectedText(text);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeChat = () => {
    const welcomeMsg = {
      role: 'assistant',
      content: isArabic 
        ? `مرحباً! أنا مساعدك الذكي لهذا التقرير. يمكنني مساعدتك في:\n\n✨ شرح أي قسم من التقرير\n📊 الإجابة على أسئلة محددة\n💡 تقديم رؤى إضافية\n🎯 توضيح المصطلحات والمفاهيم\n\nحدد أي نص من التقرير واسألني عنه!`
        : `Hello! I'm your AI assistant for this report. I can help you:\n\n✨ Explain any section of the report\n📊 Answer specific questions\n💡 Provide additional insights\n🎯 Clarify terms and concepts\n\nSelect any text from the report and ask me about it!`,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMsg]);
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
      const contextData = {
        business_idea: analysis.business_idea,
        industry: analysis.industry,
        country: analysis.country,
        report_sections: {
          problem_solution: analysis.step1_problem_solution,
          target_audience: analysis.step2_target_audience,
          market_opportunity: analysis.step3_market_opportunity,
          market_size: analysis.step4_market_size,
          competition: analysis.step6_competition,
          goto_market: analysis.step7_goto_market_revenue,
          tech_stack: analysis.step8_tech_stack_suggestions,
          technical: analysis.step8_technical_implementation,
          development_plan: analysis.step9_development_plan,
          financials: analysis.step10_financials_risks_swot
        }
      };

      const selectedContext = selectedText ? `\n\nUser selected this text from the report:\n"${selectedText}"\n` : '';

      const systemPrompt = `You are an expert business analysis assistant helping the user understand their specific report. Provide clear, detailed explanations.${selectedContext}

Report Data:
${JSON.stringify(contextData, null, 2)}

When answering:
- Be specific and reference exact sections from the report
- Provide actionable insights and clarifications
- If the user selected text, focus on explaining that specific part
- Use clear structure with markdown formatting
- Be encouraging and constructive`;

      const response = await AI.invoke(
        `${systemPrompt}\n\nUser Question: ${userMessage.content}`,
        null,
        2048
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.response || response,
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      await saveConversation(finalMessages);
      setSelectedText(""); // Clear selection after sending
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        role: 'assistant',
        content: isArabic 
          ? "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى."
          : "Sorry, there was an error. Please try again.",
        timestamp: new Date()
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
    } finally {
      setIsSending(false);
    }
  };

  const saveConversation = async (updatedMessages) => {
    try {
      const user = await auth.me();
      const title = `Report Chat: ${analysis.business_idea.substring(0, 40)}...`;
      
      if (conversationId) {
        await ChatConversation.update(conversationId, {
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: typeof m.timestamp === 'string' ? m.timestamp : m.timestamp.toISOString()
          })),
          analysis_ids: [analysis.id]
        });
      } else {
        const newConv = await ChatConversation.create({
          user_email: user.email,
          title,
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: typeof m.timestamp === 'string' ? m.timestamp : m.timestamp.toISOString()
          })),
          analysis_ids: [analysis.id]
        });
        setConversationId(newConv.id);
      }
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
    initializeChat();
  };

  const handleRegenerate = async () => {
    if (!canRegenerate || isRegenerating) return;

    const chatContext = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n');

    if (!chatContext.trim()) {
      toast.error(isArabic ? 'لا توجد محادثة لاستخدامها في إعادة التوليد' : 'No chat history to use for regeneration');
      return;
    }

    setIsRegenerating(true);

    try {
      await api.post('/ai/regenerate-report', {
        analysis_id: analysis.id,
        chat_context: chatContext
      });

      const newCount = regenerationCount + 1;
      await Analysis.update(analysis.id, { regeneration_count: newCount });
      setRegenerationCount(newCount);

      toast.success(isArabic ? 'بدأت إعادة توليد التقرير! جارٍ إعادة التحميل...' : 'Report regeneration started! Reloading...');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error regenerating report:", error);
      toast.error(isArabic ? 'فشل في إعادة توليد التقرير' : 'Failed to regenerate report');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className={`w-16 h-16 rounded-full ${isLocked ? 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700' : 'bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700'} text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 relative`}
            >
              {isLocked ? <Lock className="w-7 h-7" /> : <Bot className="w-7 h-7" />}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && isLocked && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="glass-effect border-2 border-slate-300 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-slate-500 to-slate-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    <CardTitle className="text-lg">
                      {isArabic ? 'المساعد الذكي' : 'AI Assistant'}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-white/20 text-white h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 text-center">
                <div className="py-8">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-orange-100 rounded-full flex items-center justify-center">
                    <Lock className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    {isArabic ? 'ميزة متميزة' : 'Premium Feature'}
                  </h3>
                  <p className="text-slate-600 mb-6">
                    {isArabic 
                      ? 'قم بالترقية إلى التقرير المتميز للوصول إلى المساعد الذكي الذي يمكنه الإجابة على أسئلتك وتقديم رؤى إضافية.'
                      : 'Upgrade to Premium to access the AI Assistant that can answer your questions and provide additional insights.'}
                  </p>
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      if (onUnlock) onUnlock();
                    }}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isArabic ? 'ترقية الآن' : 'Upgrade Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window - Unlocked */}
      <AnimatePresence>
        {isOpen && !isLocked && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="glass-effect border-2 border-purple-300 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-orange-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    <CardTitle className="text-lg">
                      {isArabic ? 'المساعد الذكي' : 'AI Assistant'}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearChat}
                      className="hover:bg-white/20 text-white h-8 w-8"
                      title={isArabic ? 'مسح المحادثة' : 'Clear chat'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="hover:bg-white/20 text-white h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {selectedText && (
                  <Badge className="bg-white/20 text-white text-xs mt-2 truncate max-w-full">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {isArabic ? 'نص محدد' : 'Text selected'}
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="p-0">
                {/* Messages */}
                <div className="h-[400px] overflow-y-auto p-4 space-y-3">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-purple-600 to-orange-600 rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                          <div className={`rounded-lg p-3 text-sm ${
                            message.role === 'user' 
                              ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white' 
                              : 'bg-white border border-slate-200'
                          }`}>
                            {message.role === 'assistant' ? (
                              <div className="prose prose-sm max-w-none">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <p>{message.content}</p>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 px-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {isSending && (
                    <div className="flex gap-2 justify-start">
                      <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-purple-600 to-orange-600 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Regenerate Button */}
                <div className="px-3 pt-3 border-t border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleRegenerate}
                        disabled={!canRegenerate || isRegenerating || messages.length <= 1}
                        className={`gap-2 text-sm ${canRegenerate ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : 'bg-slate-300'} text-white`}
                        size="sm"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                        {isRegenerating 
                          ? (isArabic ? 'جارٍ إعادة التوليد...' : 'Regenerating...') 
                          : (isArabic ? 'إعادة توليد التقرير' : 'Regenerate Report')}
                      </Button>
                    </div>
                    <Badge variant="outline" className={`text-xs ${canRegenerate ? 'text-amber-600 border-amber-300' : 'text-slate-400 border-slate-300'}`}>
                      {regenerationCount}/{MAX_REGENERATIONS} {isArabic ? 'مستخدم' : 'used'}
                    </Badge>
                  </div>
                  {!canRegenerate && (
                    <p className="text-xs text-slate-500 mb-2">
                      {isArabic ? 'وصلت للحد الأقصى من إعادة التوليد' : 'Maximum regenerations reached'}
                    </p>
                  )}
                </div>

                {/* Input */}
                <div className="p-3 bg-slate-50">
                  {selectedText && (
                    <div className="mb-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs relative">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-purple-700 font-semibold">
                          {isArabic ? 'نص محدد:' : 'Selected:'}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedText("")}
                          className="h-5 w-5 p-0 hover:bg-purple-200 text-purple-600"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-slate-600 line-clamp-2">{selectedText}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={isArabic ? "اسأل عن التقرير..." : "Ask about the report..."}
                      className="flex-1 min-h-[60px] text-sm resize-none border-slate-300"
                      disabled={isSending}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isSending}
                      className="self-end bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white h-[60px] px-4"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}