import React, { useState, useEffect } from "react";
import { auth, Partner, SystemSettings } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Settings, Users, Plus, Pencil, Trash2, Save, Globe, MessageSquare, Mail, Eye, Check, Share2, Facebook, Linkedin, Instagram, Twitter, Youtube, Send, MessageCircle, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { hasPermission, PERMISSIONS } from "@/components/utils/permissions";
import { api } from "@/api/client";

export default function AdminSettings() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("partners");
  
  const [partners, setPartners] = useState([]);
  const [syrianAppsCount, setSyrianAppsCount] = useState("150");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  const [contactMessages, setContactMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  
  const [socialMediaLinks, setSocialMediaLinks] = useState([]);
  const [isSocialDialogOpen, setIsSocialDialogOpen] = useState(false);
  const [editingSocial, setEditingSocial] = useState(null);
  const [socialForm, setSocialForm] = useState({
    platform: "",
    url: "",
    icon: "Facebook",
    hover_color: "hover:bg-orange-500 hover:border-orange-500",
    display_order: 0,
    is_active: true
  });
  const [isSavingSocial, setIsSavingSocial] = useState(false);
  
  const iconOptions = [
    { value: "Facebook", label: "Facebook", color: "hover:bg-blue-600 hover:border-blue-600" },
    { value: "Linkedin", label: "LinkedIn", color: "hover:bg-blue-700 hover:border-blue-700" },
    { value: "Instagram", label: "Instagram", color: "hover:bg-pink-500 hover:border-pink-500" },
    { value: "Twitter", label: "Twitter/X", color: "hover:bg-black hover:border-black" },
    { value: "Youtube", label: "YouTube", color: "hover:bg-red-600 hover:border-red-600" },
    { value: "MessageCircle", label: "WhatsApp", color: "hover:bg-green-500 hover:border-green-500" },
    { value: "Send", label: "Telegram", color: "hover:bg-blue-500 hover:border-blue-500" },
    { value: "ExternalLink", label: "Other", color: "hover:bg-orange-500 hover:border-orange-500" }
  ];
  
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [partnerForm, setPartnerForm] = useState({
    name: "",
    name_ar: "",
    logo_url: "",
    website_url: "",
    color: "6B46C1",
    display_order: 0,
    is_active: true
  });
  const [isSavingPartner, setIsSavingPartner] = useState(false);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await auth.me();
      if (!hasPermission(currentUser, PERMISSIONS.MANAGE_SETTINGS)) {
        navigate(createPageUrl("Dashboard"));
        toast.error("You don't have permission to view settings");
        return;
      }
      await loadData();
    } catch (error) {
      console.error("Error:", error);
      window.location.href = "/login";
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const partnersData = await Partner.list();
      setPartners(Array.isArray(partnersData) ? partnersData : []);
      
      try {
        const syrianSetting = await SystemSettings.get('syrian_apps_count');
        if (syrianSetting?.value) {
          setSyrianAppsCount(syrianSetting.value);
        }
      } catch (e) {
        console.log("Syrian apps setting not found, using default");
      }
      
      try {
        const messagesData = await api.get('/contact-messages');
        setContactMessages(Array.isArray(messagesData) ? messagesData : []);
      } catch (e) {
        console.log("Error loading contact messages:", e);
      }
      
      try {
        const socialData = await api.get('/social-media/all');
        setSocialMediaLinks(Array.isArray(socialData) ? socialData : []);
      } catch (e) {
        console.log("Error loading social media:", e);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load settings data");
    }
  };

  const handleViewMessage = async (message) => {
    setSelectedMessage(message);
    setIsMessageDialogOpen(true);
    
    if (!message.is_read) {
      try {
        await api.put(`/contact-messages/${message.id}/read`);
        setContactMessages(prev => 
          prev.map(m => m.id === message.id ? { ...m, is_read: true } : m)
        );
      } catch (e) {
        console.error("Error marking message as read:", e);
      }
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    
    try {
      await api.delete(`/contact-messages/${messageId}`);
      setContactMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success("Message deleted");
    } catch (e) {
      console.error("Error deleting message:", e);
      toast.error("Failed to delete message");
    }
  };

  const openSocialDialog = (social = null) => {
    if (social) {
      setEditingSocial(social);
      setSocialForm({
        platform: social.platform || "",
        url: social.url || "",
        icon: social.icon || "Facebook",
        hover_color: social.hover_color || "hover:bg-orange-500 hover:border-orange-500",
        display_order: social.display_order || 0,
        is_active: social.is_active !== false
      });
    } else {
      setEditingSocial(null);
      setSocialForm({
        platform: "",
        url: "",
        icon: "Facebook",
        hover_color: "hover:bg-blue-600 hover:border-blue-600",
        display_order: socialMediaLinks.length + 1,
        is_active: true
      });
    }
    setIsSocialDialogOpen(true);
  };

  const handleSaveSocial = async () => {
    if (!socialForm.platform || !socialForm.url) {
      toast.error("Platform name and URL are required");
      return;
    }
    
    setIsSavingSocial(true);
    try {
      if (editingSocial) {
        await api.put(`/social-media/${editingSocial.id}`, socialForm);
        toast.success("Social media link updated");
      } else {
        await api.post('/social-media', socialForm);
        toast.success("Social media link added");
      }
      setIsSocialDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error("Error saving social media:", error);
      toast.error("Failed to save social media link");
    } finally {
      setIsSavingSocial(false);
    }
  };

  const handleDeleteSocial = async (social) => {
    if (!confirm(`Are you sure you want to delete "${social.platform}"?`)) return;
    
    try {
      await api.delete(`/social-media/${social.id}`);
      toast.success("Social media link deleted");
      await loadData();
    } catch (error) {
      console.error("Error deleting social media:", error);
      toast.error("Failed to delete social media link");
    }
  };

  const getIconComponent = (iconName) => {
    const icons = { Facebook, Linkedin, Instagram, Twitter, Youtube, Send, MessageCircle, ExternalLink };
    return icons[iconName] || ExternalLink;
  };

  const handleSaveSyrianAppsCount = async () => {
    setIsSavingSettings(true);
    try {
      await SystemSettings.update('syrian_apps_count', syrianAppsCount);
      toast.success("Syrian apps count updated successfully");
    } catch (error) {
      console.error("Error saving setting:", error);
      toast.error("Failed to save setting");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const openPartnerDialog = (partner = null) => {
    if (partner) {
      setEditingPartner(partner);
      setPartnerForm({
        name: partner.name || "",
        name_ar: partner.name_ar || "",
        logo_url: partner.logo_url || "",
        website_url: partner.website_url || "",
        color: partner.color || "6B46C1",
        display_order: partner.display_order || 0,
        is_active: partner.is_active !== false
      });
    } else {
      setEditingPartner(null);
      setPartnerForm({
        name: "",
        name_ar: "",
        logo_url: "",
        website_url: "",
        color: "6B46C1",
        display_order: partners.length + 1,
        is_active: true
      });
    }
    setIsPartnerDialogOpen(true);
  };

  const handleSavePartner = async () => {
    if (!partnerForm.name) {
      toast.error("Partner name is required");
      return;
    }
    
    setIsSavingPartner(true);
    try {
      if (editingPartner) {
        await Partner.update(editingPartner.id, partnerForm);
        toast.success("Partner updated successfully");
      } else {
        await Partner.create(partnerForm);
        toast.success("Partner created successfully");
      }
      setIsPartnerDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error("Error saving partner:", error);
      toast.error("Failed to save partner");
    } finally {
      setIsSavingPartner(false);
    }
  };

  const handleDeletePartner = async (partner) => {
    if (!confirm(`Are you sure you want to delete "${partner.name}"?`)) {
      return;
    }
    
    try {
      await Partner.delete(partner.id);
      toast.success("Partner deleted successfully");
      await loadData();
    } catch (error) {
      console.error("Error deleting partner:", error);
      toast.error("Failed to delete partner");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Settings className="w-8 h-8 text-purple-600" />
              Landing Page Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage partners and landing page content
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="partners" className="gap-2">
              <Users className="w-4 h-4" />
              Partners
            </TabsTrigger>
            <TabsTrigger value="statistics" className="gap-2">
              <Globe className="w-4 h-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages
              {contactMessages.filter(m => !m.is_read).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {contactMessages.filter(m => !m.is_read).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <Share2 className="w-4 h-4" />
              Social Media
            </TabsTrigger>
          </TabsList>

          <TabsContent value="partners">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Partner Management</CardTitle>
                  <CardDescription>
                    Manage partners displayed on the landing page
                  </CardDescription>
                </div>
                <Button onClick={() => openPartnerDialog()} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Partner
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Name (EN)</TableHead>
                      <TableHead>Name (AR)</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No partners found. Add your first partner.
                        </TableCell>
                      </TableRow>
                    ) : (
                      partners.sort((a, b) => a.display_order - b.display_order).map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell>{partner.display_order}</TableCell>
                          <TableCell className="font-medium">{partner.name}</TableCell>
                          <TableCell dir="rtl">{partner.name_ar || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded border"
                                style={{ backgroundColor: `#${partner.color}` }}
                              />
                              <span className="text-xs text-gray-500">#{partner.color}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              partner.is_active 
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}>
                              {partner.is_active ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openPartnerDialog(partner)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeletePartner(partner)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics">
            <Card>
              <CardHeader>
                <CardTitle>Landing Page Statistics</CardTitle>
                <CardDescription>
                  Configure statistics shown on the landing page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="syrianAppsCount">Syrian Apps Count</Label>
                    <div className="flex gap-2">
                      <Input
                        id="syrianAppsCount"
                        type="number"
                        value={syrianAppsCount}
                        onChange={(e) => setSyrianAppsCount(e.target.value)}
                        placeholder="150"
                      />
                      <Button 
                        onClick={handleSaveSyrianAppsCount}
                        disabled={isSavingSettings}
                        className="gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      This number is displayed on the landing page as the count of Syrian apps analyzed.
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Automatic Statistics</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The following statistics are calculated automatically from the database:
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 list-disc list-inside">
                    <li><strong>Users Count:</strong> Total active users in the system</li>
                    <li><strong>Reports Count:</strong> Total completed analyses</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Messages
                </CardTitle>
                <CardDescription>
                  Messages received from the contact form on the landing page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Email Sent</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contactMessages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No contact messages yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      contactMessages.map((msg) => (
                        <TableRow key={msg.id} className={!msg.is_read ? "bg-blue-50 dark:bg-blue-900/20" : ""}>
                          <TableCell>
                            {msg.is_read ? (
                              <span className="flex items-center gap-1 text-green-600 text-xs">
                                <Check className="w-4 h-4" /> Read
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                                <MessageSquare className="w-4 h-4" /> New
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{msg.name}</TableCell>
                          <TableCell>{msg.email}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            {msg.email_sent ? (
                              <span className="text-green-600 text-xs">Sent</span>
                            ) : (
                              <span className="text-gray-400 text-xs">Not sent</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewMessage(msg)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteMessage(msg.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Social Media Links
                  </CardTitle>
                  <CardDescription>
                    Manage social media links displayed in the footer
                  </CardDescription>
                </div>
                <Button onClick={() => openSocialDialog()} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Link
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Icon</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {socialMediaLinks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No social media links found. Add your first link.
                        </TableCell>
                      </TableRow>
                    ) : (
                      socialMediaLinks.sort((a, b) => a.display_order - b.display_order).map((social) => {
                        const IconComp = getIconComponent(social.icon);
                        return (
                          <TableRow key={social.id}>
                            <TableCell>{social.display_order}</TableCell>
                            <TableCell className="font-medium">{social.platform}</TableCell>
                            <TableCell>
                              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <IconComp className="w-4 h-4" />
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm text-gray-500">
                              <a href={social.url} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600">
                                {social.url}
                              </a>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                social.is_active 
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              }`}>
                                {social.is_active ? "Active" : "Inactive"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openSocialDialog(social)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteSocial(social)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isSocialDialogOpen} onOpenChange={setIsSocialDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSocial ? "Edit Social Media Link" : "Add Social Media Link"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform Name *</Label>
                <Input
                  id="platform"
                  value={socialForm.platform}
                  onChange={(e) => setSocialForm({ ...socialForm, platform: e.target.value })}
                  placeholder="Facebook, Twitter, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  value={socialForm.url}
                  onChange={(e) => setSocialForm({ ...socialForm, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={socialForm.icon}
                  onValueChange={(value) => {
                    const option = iconOptions.find(o => o.value === value);
                    setSocialForm({ 
                      ...socialForm, 
                      icon: value,
                      hover_color: option?.color || socialForm.hover_color
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => {
                      const IconComp = getIconComponent(option.value);
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComp className="w-4 h-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={socialForm.display_order}
                  onChange={(e) => setSocialForm({ ...socialForm, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={socialForm.is_active}
                  onCheckedChange={(checked) => setSocialForm({ ...socialForm, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveSocial} disabled={isSavingSocial}>
                {isSavingSocial ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Contact Message</DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-sm">Name</Label>
                    <p className="font-medium">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Email</Label>
                    <p className="font-medium">{selectedMessage.email}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Date</Label>
                  <p className="font-medium">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Message</Label>
                  <div className="mt-1 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(`mailto:${selectedMessage.email}`, '_blank')}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Reply via Email
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isPartnerDialogOpen} onOpenChange={setIsPartnerDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPartner ? "Edit Partner" : "Add New Partner"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (English) *</Label>
                <Input
                  id="name"
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                  placeholder="Partner Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_ar">Name (Arabic)</Label>
                <Input
                  id="name_ar"
                  dir="rtl"
                  value={partnerForm.name_ar}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name_ar: e.target.value })}
                  placeholder="اسم الشريك"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={partnerForm.logo_url}
                  onChange={(e) => setPartnerForm({ ...partnerForm, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  value={partnerForm.website_url}
                  onChange={(e) => setPartnerForm({ ...partnerForm, website_url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color (Hex)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      value={partnerForm.color}
                      onChange={(e) => setPartnerForm({ ...partnerForm, color: e.target.value.replace('#', '') })}
                      placeholder="6B46C1"
                    />
                    <div 
                      className="w-10 h-10 rounded border flex-shrink-0"
                      style={{ backgroundColor: `#${partnerForm.color}` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={partnerForm.display_order}
                    onChange={(e) => setPartnerForm({ ...partnerForm, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={partnerForm.is_active}
                  onCheckedChange={(checked) => setPartnerForm({ ...partnerForm, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSavePartner} disabled={isSavingPartner}>
                {isSavingPartner ? "Saving..." : "Save Partner"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
