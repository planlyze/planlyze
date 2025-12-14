import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/api/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, Mail, KeyRound } from "lucide-react";

export default function VerifyEmail() {
  const [status, setStatus] = useState("pending");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

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
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              {t('auth.emailVerified') || 'Email Verified!'}
            </CardTitle>
            <CardDescription>
              {t('auth.redirectingToDashboard') || 'Your email has been verified. Redirecting to dashboard...'}
            </CardDescription>
          </CardHeader>
        </>
      );
    }

    return (
      <>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4">
            <KeyRound className="h-16 w-16 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t('auth.enterVerificationCode') || 'Enter Verification Code'}
          </CardTitle>
          <CardDescription>
            {t('auth.codeSentTo') || 'We sent a 6-digit code to'}{' '}
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-2" dir="ltr" onPaste={handlePaste}>
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
                className="w-12 h-14 text-center text-2xl font-bold"
                disabled={isVerifying}
              />
            ))}
          </div>
          {status === "error" && (
            <div className="flex items-center justify-center gap-2 text-red-500 text-sm">
              <XCircle className="h-4 w-4" />
              <span>{t('auth.invalidCode') || 'Invalid or expired code. Please try again.'}</span>
            </div>
          )}
          {isVerifying && (
            <div className="flex items-center justify-center gap-2 text-blue-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t('auth.verifyingEmail') || 'Verifying...'}</span>
            </div>
          )}
          <p className="text-sm text-center text-muted-foreground">
            {t('auth.didntReceiveCode') || "Didn't receive the code? Check your spam folder or click below to resend."}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            onClick={handleResendVerification}
            variant="outline"
            className="w-full"
            disabled={isResending || isVerifying}
          >
            {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            {t('auth.resendCode') || 'Resend Code'}
          </Button>
          <Link to="/Login" className="text-sm text-center text-primary hover:underline">
            {t('auth.backToLogin') || 'Back to Login'}
          </Link>
        </CardFooter>
      </>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <Card className="w-full max-w-md">
        {renderContent()}
      </Card>
    </div>
  );
}
