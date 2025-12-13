import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Link2, Copy, Check, Globe, Lock, Users, Trash2, 
  Calendar, Eye, Mail, Plus, X, Share2, Clock
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const ReportShare = base44.entities.ReportShare;

export default function ShareReportModal({ 
  isOpen, 
  onClose, 
  analysisId, 
  analysisTitle,
  ownerEmail,
  isArabic = false 
}) {
  const [shares, setShares] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  
  // New share settings
  const [isPublic, setIsPublic] = useState(true);
  const [permission, setPermission] = useState("view");
  const [expiresIn, setExpiresIn] = useState("never");
  const [allowedEmails, setAllowedEmails] = useState([]);

  const t = (en, ar) => isArabic ? ar : en;

  useEffect(() => {
    if (isOpen && analysisId) {
      loadShares();
    }
  }, [isOpen, analysisId]);

  const loadShares = async () => {
    setIsLoading(true);
    try {
      const data = await ReportShare.filter({ analysis_id: analysisId, owner_email: ownerEmail });
      setShares(data.filter(s => s.is_active));
    } catch (error) {
      console.error("Error loading shares:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const createShareLink = async () => {
    try {
      const token = generateToken();
      let expiresAt = null;
      
      if (expiresIn !== "never") {
        const now = new Date();
        switch (expiresIn) {
          case "1day": expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); break;
          case "7days": expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); break;
          case "30days": expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); break;
        }
      }

      await ReportShare.create({
        analysis_id: analysisId,
        owner_email: ownerEmail,
        share_token: token,
        permission,
        is_public: isPublic,
        is_active: true,
        expires_at: expiresAt?.toISOString(),
        allowed_emails: isPublic ? [] : allowedEmails,
        access_count: 0
      });

      toast.success(t("Share link created!", "تم إنشاء رابط المشاركة!"));
      loadShares();
      setAllowedEmails([]);
    } catch (error) {
      console.error("Error creating share:", error);
      toast.error(t("Failed to create share link", "فشل إنشاء رابط المشاركة"));
    }
  };

  const deleteShare = async (shareId) => {
    try {
      await ReportShare.update(shareId, { is_active: false });
      toast.success(t("Share link deleted", "تم حذف رابط المشاركة"));
      loadShares();
    } catch (error) {
      console.error("Error deleting share:", error);
      toast.error(t("Failed to delete share link", "فشل حذف رابط المشاركة"));
    }
  };

  const getShareUrl = (token) => {
    return `${window.location.origin}/SharedReport?token=${token}`;
  };

  const copyToClipboard = async (token) => {
    try {
      await navigator.clipboard.writeText(getShareUrl(token));
      setCopied(true);
      toast.success(t("Link copied to clipboard!", "تم نسخ الرابط!"));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t("Failed to copy link", "فشل نسخ الرابط"));
    }
  };

  const addEmail = () => {
    if (newEmail && !allowedEmails.includes(newEmail)) {
      setAllowedEmails([...allowedEmails, newEmail]);
      setNewEmail("");
    }
  };

  const removeEmail = (email) => {
    setAllowedEmails(allowedEmails.filter(e => e !== email));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-600" />
            {t("Share Report", "مشاركة التقرير")}
          </DialogTitle>
          <p className="text-sm text-slate-500 truncate">{analysisTitle}</p>
        </DialogHeader>

        <Tabs defaultValue="create" className="mt-4 [&_[data-state=inactive]]:text-slate-400 [&_[data-state=inactive]]:bg-slate-100">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t("Create Link", "إنشاء رابط")}
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              {t("Manage Links", "إدارة الروابط")}
              {shares.length > 0 && (
                <Badge variant="secondary" className="ml-1">{shares.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            {/* Access Type */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="w-5 h-5 text-green-600" />
                ) : (
                  <Lock className="w-5 h-5 text-orange-600" />
                )}
                <div>
                  <p className="font-medium text-slate-800">
                    {isPublic ? t("Public Link", "رابط عام") : t("Restricted Access", "وصول مقيد")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isPublic 
                      ? t("Anyone with the link can access", "أي شخص لديه الرابط يمكنه الوصول")
                      : t("Only specific emails can access", "فقط الإيميلات المحددة يمكنها الوصول")
                    }
                  </p>
                </div>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            {/* Restricted Emails */}
            {!isPublic && (
              <div className="space-y-2">
                <Label>{t("Allowed Emails", "الإيميلات المسموحة")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addEmail()}
                  />
                  <Button onClick={addEmail} size="icon" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {allowedEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allowedEmails.map((email) => (
                      <Badge key={email} variant="secondary" className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {email}
                        <button onClick={() => removeEmail(email)} className="ml-1 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Permission Level */}
            <div className="space-y-2">
              <Label>{t("Permission", "الصلاحية")}</Label>
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      {t("View Only", "عرض فقط")}
                    </div>
                  </SelectItem>
                  <SelectItem value="comment">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {t("Can Comment", "يمكنه التعليق")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label>{t("Link Expiration", "انتهاء صلاحية الرابط")}</Label>
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">{t("Never expires", "لا تنتهي")}</SelectItem>
                  <SelectItem value="1day">{t("1 day", "يوم واحد")}</SelectItem>
                  <SelectItem value="7days">{t("7 days", "7 أيام")}</SelectItem>
                  <SelectItem value="30days">{t("30 days", "30 يوم")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={createShareLink} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              <Link2 className="w-4 h-4 mr-2" />
              {t("Generate Share Link", "إنشاء رابط المشاركة")}
            </Button>
          </TabsContent>

          <TabsContent value="manage" className="mt-4">
            {isLoading ? (
              <div className="py-8 text-center text-slate-500">
                {t("Loading...", "جاري التحميل...")}
              </div>
            ) : shares.length === 0 ? (
              <div className="py-8 text-center">
                <Link2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">{t("No share links yet", "لا توجد روابط مشاركة")}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {shares.map((share) => (
                  <div key={share.id} className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {share.is_public ? (
                            <Badge className="bg-green-100 text-green-700">
                              <Globe className="w-3 h-3 mr-1" />
                              {t("Public", "عام")}
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-700">
                              <Lock className="w-3 h-3 mr-1" />
                              {t("Restricted", "مقيد")}
                            </Badge>
                          )}
                          <Badge variant="outline">
                            <Eye className="w-3 h-3 mr-1" />
                            {share.access_count} {t("views", "مشاهدة")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {t("Created", "أنشئ")}: {format(new Date(share.created_date), "MMM d, yyyy")}
                          {share.expires_at && (
                            <>
                              <Clock className="w-3 h-3 ml-2" />
                              {t("Expires", "ينتهي")}: {format(new Date(share.expires_at), "MMM d, yyyy")}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(share.share_token)}
                          className="border-purple-300 hover:bg-purple-50"
                        >
                          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteShare(share.id)}
                          className="border-red-300 hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}