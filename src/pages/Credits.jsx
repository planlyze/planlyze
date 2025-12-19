import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User, Transaction, CreditPackage, Settings, auth } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wallet, Sparkles, Package, ArrowLeft, Banknote, 
  Crown, Gift, Rocket, CheckCircle2, Plus, Minus,
  History, TrendingUp, TrendingDown, Clock, CreditCard,
  ArrowUpRight, ArrowDownRight, Zap, Star
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import CashPaymentModal from "@/components/credits/CashPaymentModal";
import { format } from "date-fns";

export default function Credits() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [packages, setPackages] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [hoveredPackage, setHoveredPackage] = useState(null);
  const [customCredits, setCustomCredits] = useState(5);
  const [pricePerCredit, setPricePerCredit] = useState(1.99);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      const pkgs = await CreditPackage.filter({ is_active: true }, "price");
      setPackages(pkgs);
      
      const txns = await Transaction.filter({ user_email: user.email }, "-created_at");
      setTransactions(txns.slice(0, 10));
      
      const settings = await Settings.get();
      if (settings?.price_per_credit) {
        setPricePerCredit(parseFloat(settings.price_per_credit));
      }
    } catch (error) {
      console.error("Error loading credits data:", error);
      await User.loginWithRedirect(window.location.href);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCashPayment = (pkg) => {
    setSelectedPackage({
      ...pkg,
      price: pkg.price_usd
    });
    setCashModalOpen(true);
  };

  const handleCustomCreditsPayment = () => {
    const totalPrice = (customCredits * pricePerCredit).toFixed(2);
    setSelectedPackage({
      name: isArabic ? 'رصيد مخصص' : 'Custom Credits',
      name_ar: 'رصيد مخصص',
      credits: customCredits,
      price: parseFloat(totalPrice),
      price_usd: parseFloat(totalPrice),
      description: isArabic ? `${customCredits} رصيد لمحفظتك` : `${customCredits} credits for your wallet`,
      is_custom: true
    });
    setCashModalOpen(true);
  };

  const isArabic = i18n.language === 'ar' || currentUser?.preferred_language === 'arabic';
  const credits = currentUser?.premium_credits || 0;

  const calculateSavings = (pkg) => {
    if (packages.length < 2) return null;
    const singlePkg = packages.find(p => p.package_id === 'single');
    if (!singlePkg || pkg.package_id === 'single') return null;
    const regularPrice = singlePkg.price * pkg.credits;
    const savings = regularPrice - pkg.price;
    const percent = Math.round((savings / regularPrice) * 100);
    return savings > 0 ? { amount: savings, percent } : null;
  };









  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-purple-50/30 to-orange-50/20">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-80 rounded-xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-[480px] rounded-2xl" />
            <Skeleton className="h-[480px] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-orange-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-orange-500/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-4 md:px-8 pt-6 pb-12">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="shadow-md hover:shadow-lg transition-all border-slate-300 dark:border-gray-600 hover:border-purple-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-orange-600 dark:text-orange-500">
                {t('credits.title')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {t('credits.subtitle')}
              </p>
            </div>
          </motion.div>

          {/* Current Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <CardContent className="relative py-8 px-6 md:px-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-xl border border-white/20">
                      <Wallet className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <p className="text-purple-200 text-sm font-medium uppercase tracking-wider mb-1">
                        {t('credits.availableBalance')}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl md:text-6xl font-bold text-white">{credits}</span>
                        <span className="text-purple-200 text-lg">
                          {credits === 1 ? t('credits.credit') : t('credits.credits')}
                        </span>
                      </div>
                      <p className="text-purple-200 mt-2 text-sm md:text-base">
                        {credits === 0 
                          ? t('credits.startJourney')
                          : t(credits === 1 ? 'credits.readyToCreate' : 'credits.readyToCreatePlural', { count: credits })
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {credits === 0 && (
                      <Button 
                        onClick={() => document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-white text-purple-700 hover:bg-purple-50 shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-6 text-lg font-semibold group"
                      >
                        <Sparkles className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                        {t('credits.getCredits')}
                      </Button>
                    )}
                    <Button 
                      variant="ghost"
                      onClick={() => navigate(createPageUrl("NewAnalysis"))}
                      className="text-white hover:bg-white/10 border border-white/20"
                    >
                      <Rocket className="w-4 h-4 mr-2" />
                      {t('credits.startNewAnalysis')}
                    </Button>
                  </div>
                </div>


              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-16 space-y-16">
        
        {/* Pricing Section */}
        <section id="packages">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 mb-4 px-4 py-1.5 text-sm font-medium">
              <Gift className="w-4 h-4 mr-1 inline" />
              {t('credits.specialOffers')}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-3">
              {t('credits.choosePlan')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              {t('credits.investSuccess')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {packages.length === 0 ? (
              <div className="col-span-3 text-center py-16">
                <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg">{t('credits.noPackages')}</p>
              </div>
            ) : (
              <>
              {packages.map((pkg, index) => {
                const savings = calculateSavings(pkg);
                const isPopular = pkg.is_popular;
                const isHovered = hoveredPackage === pkg.id;
                
                return (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 }}
                    onMouseEnter={() => setHoveredPackage(pkg.id)}
                    onMouseLeave={() => setHoveredPackage(null)}
                  >
                    <Card className={`relative h-full transition-all duration-500 overflow-hidden ${
                      isPopular 
                        ? 'border-2 border-purple-500 shadow-2xl shadow-purple-500/20 scale-[1.02]' 
                        : 'border-2 border-slate-200 dark:border-gray-700 hover:border-purple-300 shadow-xl hover:shadow-2xl dark:bg-gray-800'
                    } ${isHovered ? 'transform -translate-y-2' : ''}`}>
                      
                      {/* Popular Badge */}
                      {isPopular && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-2 text-sm font-semibold">
                          <Crown className="w-4 h-4 inline mr-1" />
                          {isArabic ? pkg.badge_ar || t('credits.mostPopular') : pkg.badge_en || t('credits.mostPopular')}
                        </div>
                      )}
                      
                      {/* Savings Badge */}
                      {savings && (
                        <div className="absolute top-4 right-4 z-10">
                          <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 text-sm font-bold shadow-lg">
                            {t('credits.save', { percent: savings.percent })}
                          </Badge>
                        </div>
                      )}

                      <CardContent className={`p-8 ${isPopular ? 'pt-14' : ''}`}>
                        {/* Package Icon & Name */}
                        <div className="text-center mb-6">
                          <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg ${
                            isPopular 
                              ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                              : 'bg-gradient-to-br from-slate-100 to-slate-200'
                          }`}>
                            {isPopular 
                              ? <Package className={`w-8 h-8 ${isPopular ? 'text-white' : 'text-slate-600'}`} />
                              : <Sparkles className={`w-8 h-8 ${isPopular ? 'text-white' : 'text-slate-600'}`} />
                            }
                          </div>
                          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                            {isArabic ? (pkg.name_ar || pkg.name) : pkg.name}
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm min-h-[40px]">
                            {isArabic ? (pkg.description_ar || pkg.description) : pkg.description}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="text-center mb-6 py-6 border-y border-slate-100 dark:border-gray-700">
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-2xl font-medium text-slate-500 dark:text-slate-400">$</span>
                            <span className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                              {pkg.price_usd}
                            </span>
                          </div>
                          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700">
                            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="font-semibold text-purple-700 dark:text-purple-400">
                              {pkg.credits} {t('credits.premiumCredits')}
                            </span>
                          </div>
                        </div>

                        {/* Features List */}
                        <ul className="space-y-3 mb-8">
                          {(isArabic ? (pkg.features_ar?.length ? pkg.features_ar : pkg.features) : pkg.features)?.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                              <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                          {(!pkg.features || pkg.features.length === 0) && (
                            <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                              <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                              <span>{t('credits.completeReport')}</span>
                            </li>
                          )}
                        </ul>

                        {/* CTA Button */}
                        <Button
                          onClick={() => handleCashPayment(pkg)}
                          className={`w-full h-14 text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl group ${
                            isPopular 
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white' 
                              : 'bg-slate-800 hover:bg-slate-900 text-white'
                          }`}
                        >
                          <Banknote className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                          {t('credits.purchaseNow')}
                        </Button>


                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {/* Custom Credits Card - Inside Grid */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: packages.length * 0.15 }}
                onMouseEnter={() => setHoveredPackage('custom')}
                onMouseLeave={() => setHoveredPackage(null)}
              >
                <Card className={`relative h-full transition-all duration-500 overflow-hidden border-2 border-orange-400 shadow-xl hover:shadow-2xl hover:shadow-orange-500/20 bg-gradient-to-br from-white via-orange-50/30 to-amber-50/50 ${
                  hoveredPackage === 'custom' ? 'transform -translate-y-2 border-orange-500' : ''
                }`}>
                  
                  {/* Flexible Badge */}
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-center py-2 text-sm font-semibold">
                    <Wallet className="w-4 h-4 inline mr-1" />
                    {t('credits.customCreditsFlexible')}
                  </div>

                  <CardContent className="p-8 pt-14">
                    {/* Icon & Name */}
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg bg-gradient-to-br from-orange-500 to-amber-500 group-hover:scale-110 transition-transform">
                        <Wallet className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">
                        {t('credits.customCredits')}
                      </h3>
                      <p className="text-slate-500 text-sm min-h-[40px]">
                        {t('credits.customCreditsDesc')}
                      </p>
                    </div>

                    {/* Credit Selector */}
                    <div className="text-center mb-6 py-6 border-y border-orange-100">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCustomCredits(Math.max(1, customCredits - 1))}
                          disabled={customCredits <= 1}
                          className="h-10 w-10 rounded-full border-2 border-orange-300 hover:border-orange-500 hover:bg-orange-100 transition-all"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        
                        <Input
                          type="number"
                          value={customCredits}
                          onChange={(e) => setCustomCredits(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 h-12 text-center text-xl font-bold border-2 border-orange-300 focus:border-orange-500 rounded-xl bg-white"
                          min="1"
                        />
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCustomCredits(customCredits + 1)}
                          className="h-10 w-10 rounded-full border-2 border-orange-300 hover:border-orange-500 hover:bg-orange-100 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Quick Select Buttons */}
                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {[5, 10, 25, 50].map((num) => (
                          <Button
                            key={num}
                            variant="outline"
                            size="sm"
                            onClick={() => setCustomCredits(num)}
                            className={`px-3 py-1 text-xs rounded-full transition-all ${
                              customCredits === num 
                                ? 'bg-orange-500 text-white border-orange-500' 
                                : 'border-orange-200 hover:border-orange-400 hover:bg-orange-50'
                            }`}
                          >
                            {num}
                          </Button>
                        ))}
                      </div>

                      {/* Price Display */}
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-xl font-medium text-slate-500">$</span>
                        <span className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                          {(customCredits * pricePerCredit).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        ${pricePerCredit} {t('credits.perCredit')}
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-3 text-slate-600">
                        <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        <span>{t('credits.buyAnyAmount')}</span>
                      </li>
                      <li className="flex items-center gap-3 text-slate-600">
                        <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        <span>{t('credits.creditsNeverExpire')}</span>
                      </li>
                      <li className="flex items-center gap-3 text-slate-600">
                        <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        <span>{t('credits.useAnytime')}</span>
                      </li>
                    </ul>

                    {/* CTA Button */}
                    <Button
                      onClick={handleCustomCreditsPayment}
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                    >
                      <Banknote className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      {t('credits.topUpWallet')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
              </>
            )}
          </div>
        </section>

        {/* Transaction History Section */}
        {transactions.length > 0 && (
          <section>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-4 px-4 py-1.5 text-sm font-medium">
                <History className="w-4 h-4 mr-1 inline" />
                {t('credits.recentActivity')}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-3">
                {t('credits.transactionHistory')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                {t('credits.trackYourCredits')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-0 shadow-xl bg-white dark:bg-gray-800 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-900 border-b dark:border-gray-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                      {t('credits.creditTransactions')}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-slate-300">
                      {transactions.length} {t('credits.transactions')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y dark:divide-gray-700">
                    {(showAllTransactions ? transactions : transactions.slice(0, 5)).map((txn, index) => {
                      const isPositive = txn.credits > 0;
                      const isPending = txn.status === 'pending';
                      
                      return (
                        <motion.div
                          key={txn.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors ${isPending ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                              isPending 
                                ? 'bg-amber-100 dark:bg-amber-900/30' 
                                : isPositive 
                                  ? 'bg-green-100 dark:bg-green-900/30' 
                                  : 'bg-red-100 dark:bg-red-900/30'
                            }`}>
                              {isPending ? (
                                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                              ) : isPositive ? (
                                <ArrowDownRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                              ) : (
                                <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-white">
                                {txn.type === 'purchase' ? t('credits.creditPurchase') :
                                 txn.type === 'usage' ? t('credits.creditUsage') :
                                 txn.type === 'bonus' ? t('credits.bonusCredit') :
                                 txn.type === 'adjustment' ? t('credits.adjustment') :
                                 txn.type}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {txn.description || txn.notes || '-'}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                {txn.created_at ? format(new Date(txn.created_at), 'MMM dd, yyyy - h:mm a') : '-'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              isPending 
                                ? 'text-amber-600 dark:text-amber-400' 
                                : isPositive 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                            }`}>
                              {isPositive ? '+' : ''}{txn.credits} {t('credits.credits')}
                            </p>
                            <Badge className={`text-xs ${
                              isPending 
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                                : txn.status === 'completed' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {isPending ? t('credits.pending') : t('credits.completed')}
                            </Badge>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  {transactions.length > 5 && (
                    <div className="p-4 border-t dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50">
                      <Button
                        variant="ghost"
                        onClick={() => setShowAllTransactions(!showAllTransactions)}
                        className="w-full text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      >
                        {showAllTransactions ? t('credits.showLess') : t('credits.showMore', { count: transactions.length - 5 })}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </section>
        )}

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 w-32 h-32" />
            <CardContent className="p-5 text-center relative">
              <Wallet className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-bold">{currentUser?.credits || 0}</p>
              <p className="text-purple-200 text-sm">{t('credits.currentBalance')}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 w-32 h-32" />
            <CardContent className="p-5 text-center relative">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-bold">{transactions.filter(tx => tx.credits > 0 && tx.status === 'completed').reduce((sum, tx) => sum + tx.credits, 0)}</p>
              <p className="text-green-200 text-sm">{t('credits.totalEarned')}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white border-0 shadow-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 w-32 h-32" />
            <CardContent className="p-5 text-center relative">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-bold">{Math.abs(transactions.filter(tx => tx.credits < 0 && tx.status === 'completed').reduce((sum, tx) => sum + tx.credits, 0))}</p>
              <p className="text-orange-200 text-sm">{t('credits.totalUsed')}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-0 shadow-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 w-32 h-32" />
            <CardContent className="p-5 text-center relative">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-bold">{transactions.filter(tx => tx.status === 'completed').length}</p>
              <p className="text-indigo-200 text-sm">{t('credits.totalTransactions')}</p>
            </CardContent>
          </Card>
        </motion.div>


      </div>

      {/* Cash Payment Modal */}
      <CashPaymentModal
        isOpen={cashModalOpen}
        onClose={() => {
          setCashModalOpen(false);
          loadData();
        }}
        selectedPackage={selectedPackage}
        userEmail={currentUser?.email}
        isArabic={isArabic}
      />
    </div>
  );
}