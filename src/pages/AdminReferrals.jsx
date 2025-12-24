import React, { useState, useEffect } from "react";
import { auth, Referral, User } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Users, Calendar, Gift, CheckCircle, Clock, SortDesc, SortAsc, Mail, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/common/PageHeader";
import FilterBar, { SearchInput, SELECT_TRIGGER_CLASS } from "@/components/common/FilterBar";

export default function AdminReferrals() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [referrals, setReferrals] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    loadReferrals();
  }, [navigate]);

  const loadReferrals = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();
      const roleName = typeof user.role === 'object' ? user.role?.name : user.role || 'user';
      if (!['admin', 'super_admin', 'owner'].includes(roleName)) {
        navigate(createPageUrl("Dashboard"));
        toast.error("You don't have permission to view referrals");
        return;
      }

      const allReferrals = await Referral.list();
      setReferrals(allReferrals);

      const allUsers = await User.list();
      const usersMap = {};
      allUsers.forEach(u => {
        usersMap[u.email] = u;
      });
      setUsers(usersMap);
    } catch (error) {
      console.error("Error loading referrals:", error);
      toast.error("Failed to load referrals");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rewarded': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'rewarded': return <Gift className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return null;
    }
  };

  const filteredReferrals = referrals.filter(r => {
    const matchesSearch = !searchQuery.trim() || 
      r.referrer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referred_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referral_code?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  const stats = {
    total: referrals.length,
    completed: referrals.filter(r => r.status === 'completed').length,
    rewarded: referrals.filter(r => r.status === 'rewarded').length,
    pending: referrals.filter(r => r.status === 'pending').length,
    totalCreditsAwarded: referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length * 2
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Referral Management"
          description={`${filteredReferrals.length} referrals`}
          backUrl={createPageUrl("OwnerDashboard")}
          icon={UserPlus}
        />

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border-slate-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                  <p className="text-sm text-slate-500">Total Referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stats.completed}</p>
                  <p className="text-sm text-slate-500">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stats.pending}</p>
                  <p className="text-sm text-slate-500">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stats.totalCreditsAwarded}</p>
                  <p className="text-sm text-slate-500">Credits Awarded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <FilterBar className="mb-6">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by referrer, referred email or code..."
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={`w-[140px] ${SELECT_TRIGGER_CLASS}`}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rewarded">Rewarded</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="gap-2 h-11"
          >
            {sortOrder === "desc" ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
            {sortOrder === "desc" ? "Newest" : "Oldest"}
          </Button>
        </FilterBar>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-600" />
              Referral List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredReferrals.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No referrals found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Referred User</TableHead>
                      <TableHead>Referral Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Rewarded At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrals.map((referral) => {
                      const referrer = users[referral.referrer_email];
                      const referred = users[referral.referred_email];
                      return (
                        <TableRow key={referral.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium text-sm">
                                {referral.referrer_email?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <button
                                  onClick={() => navigate(createPageUrl("UserProfile") + `?email=${encodeURIComponent(referral.referrer_email)}`)}
                                  className="text-sm font-medium text-slate-800 hover:text-purple-600 transition-colors"
                                >
                                  {referrer?.full_name || referral.referrer_email}
                                </button>
                                <p className="text-xs text-slate-500">{referral.referrer_email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium text-sm">
                                {referral.referred_email?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <button
                                  onClick={() => navigate(createPageUrl("UserProfile") + `?email=${encodeURIComponent(referral.referred_email)}`)}
                                  className="text-sm font-medium text-slate-800 hover:text-orange-600 transition-colors"
                                >
                                  {referred?.full_name || referral.referred_email}
                                </button>
                                <p className="text-xs text-slate-500">{referral.referred_email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">
                              {referral.referral_code}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(referral.status)} gap-1`}>
                              {getStatusIcon(referral.status)}
                              {referral.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Gift className="w-4 h-4 text-purple-500" />
                              <span className="font-medium text-purple-600">
                                {referral.status === 'completed' || referral.status === 'rewarded' ? '+2' : '0'}
                              </span>
                              <span className="text-xs text-slate-500">(1 each)</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Calendar className="w-4 h-4" />
                              {referral.created_at ? format(new Date(referral.created_at), "MMM d, yyyy") : "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {referral.rewarded_at ? (
                              <div className="flex items-center gap-1 text-sm text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                {format(new Date(referral.rewarded_at), "MMM d, yyyy")}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}