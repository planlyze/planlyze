import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, Users, User } from "lucide-react";
import { toast } from "sonner";

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [recipientType, setRecipientType] = useState("all");
  const [selectedUser, setSelectedUser] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      if (user.role !== 'admin') {
        navigate(createPageUrl("Dashboard"));
        toast.error("Unauthorized access");
        return;
      }

      const allUsers = await base44.asServiceRole.entities.User.filter({});
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleSend = async () => {
    if (!subject || !message) {
      toast.error("Subject and message are required");
      return;
    }

    if (recipientType === "specific" && !selectedUser) {
      toast.error("Please select a user");
      return;
    }

    setIsSending(true);
    try {
      const recipients = recipientType === "all" 
        ? users.map(u => u.email)
        : [selectedUser];

      let successCount = 0;
      let failCount = 0;

      for (const email of recipients) {
        try {
          // Send in-app notification
          await base44.asServiceRole.entities.Notification.create({
            user_email: email,
            type: "system",
            title: subject,
            message: message,
            is_read: false
          });

          // Send email notification
          const userObj = users.find(u => u.email === email);
          await base44.functions.invoke('sendTemplatedEmail', {
            userEmail: email,
            templateKey: "admin_custom",
            variables: {
              user_name: userObj?.display_name || userObj?.full_name || email.split('@')[0],
              subject: subject,
              message: message
            },
            language: userObj?.preferred_language || 'english'
          });

          successCount++;
        } catch (error) {
          console.error(`Failed to send to ${email}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Notifications sent to ${successCount} user(s)`);
        setSubject("");
        setMessage("");
        setSelectedUser("");
      }
      
      if (failCount > 0) {
        toast.error(`Failed to send to ${failCount} user(s)`);
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast.error("Failed to send notifications");
    } finally {
      setIsSending(false);
    }
  };

  const isArabic = currentUser?.preferred_language === 'arabic';

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-purple-50/20 to-orange-50/10" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto space-y-8">
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
              {isArabic ? "إرسال إشعارات" : "Send Notifications"}
            </h1>
            <p className="text-slate-600 mt-1">{isArabic ? "إرسال إشعارات مخصصة للمستخدمين" : "Send custom notifications to users"}</p>
          </div>
        </div>

        <Card className="border-2 border-slate-200 shadow-lg bg-white">
          <CardHeader>
            <CardTitle>{isArabic ? "إنشاء إشعار" : "Create Notification"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">{isArabic ? "المستلمون" : "Recipients"}</label>
              <Select value={recipientType} onValueChange={setRecipientType}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {isArabic ? "جميع المستخدمين" : "All Users"} ({users.length})
                    </div>
                  </SelectItem>
                  <SelectItem value="specific">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {isArabic ? "مستخدم محدد" : "Specific User"}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recipientType === "specific" && (
              <div>
                <label className="text-sm font-medium mb-2 block">{isArabic ? "اختر المستخدم" : "Select User"}</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={isArabic ? "اختر مستخدم..." : "Select a user..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.email} value={user.email}>
                        {user.display_name || user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">{isArabic ? "الموضوع" : "Subject"}</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={isArabic ? "أدخل موضوع الإشعار..." : "Enter notification subject..."}
                className="h-12"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{isArabic ? "الرسالة" : "Message"}</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isArabic ? "أدخل رسالة الإشعار..." : "Enter notification message..."}
                rows={8}
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={isSending}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2"
            >
              <Send className="w-5 h-5" />
              {isSending ? (isArabic ? "جارٍ الإرسال..." : "Sending...") : (isArabic ? "إرسال الإشعار" : "Send Notification")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}