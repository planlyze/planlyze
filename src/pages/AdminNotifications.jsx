import React, { useState, useEffect } from "react";
import { auth, api, User, Role, Notification } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, Users, User as UserIcon, Shield } from "lucide-react";
import { toast } from "sonner";
import { hasPermission, PERMISSIONS } from "@/components/utils/permissions";

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [recipientType, setRecipientType] = useState("all");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();
      setCurrentUser(user);
      
      if (!hasPermission(user, PERMISSIONS.MANAGE_NOTIFICATIONS)) {
        navigate(createPageUrl("Dashboard"));
        toast.error("Unauthorized access");
        return;
      }

      const [allUsers, allRoles] = await Promise.all([
        User.list(),
        Role.list()
      ]);
      setUsers(Array.isArray(allUsers) ? allUsers : []);
      setRoles(Array.isArray(allRoles) ? allRoles : []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const getRecipients = () => {
    if (recipientType === "all") {
      return users.map(u => u.email);
    } else if (recipientType === "specific") {
      return selectedUser ? [selectedUser] : [];
    } else if (recipientType === "role") {
      const filteredUsers = users.filter(u => u.role_id === selectedRole);
      return filteredUsers.map(u => u.email);
    }
    return [];
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

    if (recipientType === "role" && !selectedRole) {
      toast.error("Please select a role");
      return;
    }

    const recipients = getRecipients();
    if (recipients.length === 0) {
      toast.error("No recipients found");
      return;
    }

    setIsSending(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const email of recipients) {
        try {
          await Notification.create({
            user_email: email,
            type: "system",
            title: subject,
            message: message,
            is_read: false
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
        setSelectedRole("");
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

  const isArabic = currentUser?.language === 'arabic';

  const getUsersByRole = (roleId) => {
    return users.filter(u => u.role_id === roleId).length;
  };

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
              <Select value={recipientType} onValueChange={(value) => {
                setRecipientType(value);
                setSelectedUser("");
                setSelectedRole("");
              }}>
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
                  <SelectItem value="role">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      {isArabic ? "حسب الدور" : "By Role"}
                    </div>
                  </SelectItem>
                  <SelectItem value="specific">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      {isArabic ? "مستخدم محدد" : "Specific User"}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recipientType === "role" && (
              <div>
                <label className="text-sm font-medium mb-2 block">{isArabic ? "اختر الدور" : "Select Role"}</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={isArabic ? "اختر دور..." : "Select a role..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{role.name}</span>
                          <span className="text-xs text-slate-500 ml-2">({getUsersByRole(role.id)} {isArabic ? "مستخدم" : "users"})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRole && (
                  <p className="text-sm text-slate-500 mt-2">
                    {isArabic ? `سيتم إرسال الإشعار إلى ${getUsersByRole(selectedRole)} مستخدم` : `Will send to ${getUsersByRole(selectedRole)} users with this role`}
                  </p>
                )}
              </div>
            )}

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
                        {user.full_name || user.email} ({user.email})
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
              disabled={isSending || isLoading}
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
