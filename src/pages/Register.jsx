import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { auth } from "@/api/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check, X, Gift } from "lucide-react";
import planLyzeLogo from "@assets/Main_logo-04_1766053107732.png";

export default function Register() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [referralCode, setReferralCode] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

  const passwordChecks = {
    length: password.length >= 6,
    match: password === confirmPassword && confirmPassword.length > 0
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error(t('auth.passwordsDontMatch'), { duration: 1000 });
      return;
    }

    if (password.length < 6) {
      toast.error(t('auth.passwordTooShort'), { duration: 1000 });
      return;
    }

    setIsLoading(true);

    try {
      const response = await auth.register({ 
        email, 
        password, 
        full_name: fullName,
        referral_code: referralCode 
      });
      localStorage.setItem("pending_verification_email", email);
      toast.success(response.message || t('auth.registrationSuccess'), { duration: 1000 });
      navigate("/verify-email");
    } catch (error) {
      toast.error(error.message || t('common.error'), { duration: 1000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center justify-center mb-4">
            <img src={planLyzeLogo} alt="Planlyze" className="w-20 h-20 object-contain" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Planlyze</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('auth.registerDescription') || 'Create your account to get started.'}</p>
        </div>

        <Card className="border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-800">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">{t('auth.registerTitle')}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {referralCode && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <Gift className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    {t('auth.referralBonus') || 'You\'ll get 1 bonus credit for signing up with a referral!'}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-700 dark:text-gray-300 font-medium">{t('auth.fullName')}</Label>
                <div className={`relative transition-all duration-300 ${focusedField === 'fullName' ? 'scale-[1.02]' : ''}`}>
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'fullName' ? 'text-orange-500' : 'text-gray-400'}`} />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={t('auth.fullName')}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedField('fullName')}
                    onBlur={() => setFocusedField(null)}
                    className="pl-11 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">{t('auth.email')}</Label>
                <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'email' ? 'text-orange-500' : 'text-gray-400'}`} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="pl-11 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">{t('auth.password')}</Label>
                <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'password' ? 'text-orange-500' : 'text-gray-400'}`} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="pl-11 pr-11 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300 font-medium">{t('auth.confirmPassword')}</Label>
                <div className={`relative transition-all duration-300 ${focusedField === 'confirmPassword' ? 'scale-[1.02]' : ''}`}>
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'confirmPassword' ? 'text-orange-500' : 'text-gray-400'}`} />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    className="pl-11 pr-11 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors duration-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {(password.length > 0 || confirmPassword.length > 0) && (
                <div className="space-y-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 text-sm">
                    {passwordChecks.length ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                    <span className={passwordChecks.length ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {t('auth.passwordMinLength') || 'At least 6 characters'}
                    </span>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      {passwordChecks.match ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                      <span className={passwordChecks.match ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {t('auth.passwordsMatch') || 'Passwords match'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.02] rounded-full group" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{t('common.loading')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{t('auth.register')}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                )}
              </Button>
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                {t('auth.haveAccount')}{" "}
                <Link to="/Login" className="text-orange-500 hover:text-orange-600 font-semibold hover:underline transition-colors duration-200">
                  {t('auth.login')}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center mt-6 text-gray-500 text-sm">
          <Link to="/" className="hover:text-orange-500 transition-colors duration-200">
            ← {t('common.backToHome') || 'Back to Home'}
          </Link>
        </p>
      </div>
    </div>
  );
}
