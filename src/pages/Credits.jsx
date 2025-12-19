import React, { useState, useEffect } from "react";
import { User, Transaction, CreditPackage, auth } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wallet, Sparkles, Package, ArrowLeft, Banknote, 
  Crown, Gift, Rocket, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CashPaymentModal from "@/components/credits/CashPaymentModal";

export default function Credits() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [hoveredPackage, setHoveredPackage] = useState(null);

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

  const isArabic = currentUser?.preferred_language === 'arabic';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-orange-50/20" dir={isArabic ? 'rtl' : 'ltr'}>
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
              className="shadow-md hover:shadow-lg transition-all border-slate-300 hover:border-purple-400 bg-white/80 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-orange-600">
                {isArabic ? "المحفظة والأرصدة" : "Credits & Pricing"}
              </h1>
              <p className="text-slate-600 mt-1">
                {isArabic ? "افتح القوة الكاملة لتحليلات Planlyze" : "Unlock the full power of Planlyze analytics"}
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
                        {isArabic ? "رصيدك المتاح" : "Available Balance"}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl md:text-6xl font-bold text-white">{credits}</span>
                        <span className="text-purple-200 text-lg">
                          {isArabic ? "رصيد" : credits === 1 ? "credit" : "credits"}
                        </span>
                      </div>
                      <p className="text-purple-200 mt-2 text-sm md:text-base">
                        {credits === 0 
                          ? (isArabic ? "ابدأ رحلتك مع تقرير متميز" : "Start your journey with a premium report")
                          : (isArabic ? `جاهز لإنشاء ${credits} تقرير متميز` : `Ready to create ${credits} premium ${credits === 1 ? 'report' : 'reports'}`)
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
                        {isArabic ? "احصل على أرصدة" : "Get Credits"}
                      </Button>
                    )}
                    <Button 
                      variant="ghost"
                      onClick={() => navigate(createPageUrl("NewAnalysis"))}
                      className="text-white hover:bg-white/10 border border-white/20"
                    >
                      <Rocket className="w-4 h-4 mr-2" />
                      {isArabic ? "ابدأ تحليل جديد" : "Start New Analysis"}
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
            <Badge className="bg-purple-100 text-purple-700 mb-4 px-4 py-1.5 text-sm font-medium">
              <Gift className="w-4 h-4 mr-1 inline" />
              {isArabic ? "عروض خاصة" : "Special Offers"}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
              {isArabic ? "اختر الباقة المناسبة لك" : "Choose Your Perfect Plan"}
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              {isArabic 
                ? "استثمر في نجاح مشروعك مع تحليلات احترافية بأسعار تنافسية"
                : "Invest in your project's success with professional analytics at competitive prices"
              }
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {packages.length === 0 ? (
              <div className="col-span-2 text-center py-16">
                <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg">{isArabic ? "لا توجد باقات متاحة حاليًا" : "No packages available at the moment"}</p>
              </div>
            ) : (
              packages.map((pkg, index) => {
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
                        : 'border-2 border-slate-200 hover:border-purple-300 shadow-xl hover:shadow-2xl'
                    } ${isHovered ? 'transform -translate-y-2' : ''}`}>
                      
                      {/* Popular Badge */}
                      {isPopular && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-2 text-sm font-semibold">
                          <Crown className="w-4 h-4 inline mr-1" />
                          {isArabic ? pkg.badge_ar || "الأكثر شعبية" : pkg.badge_en || "Most Popular"}
                        </div>
                      )}
                      
                      {/* Savings Badge */}
                      {savings && (
                        <div className="absolute top-4 right-4 z-10">
                          <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 text-sm font-bold shadow-lg">
                            {isArabic ? `وفر ${savings.percent}%` : `Save ${savings.percent}%`}
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
                          <h3 className="text-2xl font-bold text-slate-800 mb-2">
                            {isArabic ? (pkg.name_ar || pkg.name) : pkg.name}
                          </h3>
                          <p className="text-slate-500 text-sm min-h-[40px]">
                            {isArabic ? (pkg.description_ar || pkg.description) : pkg.description}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="text-center mb-6 py-6 border-y border-slate-100">
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-2xl font-medium text-slate-500">$</span>
                            <span className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                              {pkg.price_usd}
                            </span>
                          </div>
                          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-200">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold text-purple-700">
                              {pkg.credits} {isArabic ? "رصيد متميز" : "premium credits"}
                            </span>
                          </div>
                        </div>

                        {/* Features List */}
                        <ul className="space-y-3 mb-8">
                          {(isArabic ? (pkg.features_ar?.length ? pkg.features_ar : pkg.features) : pkg.features)?.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-slate-600">
                              <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                          {(!pkg.features || pkg.features.length === 0) && (
                            <li className="flex items-center gap-3 text-slate-600">
                              <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                              <span>{isArabic ? "تقرير تحليل أعمال متكامل" : "Complete business analysis report"}</span>
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
                          {isArabic ? "اشتري الآن" : "Purchase Now"}
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