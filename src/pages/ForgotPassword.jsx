import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "@/api/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import planLyzeLogo from "@assets/Main_logo-04_1766053107732.png";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error(t('auth.emailRequired'));
      return;
    }
    setIsLoading(true);
    try {
      await auth.forgotPasswordRequest(email);
      toast.success(t('forgotPassword.codeSent'));
      setStep(2);
      setResendTimer(60);
    } catch (error) {
      toast.error(error.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error(t('auth.invalidCode'));
      return;
    }
    setIsLoading(true);
    try {
      await auth.forgotPasswordVerify(email, code);
      toast.success(t('forgotPassword.codeVerified'));
      setStep(3);
    } catch (error) {
      toast.error(error.message || t('auth.invalidCode'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error(t('auth.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordsDoNotMatch'));
      return;
    }
    setIsLoading(true);
    try {
      await auth.forgotPasswordReset(email, code, newPassword);
      toast.success(t('forgotPassword.passwordResetSuccess'));
      navigate("/Login");
    } catch (error) {
      toast.error(error.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    try {
      await auth.forgotPasswordRequest(email);
      toast.success(t('forgotPassword.codeSent'));
      setResendTimer(60);
    } catch (error) {
      toast.error(error.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <form onSubmit={handleRequestCode}>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">
            {t('auth.email')}
          </Label>
          <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
            <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'email' ? 'text-orange-500' : 'text-gray-400'}`} />
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              className={`${isRTL ? 'pr-11' : 'pl-11'} h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300`}
              required
              dir="ltr"
            />
          </div>
        </div>
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
              <span>{t('forgotPassword.sendCode')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          )}
        </Button>
      </CardFooter>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={handleVerifyCode}>
      <CardContent className="space-y-5">
        <div className="text-center mb-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {t('forgotPassword.codeSentTo')} <span className="font-medium text-orange-500">{email}</span>
          </p>
        </div>
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            className="gap-2"
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot 
                  key={index} 
                  index={index} 
                  className="w-12 h-14 text-xl font-bold border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <div className="text-center">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendTimer > 0 || isLoading}
            className={`text-sm ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-orange-500 hover:text-orange-600 hover:underline cursor-pointer'} transition-colors`}
          >
            {resendTimer > 0 
              ? `${t('forgotPassword.resendIn')} ${resendTimer}s`
              : t('forgotPassword.resendCode')
            }
          </button>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 pt-2">
        <Button 
          type="submit" 
          className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.02] rounded-full group" 
          disabled={isLoading || code.length !== 6}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>{t('common.loading')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{t('forgotPassword.verifyCode')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          )}
        </Button>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-sm text-gray-500 hover:text-orange-500 flex items-center justify-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('forgotPassword.changeEmail')}
        </button>
      </CardFooter>
    </form>
  );

  const renderStep3 = () => (
    <form onSubmit={handleResetPassword}>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300 font-medium">
            {t('forgotPassword.newPassword')}
          </Label>
          <div className={`relative transition-all duration-300 ${focusedField === 'newPassword' ? 'scale-[1.02]' : ''}`}>
            <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'newPassword' ? 'text-orange-500' : 'text-gray-400'}`} />
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={() => setFocusedField('newPassword')}
              onBlur={() => setFocusedField(null)}
              className={`${isRTL ? 'pr-11 pl-11' : 'pl-11 pr-11'} h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300`}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors duration-200`}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300 font-medium">
            {t('forgotPassword.confirmPassword')}
          </Label>
          <div className={`relative transition-all duration-300 ${focusedField === 'confirmPassword' ? 'scale-[1.02]' : ''}`}>
            <KeyRound className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'confirmPassword' ? 'text-orange-500' : 'text-gray-400'}`} />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => setFocusedField(null)}
              className={`${isRTL ? 'pr-11 pl-11' : 'pl-11 pr-11'} h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300`}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors duration-200`}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {newPassword && confirmPassword && newPassword === confirmPassword && (
            <p className="text-sm text-green-500 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              {t('forgotPassword.passwordsMatch')}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 pt-2">
        <Button 
          type="submit" 
          className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.02] rounded-full group" 
          disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>{t('common.loading')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{t('forgotPassword.resetPassword')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          )}
        </Button>
      </CardFooter>
    </form>
  );

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return t('forgotPassword.title');
      case 2:
        return t('forgotPassword.verifyTitle');
      case 3:
        return t('forgotPassword.resetTitle');
      default:
        return t('forgotPassword.title');
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1:
        return t('forgotPassword.description');
      case 2:
        return t('forgotPassword.verifyDescription');
      case 3:
        return t('forgotPassword.resetDescription');
      default:
        return t('forgotPassword.description');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-4">
            <img src={planLyzeLogo} alt="Planlyze" className="w-20 h-20 object-contain" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Planlyze</h1>
        </div>

        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step >= s 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-8 h-1 rounded transition-all duration-300 ${
                    step > s ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Card className="border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-800">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              {getStepTitle()}
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              {getStepDescription()}
            </CardDescription>
          </CardHeader>
          
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </Card>

        <p className="text-center mt-6 text-gray-500 text-sm">
          <Link to="/Login" className="hover:text-orange-500 transition-colors duration-200">
            ← {t('forgotPassword.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
}
