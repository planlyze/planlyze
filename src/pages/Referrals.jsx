import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { auth, Referral } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Users, Gift, Copy, Check, Share2, 
  Sparkles, TrendingUp, Award, UserPlus
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { motion } from "framer-motion";
import { toast } from "sonner";

const REFERRER_REWARD = 1; // Credits for referrer
const REFERRED_REWARD = 1; // Credits for new user

export default function Referrals() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();
      setCurrentUser(user);
      
      // Load referrals for this user
      const userReferrals = await Referral.list();
      setReferrals(Array.isArray(userReferrals) ? userReferrals : []);
    } catch (error) {
      console.error("Error loading referral data:", error);
      window.location.href = "/login";
    } finally {
      setIsLoading(false);
    }
  };

  const generateReferralCode = (email) => {
    const prefix = email.split('@')[0].substring(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${random}`;
  };

  const getReferralLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/register?ref=${currentUser?.referral_code}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      setCopied(true);
      toast.success(t('referrals.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(t('referrals.copyFailed'));
    }
  };

  const shareLink = async () => {
    const shareData = {
      title: t('referrals.joinPlanlyze'),
      text: t('referrals.getFreeCredit'),
      url: getReferralLink()
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const isArabic = i18n.language === 'ar' || currentUser?.preferred_language === 'arabic';

  const stats = [
    {
      label: t('referrals.totalReferrals'),
      value: currentUser?.total_referrals || 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100"
    },
    {
      label: t('referrals.creditsEarned'),
      value: currentUser?.referral_credits_earned || 0,
      icon: Sparkles,
      color: "text-purple-600",
      bg: "bg-purple-100"
    },
    {
      label: t('referrals.pendingRewards'),
      value: referrals.filter(r => r.status === 'completed').length,
      icon: Gift,
      color: "text-amber-600",
      bg: "bg-amber-100"
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-purple-50/30 to-orange-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-80 rounded-xl dark:bg-gray-700" />
          <Skeleton className="h-48 w-full rounded-2xl dark:bg-gray-700" />
          <div className="grid md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl dark:bg-gray-700" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-orange-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-8">
        <PageHeader
          title={t('referrals.title')}
          description={t('referrals.subtitle')}
          backUrl={createPageUrl("Dashboard")}
          icon={Gift}
          isArabic={isArabic}
        />

        {/* How It Works Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            <CardContent className="relative py-8 px-6 md:px-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Gift className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold">
                      {t('referrals.howItWorks')}
                    </h2>
                  </div>
                  
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">1</div>
                      <span>{t('referrals.step1')}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">2</div>
                      <span>{t('referrals.step2')}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">3</div>
                      <span>{t('referrals.step3', { reward: REFERRER_REWARD })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Award className="w-12 h-12" />
                  </div>
                  <Badge className="bg-white/20 text-white border-0 text-lg px-4 py-1">
                    +{REFERRER_REWARD} {t('credits.credit')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 border-slate-200 dark:border-gray-700 shadow-xl dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Share2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                {t('referrals.yourReferralLink')}
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                {t('referrals.shareWithFriends')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={getReferralLink()} 
                  readOnly 
                  className="font-mono text-sm bg-slate-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <Button 
                  onClick={copyToClipboard}
                  variant="outline"
                  className="shrink-0 gap-2 dark:border-gray-600"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? t('referrals.copied') : t('referrals.copy')}
                </Button>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-purple-800 dark:text-purple-300">
                  {t('referrals.referralCode')}: {currentUser?.referral_code}
                </span>
              </div>

              <Button 
                onClick={shareLink}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 gap-2"
              >
                <Share2 className="w-4 h-4" />
                {t('referrals.shareLink')}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-3 gap-4"
        >
          {stats.map((stat, index) => (
            <Card key={index} className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Referral History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-2 border-slate-200 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                {t('referrals.referralHistory')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 mb-2">
                    {t('referrals.noReferralsYet')}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t('referrals.shareToStart')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referrals.map((referral) => (
                    <div 
                      key={referral.id} 
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {referral.referred_email || t('referrals.newUser')}
                          </p>
                          <p className="text-sm text-slate-500">
                            {referral.created_at ? new Date(referral.created_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                      </div>
                      <Badge className={
                        referral.status === 'rewarded' 
                          ? 'bg-green-100 text-green-800' 
                          : referral.status === 'completed'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }>
                        {referral.status === 'rewarded' 
                          ? t('referrals.rewarded')
                          : referral.status === 'completed'
                          ? t('referrals.completed')
                          : t('referrals.pending')
                        }
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}