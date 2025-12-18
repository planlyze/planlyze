import React, { useEffect, useState } from "react";
import { User, Analysis, auth } from "@/api/client";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowLeft, User as UserIcon, Mail, Shield, Phone, MapPin, Calendar, FileText } from "lucide-react";
import { hasPermission, PERMISSIONS } from "@/components/utils/permissions";

export default function UserProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState(null);
  const [analysisCount, setAnalysisCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await User.me();
        if (!hasPermission(me, PERMISSIONS.VIEW_USERS)) {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get("user");
        if (!email) {
          navigate(createPageUrl("OwnerDashboard"));
          return;
        }

        // Fetch the user by email using admin function
        const usersResp = await User.list();
        const usersData = usersResp?.data || usersResp;
        const allUsers = usersData?.items || [];
        const u = allUsers.find(usr => usr.email === email);
        if (!u) {
          navigate(createPageUrl("OwnerDashboard"));
          return;
        }
        setTargetUser(u);

        // Count analyses for this user
        const analyses = await Analysis.filter({ created_by: email });
        setAnalysisCount(analyses.length);
      } catch (e) {
        console.error("Error loading user profile:", e);
        await User.loginWithRedirect(window.location.href);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!targetUser) return null;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("OwnerDashboard"))}
            className="shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-emerald-600 bg-clip-text text-transparent">
              User Profile
            </h1>
            <p className="text-slate-600 mt-1">View account details and activity</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <UserIcon className="w-5 h-5" />
              {targetUser.full_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-slate-500 text-xs uppercase">Email</div>
                <div className="flex items-center gap-2 text-slate-800">
                  <Mail className="w-4 h-4" />
                  {targetUser.email}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-slate-500 text-xs uppercase">Role</div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <Badge className={(targetUser.role === 'admin' || targetUser.role === 'super_admin') ? 'bg-purple-100 text-purple-800' : ''}>
                    {targetUser.role === 'super_admin' ? 'Super Admin' : targetUser.role === 'admin' ? 'Admin' : targetUser.role}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-slate-500 text-xs uppercase">Phone</div>
                <div className="flex items-center gap-2 text-slate-800">
                  <Phone className="w-4 h-4" />
                  {targetUser.phone_number || '—'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-slate-500 text-xs uppercase">Location</div>
                <div className="flex items-center gap-2 text-slate-800">
                  <MapPin className="w-4 h-4" />
                  {targetUser.country || '—'}{targetUser.city ? `, ${targetUser.city}` : ''}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-slate-500 text-xs uppercase">Joined</div>
                <div className="flex items-center gap-2 text-slate-800">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(targetUser.created_date), "MMM d, yyyy")}
                </div>
              </div>

              {/* Last Login */}
              <div className="space-y-2">
                <div className="text-slate-500 text-xs uppercase">Last Login</div>
                <div className="flex items-center gap-2 text-slate-800">
                  <Calendar className="w-4 h-4" />
                  {targetUser.last_login ? format(new Date(targetUser.last_login), "MMM d, yyyy") : '—'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-slate-500 text-xs uppercase">Preferred Language</div>
                <div className="text-slate-800">{targetUser.preferred_language || 'english'}</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-600 flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Total Analyses
                  </div>
                  <div className="text-3xl font-bold text-slate-800">{analysisCount}</div>
                </CardContent>
              </Card>

              <div className="flex items-end gap-3">
                <Link to={createPageUrl(`Reports?user=${encodeURIComponent(targetUser.email)}`)}>
                  <Button variant="outline" className="gap-2">
                    <FileText className="w-4 h-4" /> View Reports
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}