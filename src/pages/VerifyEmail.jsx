import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/api/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, KeyRound, RefreshCw } from "lucide-react";
import planLyzeLogo from "@assets/Main_logo-04_1766053107732.png";

export default function VerifyEmail() {
  const [status, setStatus] = useState("pending");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const email = localStorage.getItem("pending_verification_email");

  useEffect(() => {
    if (!email) {
      navigate("/Register");
    }
  }, [email, navigate]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit !== "") && newOtp.join("").length === 6) {
      verifyEmail(newOtp.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      verifyEmail(pastedData);
    }
  };

  const verifyEmail = async (code) => {
    if (!email) {
      toast.error(t('auth.emailRequired') || 'Email is required');
      navigate("/Register");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await auth.verifyEmail(email, code);
      if (response.token) {
        auth.setToken(response.token);
        setUser(response.user);
        localStorage.removeItem("pending_verification_email");
      }
      setStatus("success");
      toast.success(response.message || t('auth.emailVerified') || 'Email verified successfully!');
      setTimeout(() => {
        navigate("/Dashboard");
      }, 2000);
    } catch (error) {
      setStatus("error");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      toast.error(error.message || t('auth.verificationFailed') || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error(t('auth.emailRequired') || 'Email is required');
      navigate("/Register");
      return;
    }

    setIsResending(true);
    try {
      const response = await auth.resendVerification(email);
      setOtp(["", "", "", "", "", ""]);
      setStatus("pending");
      inputRefs.current[0]?.focus();
      toast.success(response.message || t('auth.verificationResent') || 'Verification code sent');
    } catch (error) {
      toast.error(error.message || t('common.error') || 'An error occurred');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    if (status === "success") {
      return (
        <>
          <CardHeader className="space-y-1 text-center pb-4">
            <div className="mx-auto mb-4">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('auth.emailVerified') || 'Email Verified!'}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {t('auth.redirectingToDashboard') || 'Your email has been verified. Redirecting to dashboard...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center gap-2 text-green-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t('common.redirecting') || 'Redirecting...'}</span>
            </div>
          </CardContent>
        </>
      );
    }

    return (
      <>
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="mx-auto mb-4">
            <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <KeyRound className="h-10 w-10 text-orange-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('auth.enterVerificationCode') || 'Enter Verification Code'}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {t('auth.codeSentTo') || 'We sent a 6-digit code to'}{' '}
            <span className="font-semibold text-orange-500">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3" dir="ltr" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-11 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-gray-50 dark:bg-gray-700 border-2 text-gray-900 dark:text-white transition-all duration-300 ${
                  digit ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-600'
                } ${status === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 animate-shake' : ''} focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
                disabled={isVerifying}
              />
            ))}
          </div>
          
          {status === "error" && (
            <div className="flex items-center justify-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 py-2 px-4 rounded-lg border border-red-200 dark:border-red-800">
              <XCircle className="h-4 w-4" />
              <span>{t('auth.invalidCode') || 'Invalid or expired code. Please try again.'}</span>
            </div>
          )}
          
          {isVerifying && (
            <div className="flex items-center justify-center gap-2 text-orange-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-medium">{t('auth.verifyingEmail') || 'Verifying...'}</span>
            </div>
          )}
          
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            {t('auth.didntReceiveCode') || "Didn't receive the code? Check your spam folder or click below to resend."}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button
            onClick={handleResendVerification}
            variant="outline"
            className="w-full h-12 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all duration-300 hover:scale-[1.02] rounded-full group"
            disabled={isResending || isVerifying}
          >
            {isResending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
            )}
            {t('auth.resendCode') || 'Resend Code'}
          </Button>
          <Link 
            to="/Login" 
            className="text-sm text-center text-orange-500 hover:text-orange-600 font-semibold hover:underline transition-colors duration-200 flex items-center justify-center gap-1"
          >
            ← {t('auth.backToLogin') || 'Back to Login'}
          </Link>
        </CardFooter>
      </>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center justify-center mb-3">
            <img src={planLyzeLogo} alt="Planlyze" className="w-16 h-16 object-contain" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planlyze</h1>
        </div>

        <Card className="border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-800">
          {renderContent()}
        </Card>

        <p className="text-center mt-6 text-gray-500 text-sm">
          <Link to="/" className="hover:text-orange-500 transition-colors duration-200">
            ← {t('common.backToHome') || 'Back to Home'}
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
