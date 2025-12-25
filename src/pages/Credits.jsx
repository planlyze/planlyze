import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User, Transaction, CreditPackage, Settings, auth, api } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Wallet, Sparkles, Package, ArrowLeft, Banknote, 
  Crown, Gift, Rocket, CheckCircle2, Plus, Minus,
  History, TrendingUp, TrendingDown, Clock, CreditCard,
  ArrowUpRight, ArrowDownRight, Zap, Star, Briefcase, Globe
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import CashPaymentModal from "@/components/credits/CashPaymentModal";
import PageLoader from "@/components/common/PageLoader";
import { format } from "date-fns";

export default function Credits() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [packages, setPackages] = useState([]);  
  const [isLoading, setIsLoading] = useState(true);
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [hoveredPackage, setHoveredPackage] = useState(null);
  const [packageQuantities, setPackageQuantities] = useState({});
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);  

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
      
      const initialQuantities = {};
      pkgs.forEach(pkg => {
        initialQuantities[pkg.id] = 1;
      });
      setPackageQuantities(initialQuantities);
      
      try {
        const currencyResponse = await api.get('/currencies');
        const currencyList = Array.isArray(currencyResponse) ? currencyResponse : (currencyResponse?.data || []);
        setCurrencies(currencyList);
        if (currencyList.length > 0) {
          const defaultCurrency = currencyList.find(c => c.is_default) || currencyList.find(c => c.code === 'USD') || currencyList[0];
          if (defaultCurrency) {
            setSelectedCurrency(defaultCurrency);
          }
        }
      } catch (currencyError) {
        console.error("Error loading currencies:", currencyError);
        setCurrencies([]);
      }
      
    } catch (error) {
      console.error("Error loading credits data:", error);
      await User.loginWithRedirect(window.location.href);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatConvertedPrice = (usdAmount) => {
    if (!selectedCurrency || selectedCurrency.code === 'USD') return null;
    const converted = usdAmount * selectedCurrency.exchange_rate;
    return `${selectedCurrency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const updateQuantity = (pkgId, delta) => {
    setPackageQuantities(prev => ({
      ...prev,
      [pkgId]: Math.max(1, (prev[pkgId] || 1) + delta)
    }));
  };

  const handleCashPayment = (pkg) => {
    const quantity = packageQuantities[pkg.id] || 1;
    setSelectedPackage({
      ...pkg,
      credits: pkg.credits * quantity,
      price: pkg.price_usd * quantity,
      price_usd: pkg.price_usd * quantity
    });
    setCashModalOpen(true);
  };

  const isArabic = i18n.language === 'ar' || currentUser?.preferred_language === 'arabic';
  const credits = currentUser?.credits || 0;
 

  if (isLoading) {
    return <PageLoader isArabic={isArabic} />;
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
           
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-3">
              {t('credits.choosePlan')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              {t('credits.investSuccess')}
            </p>
            
            {/* Currency Selector */}
            {currencies.length > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <Globe className="w-5 h-5 text-purple-500" />
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {isArabic ? "عرض الأسعار بعملة:" : "View prices in:"}
                </span>
                <Select
                  value={selectedCurrency?.code || 'USD'}
                  onValueChange={(code) => {
                    const currency = currencies.find(c => c.code === code);
                    setSelectedCurrency(currency);
                  }}
                >
                  <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-700">
                    <SelectValue placeholder={isArabic ? "اختر العملة" : "Select currency"} />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code} className="dark:text-white dark:focus:bg-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{currency.symbol}</span>
                          <span>{isArabic ? currency.name_ar || currency.name : currency.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {packages.length === 0 ? (
              <div className="col-span-2 text-center py-16">
                <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg">{t('credits.noPackages')}</p>
              </div>
            ) : (
              packages.map((pkg, index) => {
                const isPopular = pkg.is_popular;
                const isHovered = hoveredPackage === pkg.id;
                const quantity = packageQuantities[pkg.id] || 1;
                const totalCredits = pkg.credits * quantity;
                const totalPrice = pkg.price_usd * quantity;
                const originalPrice = pkg.original_price_usd ? pkg.original_price_usd * quantity : null;
                const savingsPercent = originalPrice ? Math.round(((originalPrice - totalPrice) / originalPrice) * 100) : null;
                
                if (isPopular) {
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
                      <Card className={`relative h-full transition-all duration-500 overflow-hidden rounded-3xl ${
                        isHovered ? 'transform -translate-y-2' : ''
                      } border-2 border-purple-400 dark:border-purple-600 shadow-2xl hover:shadow-purple-500/30`}>
                        
                        {/* Save Badge - Top Right */}
                        {savingsPercent && savingsPercent > 0 && (
                          <div className="absolute top-4 right-4 z-10">
                            <Badge className="bg-red-500 hover:bg-red-500 text-white px-3 py-1.5 text-sm font-bold rounded-lg shadow-lg">
                              {t('credits.save', { percent: savingsPercent })}
                            </Badge>
                          </div>
                        )}
                        
                        {/* Purple Gradient Header */}
                        <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 px-6 py-8 text-center relative">
                          <Crown className="w-10 h-10 mx-auto mb-3 text-white/90" />
                          <h3 className="text-2xl font-bold text-white mb-1">
                            {isArabic ? (pkg.name_ar || pkg.name) : pkg.name}
                          </h3>
                          <span className="text-green-400 font-semibold text-sm">
                            {isArabic ? pkg.badge_ar || t('credits.bestValue') : pkg.badge_en || t('credits.bestValue')}
                          </span>
                        </div>

                        <CardContent className="p-6 bg-white dark:bg-gray-900">
                          {/* Description with credits and discount */}
                          <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 text-sm mb-6">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            <span>{isArabic ? (pkg.description_ar || pkg.description) : pkg.description}</span>
                          </div>

                          {/* Price Display - Large */}
                          <div className="text-center mb-6 py-4">
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-lg font-medium text-green-500">$</span>
                              <span className="text-6xl font-bold text-green-500">
                                {totalPrice}
                              </span>
                            </div>
                            {originalPrice && (
                              <p className="text-slate-400 text-lg line-through mt-1">
                                ${originalPrice}
                              </p>
                            )}
                            {formatConvertedPrice(totalPrice) && (
                              <div className="mt-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg px-4 py-2 inline-block">
                                <span className="text-purple-600 dark:text-purple-300 font-semibold text-lg">
                                  ≈ {formatConvertedPrice(totalPrice)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Features List */}
                          <ul className="space-y-3 mb-6">
                            {(isArabic ? (pkg.features_ar?.length ? pkg.features_ar : pkg.features) : pkg.features)?.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                            {(!pkg.features || pkg.features.length === 0) && (
                              <>
                                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  <span>{t('credits.detailedCompetitor')}</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  <span>{t('credits.syrianMarketData')}</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  <span>{t('credits.aiRecommendations')}</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  <span>{t('credits.aiAssistant')}</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  <span>{t('credits.exportFormats')}</span>
                                </li>
                              </>
                            )}
                          </ul>

                          {/* CTA Button */}
                          <Button
                            onClick={() => handleCashPayment(pkg)}
                            className="w-full h-14 text-lg font-semibold rounded-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            {t('credits.purchaseNow')}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                }
                
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
                    <Card className={`relative h-full transition-all duration-500 overflow-hidden rounded-3xl ${
                      isHovered ? 'transform -translate-y-2' : ''
                    } border-2 border-purple-200 dark:border-purple-800 shadow-xl hover:shadow-2xl`}>
                      
                      {/* Purple Header */}
                      <div className="bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-800/20 px-6 py-6 text-center">
                        <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-purple-200 dark:bg-purple-800">
                          <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          {isArabic ? (pkg.name_ar || pkg.name) : pkg.name}
                        </h3>
                      </div>

                      <CardContent className="p-6 bg-white dark:bg-gray-900">
                        {/* Description */}
                        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">
                          {isArabic ? (pkg.description_ar || pkg.description) : pkg.description}
                        </p>

                        {/* Quantity Selector & Price */}
                        <div className="flex flex-col items-center gap-3 mb-6 py-4 border-y border-slate-100 dark:border-gray-700">
                          <div className="flex items-center justify-center gap-4">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(pkg.id, -1)}
                              disabled={quantity <= 1}
                              className="h-10 w-10 rounded-full border-2 border-slate-300 dark:border-gray-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            
                            <div className="text-center">
                              <div className="flex items-baseline justify-center gap-1">
                                <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                                  {totalCredits}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 text-sm">{t('credits.credit')}</span>
                                <span className="text-slate-400 dark:text-slate-500 mx-1">/</span>
                                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                  ${totalPrice}
                                </span>
                              </div>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(pkg.id, 1)}
                              className="h-10 w-10 rounded-full border-2 border-slate-300 dark:border-gray-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          {formatConvertedPrice(totalPrice) && (
                            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg px-4 py-2">
                              <span className="text-purple-600 dark:text-purple-300 font-semibold">
                                ≈ {formatConvertedPrice(totalPrice)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Features List */}
                        <ul className="space-y-3 mb-6">
                          {(isArabic ? (pkg.features_ar?.length ? pkg.features_ar : pkg.features) : pkg.features)?.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                          {(!pkg.features || pkg.features.length === 0) && (
                            <>
                              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>{t('credits.detailedCompetitor')}</span>
                              </li>
                              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>{t('credits.syrianMarketData')}</span>
                              </li>
                              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>{t('credits.aiRecommendations')}</span>
                              </li>
                              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>{t('credits.aiAssistant')}</span>
                              </li>
                              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>{t('credits.exportFormats')}</span>
                              </li>
                            </>
                          )}
                        </ul>

                        {/* CTA Button */}
                        <Button
                          onClick={() => handleCashPayment(pkg)}
                          className="w-full h-14 text-lg font-semibold rounded-full bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/50 dark:hover:bg-purple-800/70 text-green-600 dark:text-green-400 transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                          {t('credits.purchaseNow')}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>

       
 

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