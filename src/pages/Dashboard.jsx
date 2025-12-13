import React, { useState, useEffect } from "react";
import { auth, api, Analysis, Payment, User, AI, Transaction } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import StatsOverview from "../components/dashboard/StatsOverview";
import RecentAnalyses from "../components/dashboard/RecentAnalyses";
import CreditSummary from "../components/dashboard/CreditSummary";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import ActivityFeed from "../components/dashboard/ActivityFeed";

import { Skeleton } from "@/components/ui/skeleton";



export default function Dashboard() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const user = await auth.me();
        setCurrentUser(user);
        await loadAnalyses(user.email);
      } catch (error) {
        // Instead of navigating to a LandingPage, initiate a login redirect.
        // This implies the user is not authenticated and needs to log in.
        window.location.href = "/login";
      }
    };
    checkAuthAndLoadData();
  }, [navigate]);

  const loadAnalyses = async (userEmail) => {
    setIsLoading(true);
    try {
      const data = await Analysis.filter({ user_email: userEmail });
      // Exclude soft-deleted reports
      setAnalyses(data.filter(a => a.is_deleted !== true));
      
      // Load recent transactions
      const txs = await Transaction.filter({ user_email: userEmail });
      setTransactions(txs.slice(0, 5));
    } catch (error) {
      console.error("Error loading analyses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !currentUser) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8 bg-slate-200 rounded-lg" />
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 bg-slate-200 rounded-xl" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"><Skeleton className="h-96 bg-slate-200 rounded-xl" /></div>
          <div className="space-y-6">
            <Skeleton className="h-48 bg-slate-200 rounded-xl" />
            <Skeleton className="h-64 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const completedAnalyses = analyses.filter(a => a.status === 'completed').length;
  const inProgressAnalyses = analyses.filter(a => a.status === 'analyzing').length;

  const isArabic = currentUser?.preferred_language === 'arabic';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-orange-50/20 p-4 md:p-8" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className={`${isArabic ? 'text-right' : 'text-left'} space-y-3`}>
          <div className="inline-block">
            <h1 className="text-4xl md:text-5xl font-bold text-orange-600">
              {isArabic ? 'لوحة التحكم' : 'Your Dashboard'}
            </h1>
          </div>
          <p className="text-xl text-slate-600 font-medium">
            {isArabic ? 'تتبع وأدر تحليلات عملك.' : 'Track and manage your business analyses.'}
          </p>
        </div>

        <div data-tour="credits-widget">
          <StatsOverview 
            creditsLeft={currentUser?.premium_credits || 0}
            totalReports={analyses.length}
            totalUsed={currentUser?.total_credits_used || 0}
            isLoading={isLoading}
            isArabic={isArabic}
          />
        </div>

        {/* Recent Transactions and Analyses */}
        <div className="grid lg:grid-cols-2 gap-8">
          <RecentTransactions transactions={transactions} isArabic={isArabic} />
          <div data-tour="reports">
            <RecentAnalyses 
              analyses={analyses}
              isLoading={isLoading}
              onRefresh={() => loadAnalyses(currentUser.email)}
              isArabic={isArabic}
            />
          </div>
        </div>

        {/* Activity Feed */}
        <div data-tour="activity">
          <ActivityFeed 
            userEmail={currentUser?.email} 
            isArabic={isArabic} 
            limit={10}
            showPublic={currentUser?.role === 'admin'}
          />
        </div>
      </div>
    </div>
  );
}