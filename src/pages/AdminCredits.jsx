import React, { useState, useEffect } from "react";
import { auth, api, Analysis, Payment, User, AI, Transaction, CreditPackage, Settings, Role } from "@/api/client";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Wallet, Plus, Minus, DollarSign, History, Settings as SettingsIcon, Banknote } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { format } from "date-fns";
import { toast } from "sonner";
import PaymentMethodsManager from "../components/admin/PaymentMethodsManager";
import { hasPermission, PERMISSIONS } from "@/components/utils/permissions";
import { auditLogger } from "@/components/utils/auditLogger";

export default function AdminCredits() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  
  // Credit adjustment dialog
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState("add");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Pricing settings
  const [packages, setPackages] = useState([]);
  const [isSavingPackages, setIsSavingPackages] = useState(false);
  const [pricePerCredit, setPricePerCredit] = useState("1.99");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Transaction filters and pagination
  const [txTypeFilter, setTxTypeFilter] = useState("all");
  const [txCurrentPage, setTxCurrentPage] = useState(1);
  const [txSearchQuery, setTxSearchQuery] = useState("");
  const txPerPage = 20;

  // User search
  const [userSearchQuery, setUserSearchQuery] = useState("");
  
  // Role filter
  const [roles, setRoles] = useState([]);
  const [roleFilter, setRoleFilter] = useState("user");

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await auth.me();
      if (!hasPermission(currentUser, PERMISSIONS.VIEW_CREDITS)) {
        navigate(createPageUrl("Dashboard"));
        toast.error("You don't have permission to view credits");
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
      // Load all users
      const usersResp = await User.list();
      const usersList = Array.isArray(usersResp) ? usersResp : (usersResp?.data || usersResp?.items || []);
      setUsers(usersList);

      // Load all transactions
      const txResp = await Transaction.list();
      const txList = Array.isArray(txResp) ? txResp : (txResp?.data || txResp?.items || []);
      setTransactions(txList);

      // Load credit packages
      const pkgs = await CreditPackage.list();
      setPackages(pkgs);

      // Load settings
      const settings = await Settings.get();
      if (settings?.price_per_credit) {
        setPricePerCredit(settings.price_per_credit);
      }
      
      // Load roles for filter
      const rolesResp = await Role.list();
      const rolesList = Array.isArray(rolesResp) ? rolesResp : (rolesResp?.data || rolesResp?.items || []);
      setRoles(rolesList);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    }
  };

  const handleSavePricePerCredit = async () => {
    setIsSavingSettings(true);
    try {
      await Settings.update({ price_per_credit: pricePerCredit });
      toast.success("Price per credit updated successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const openAdjustDialog = (user, type) => {
    setSelectedUser(user);
    setAdjustmentType(type);
    setAdjustmentAmount("");
    setAdjustmentNotes("");
    setIsAdjustDialogOpen(true);
  };

  const handleProceedToConfirmation = () => {
    if (!adjustmentAmount) {
      toast.error("Please enter an amount");
      return;
    }
    
    const amount = parseInt(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Validate deduction doesn't exceed current credits
    if (adjustmentType === "deduct") {
      const currentCredits = selectedUser.credits || 0;
      if (amount > currentCredits) {
        toast.error(`Cannot deduct ${amount} credits. User only has ${currentCredits} credits.`);
        return;
      }
    }

    setShowConfirmation(true);
  };

  const handleAdjustCredits = async () => {
    const user = await auth.me();
    if (!hasPermission(user, PERMISSIONS.MANAGE_CREDITS)) {
      toast.error("You don't have permission to manage credits");
      setIsAdjustDialogOpen(false);
      setShowConfirmation(false);
      return;
    }

    if (!selectedUser || !adjustmentAmount) return;
    
    const amount = parseInt(adjustmentAmount);

    setIsAdjusting(true);
    try {
      const finalAmount = adjustmentType === "add" ? amount : -amount;
      
      await User.adjustCredits(selectedUser.id, finalAmount, adjustmentNotes || `Admin ${adjustmentType === "add" ? "added" : "deducted"} ${amount} credits`);

      // Log the adjustment
      await auditLogger.logCreditAdjustment(
        user.email,
        selectedUser.email,
        amount,
        adjustmentType === "add",
        adjustmentNotes
      );

      toast.success(`Successfully ${adjustmentType === "add" ? "added" : "deducted"} ${amount} credits`);
      setShowConfirmation(false);
      setIsAdjustDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error("Error adjusting credits:", error);
      toast.error("Failed to adjust credits");
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleSavePackages = async () => {
    setIsSavingPackages(true);
    try {
      for (const pkg of packages) {
        if (pkg.id) {
          await CreditPackage.update(pkg.id, pkg);
        } else {
          await CreditPackage.create(pkg);
        }
      }
      toast.success("Packages saved successfully");
      await loadData();
    } catch (error) {
      console.error("Error saving packages:", error);
      toast.error("Failed to save packages");
    } finally {
      setIsSavingPackages(false);
    }
  };

  const updatePackageField = (index, field, value) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], [field]: value };
    setPackages(updated);
  };

  const handleAddPackage = () => {
    setPackages([...packages, {
      name: '',
      name_ar: '',
      credits: 10,
      price_usd: 9.99,
      description: '',
      description_ar: '',
      features: [],
      features_ar: [],
      is_active: true,
      is_popular: false
    }]);
  };

  const handleDeletePackage = async (index) => {
    const pkg = packages[index];
    if (!confirm("Are you sure you want to delete this package?")) return;
    
    try {
      if (pkg.id) {
        await CreditPackage.delete(pkg.id);
        toast.success("Package deleted");
      }
      const updated = packages.filter((_, i) => i !== index);
      setPackages(updated);
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error("Failed to delete package");
    }
  };

  const totalCreditsIssued = transactions
    .filter(t => t.type === 'purchase' && t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(t.credits || 0), 0);
  const totalCreditsUsed = transactions
    .filter(t => t.type === 'usage' && t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(t.credits || 0), 0);
  const totalCreditsRemaining = users.reduce((sum, u) => sum + (u.credits || 0), 0);
  const totalRevenue = transactions
    .filter(t => t.type === 'purchase' && t.status === 'completed')
    .reduce((sum, t) => sum + (t.amount_usd || 0), 0);
  const totalReports = transactions.filter(t => t.type === 'usage').length;

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          title="Credits & Revenue Management"
          description="Manage user credits, transactions, and pricing"
          backUrl={createPageUrl("OwnerDashboard")}
          icon={Wallet}
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="glass-effect border border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{users.length}</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{totalReports}</div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Credits Issued</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalCreditsIssued}</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Credits Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{totalCreditsUsed}</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Credits Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totalCreditsRemaining}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-auto grid-cols-4">
            <TabsTrigger value="users" className="gap-2 data-[state=inactive]:text-slate-700 data-[state=active]:text-slate-900">
              <Wallet className="w-4 h-4" />
              Users & Credits
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2 data-[state=inactive]:text-slate-700 data-[state=active]:text-slate-900">
              <History className="w-4 h-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=inactive]:text-slate-700 data-[state=active]:text-slate-900">
              <SettingsIcon className="w-4 h-4" />
              Pricing Settings
            </TabsTrigger>
            <TabsTrigger value="payment-methods" className="gap-2 data-[state=inactive]:text-slate-700 data-[state=active]:text-slate-900">
              <Banknote className="w-4 h-4" />
              Payment Methods
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="glass-effect border border-slate-200">
              <CardHeader>
                <CardTitle>User Credit Balances</CardTitle>
                <CardDescription>View and manage credits for all users</CardDescription>
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by User ID, Email, or Name..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Role:</span>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold text-slate-800">User</TableHead>
                        <TableHead className="text-center font-semibold text-slate-800">Current Credits</TableHead>
                        <TableHead className="text-center font-semibold text-slate-800">Total Purchased</TableHead>
                        <TableHead className="text-center font-semibold text-slate-800">Total Used</TableHead>
                        <TableHead className="font-semibold text-slate-800">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        let filtered = users;
                        
                        // Apply role filter
                        if (roleFilter !== "all") {
                          filtered = filtered.filter(u => u.role === roleFilter);
                        }
                        
                        // Apply search filter
                        if (userSearchQuery.trim()) {
                          filtered = filtered.filter(u => 
                            u.id?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                            u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                            u.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase())
                          );
                        }
                        
                        return filtered.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filtered.map((user) => {
                            const userPurchased = transactions
                              .filter(t => t.user_email === user.email && t.type === 'purchase')
                              .reduce((sum, t) => sum + Math.abs(t.credits || 0), 0);
                            const userUsed = transactions
                              .filter(t => t.user_email === user.email && t.type === 'usage')
                              .reduce((sum, t) => sum + Math.abs(t.credits || 0), 0);
                            return (
                            <TableRow key={user.id}>
                          <TableCell>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-purple-600">
                              {user.credits || 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {userPurchased}
                          </TableCell>
                          <TableCell className="text-center">
                            {userUsed}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openAdjustDialog(user, "add")}
                                className="gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Add
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openAdjustDialog(user, "deduct")}
                                className="gap-1"
                              >
                                <Minus className="w-3 h-3" />
                                Deduct
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                            );
                          })
                        );
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="glass-effect border border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>All credit transactions across the platform</CardDescription>
                  </div>
                  <Select value={txTypeFilter} onValueChange={(val) => { setTxTypeFilter(val); setTxCurrentPage(1); }}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="usage">Usage</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by Transaction ID or Email..."
                    value={txSearchQuery}
                    onChange={(e) => { setTxSearchQuery(e.target.value); setTxCurrentPage(1); }}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold text-slate-800">ID</TableHead>
                        <TableHead className="font-semibold text-slate-800">Date</TableHead>
                        <TableHead className="font-semibold text-slate-800">User</TableHead>
                        <TableHead className="font-semibold text-slate-800">Type</TableHead>
                        <TableHead className="text-right font-semibold text-slate-800">Credits</TableHead>
                        <TableHead className="text-right font-semibold text-slate-800">Amount</TableHead>
                        <TableHead className="font-semibold text-slate-800">Status</TableHead>
                        <TableHead className="font-semibold text-slate-800">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        let filtered = txTypeFilter === "all" ? transactions : transactions.filter(tx => tx.type === txTypeFilter);
                        if (txSearchQuery.trim()) {
                          const query = txSearchQuery.toLowerCase();
                          filtered = filtered.filter(tx => 
                            tx.unique_id?.toLowerCase().includes(query) ||
                            tx.user_email?.toLowerCase().includes(query)
                          );
                        }
                        const start = (txCurrentPage - 1) * txPerPage;
                        const end = start + txPerPage;
                        const paginated = filtered.slice(start, end);
                        const totalPages = Math.ceil(filtered.length / txPerPage);

                        return (
                          <>
                            {paginated.map((tx) => (
                              <TableRow key={tx.id}>
                                <TableCell>
                                  <span className="text-xs font-mono font-semibold text-purple-600">
                                    {tx.unique_id || '—'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {tx.created_at ? format(new Date(tx.created_at), "MMM d, yyyy HH:mm") : '—'}
                                </TableCell>
                                <TableCell className="text-sm">{tx.user_email}</TableCell>
                                <TableCell>
                                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                    tx.type === 'purchase' ? 'bg-green-100 text-green-800' :
                                    tx.type === 'usage' ? 'bg-blue-100 text-blue-800' :
                                    tx.type === 'bonus' ? 'bg-purple-100 text-purple-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {tx.type}
                                  </span>
                                </TableCell>
                                <TableCell className={`text-right font-medium ${
                                  tx.credits > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {tx.credits > 0 ? '+' : ''}{tx.credits}
                                </TableCell>
                                <TableCell className="text-right">
                                  {tx.amount_usd ? `$${tx.amount_usd}` : '—'}
                                </TableCell>
                                <TableCell>
                                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                    tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {tx.status}
                                  </span>
                                </TableCell>
                                <TableCell className="text-sm text-slate-600 max-w-xs truncate">
                                  {tx.notes || '—'}
                                </TableCell>
                              </TableRow>
                            ))}
                            {paginated.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                                  No transactions found
                                </TableCell>
                              </TableRow>
                            )}
                            {totalPages > 1 && (
                              <TableRow>
                                <TableCell colSpan={8} className="border-t">
                                  <div className="flex items-center justify-between py-2">
                                    <div className="text-sm text-slate-600">
                                      Showing {start + 1}-{Math.min(end, filtered.length)} of {filtered.length} transactions
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setTxCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={txCurrentPage === 1}
                                      >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                      </Button>
                                      <div className="flex items-center gap-2 px-3 text-sm">
                                        Page {txCurrentPage} of {totalPages}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setTxCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={txCurrentPage === totalPages}
                                      >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
          
            <Card className="glass-effect border border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Credit Package Settings</CardTitle>
                  <CardDescription>Configure pricing and content for credit packages</CardDescription>
                </div>
                <Button onClick={handleAddPackage} className="gradient-primary text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Package
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {packages.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No credit packages yet. Click "Add Package" to create one.
                  </div>
                )}
                {packages.map((pkg, index) => (
                  <div key={pkg.id || index} className={`space-y-4 p-6 border-2 rounded-lg ${pkg.is_popular ? 'bg-purple-50 border-purple-300' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-lg">{pkg.name || 'New Package'}</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <Label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={pkg.is_popular || false}
                            onChange={(e) => updatePackageField(index, 'is_popular', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span>Popular</span>
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeletePackage(index)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Package Name (English)</Label>
                        <Input
                          value={pkg.name || ''}
                          onChange={(e) => updatePackageField(index, 'name', e.target.value)}
                          placeholder="e.g., Basic Package"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Package Name (Arabic)</Label>
                        <Input
                          value={pkg.name_ar || ''}
                          onChange={(e) => updatePackageField(index, 'name_ar', e.target.value)}
                          placeholder="e.g., الباقة الأساسية"
                          dir="rtl"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Description (English)</Label>
                        <Input
                          value={pkg.description || ''}
                          onChange={(e) => updatePackageField(index, 'description', e.target.value)}
                          placeholder="e.g., Perfect for getting started"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description (Arabic)</Label>
                        <Input
                          value={pkg.description_ar || ''}
                          onChange={(e) => updatePackageField(index, 'description_ar', e.target.value)}
                          placeholder="e.g., مثالي للبدء"
                          dir="rtl"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Price (USD)</Label>
                        <Input
                          type="number"
                          value={pkg.price_usd || ''}
                          onChange={(e) => updatePackageField(index, 'price_usd', Number(e.target.value))}
                          min="0.01"
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Credits</Label>
                        <Input
                          type="number"
                          value={pkg.credits || ''}
                          onChange={(e) => updatePackageField(index, 'credits', Number(e.target.value))}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select 
                          value={pkg.is_active ? 'active' : 'inactive'}
                          onValueChange={(val) => updatePackageField(index, 'is_active', val === 'active')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Features (English - one per line)</Label>
                        <Textarea
                          value={(pkg.features || []).join('\n')}
                          onChange={(e) => {
                            const features = e.target.value.split('\n').filter(f => f.trim());
                            updatePackageField(index, 'features', features);
                          }}
                          placeholder="e.g., Full business analysis report&#10;Market research insights&#10;Competitor analysis"
                          rows={4}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Features (Arabic - one per line)</Label>
                        <Textarea
                          value={(pkg.features_ar || []).join('\n')}
                          onChange={(e) => {
                            const features = e.target.value.split('\n').filter(f => f.trim());
                            updatePackageField(index, 'features_ar', features);
                          }}
                          placeholder="e.g., تقرير تحليل الأعمال الكامل&#10;رؤى أبحاث السوق&#10;تحليل المنافسين"
                          rows={4}
                          className="font-mono text-sm"
                          dir="rtl"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">Enter each feature on a new line</p>

                    <div className="text-sm text-slate-600 bg-white p-3 rounded-lg">
                      <div>Price per credit: ${pkg.price_usd && pkg.credits ? (pkg.price_usd / pkg.credits).toFixed(2) : '—'}</div>
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t flex gap-3">
                  <Button 
                    onClick={handleSavePackages}
                    disabled={isSavingPackages}
                    className="gradient-primary text-white"
                  >
                    {isSavingPackages ? "Saving..." : "Save All Changes"}
                  </Button>
                  <Button variant="outline" onClick={loadData}>
                    Reset Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods">
            <Card className="glass-effect border border-slate-200">
              <CardContent className="p-6">
                <PaymentMethodsManager isArabic={false} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Credit Adjustment Dialog */}
        <Dialog open={isAdjustDialogOpen} onOpenChange={(open) => {
          setIsAdjustDialogOpen(open);
          if (!open) setShowConfirmation(false);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {adjustmentType === "add" ? "Add Credits" : "Deduct Credits"}
              </DialogTitle>
            </DialogHeader>
            
            {!showConfirmation ? (
              <>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>User</Label>
                    <Input value={selectedUser?.email || ""} disabled />
                  </div>
                  <div>
                    <Label>Current Balance</Label>
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedUser?.credits || 0} credits
                    </div>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      placeholder="Enter number of credits"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      min="1"
                      max={adjustmentType === "deduct" ? (selectedUser?.credits || 0) : undefined}
                    />
                    {adjustmentType === "deduct" && (
                      <p className="text-sm text-slate-500 mt-1">
                        Maximum: {selectedUser?.credits || 0} credits
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Notes (optional)</Label>
                    <Textarea
                      placeholder="Reason for adjustment..."
                      value={adjustmentNotes}
                      onChange={(e) => setAdjustmentNotes(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleProceedToConfirmation}
                    disabled={!adjustmentAmount}
                    className={adjustmentType === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                  >
                    Continue
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <div className="space-y-4 py-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-900 mb-2">Confirm Action</h3>
                    <p className="text-sm text-amber-800">
                      Are you sure you want to {adjustmentType === "add" ? "add" : "deduct"}{" "}
                      <span className="font-bold">{adjustmentAmount} credits</span> {adjustmentType === "add" ? "to" : "from"}{" "}
                      <span className="font-bold">{selectedUser?.email}</span>?
                    </p>
                    <div className="mt-3 pt-3 border-t border-amber-200">
                      <div className="text-sm">
                        <span className="text-amber-700">Current balance:</span>{" "}
                        <span className="font-bold">{selectedUser?.credits || 0}</span> →{" "}
                        <span className="font-bold text-purple-600">
                          {(selectedUser?.credits || 0) + (adjustmentType === "add" ? parseInt(adjustmentAmount) : -parseInt(adjustmentAmount))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                    Back
                  </Button>
                  <Button
                    onClick={handleAdjustCredits}
                    disabled={isAdjusting}
                    className={adjustmentType === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                  >
                    {isAdjusting ? "Processing..." : `Confirm ${adjustmentType === "add" ? "Add" : "Deduct"}`}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}