import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/api/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState(token ? "verifying" : "pending");
  const [isResending, setIsResending] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await auth.verifyEmail(token);
      if (response.token) {
        auth.setToken(response.token);
        setUser(response.user);
      }
      setStatus("success");
      toast.success(response.message || t('auth.emailVerified'));
      setTimeout(() => {
        navigate("/Dashboard");
      }, 2000);
    } catch (error) {
      setStatus("error");
      toast.error(error.message || t('auth.verificationFailed'));
    }
  };

  const handleResendVerification = async () => {
    const email = localStorage.getItem("pending_verification_email");
    if (!email) {
      toast.error(t('auth.emailRequired'));
      navigate("/Register");
      return;
    }

    setIsResending(true);
    try {
      const response = await auth.resendVerification(email);
      toast.success(response.message || t('auth.verificationResent'));
    } catch (error) {
      toast.error(error.message || t('common.error'));
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case "verifying":
        return (
          <>
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4">
                <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
              </div>
              <CardTitle className="text-2xl font-bold">{t('auth.verifyingEmail') || 'Verifying your email...'}</CardTitle>
              <CardDescription>
                {t('auth.pleaseWait') || 'Please wait while we verify your email address.'}
              </CardDescription>
            </CardHeader>
          </>
        );

      case "success":
        return (
          <>
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-600">{t('auth.emailVerified') || 'Email Verified!'}</CardTitle>
              <CardDescription>
                {t('auth.redirectingToDashboard') || 'Your email has been verified. Redirecting to dashboard...'}
              </CardDescription>
            </CardHeader>
          </>
        );

      case "error":
        return (
          <>
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-600">{t('auth.verificationFailed') || 'Verification Failed'}</CardTitle>
              <CardDescription>
                {t('auth.verificationExpired') || 'The verification link is invalid or has expired.'}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col space-y-4">
              <Button onClick={handleResendVerification} className="w-full" disabled={isResending}>
                {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('auth.resendVerification') || 'Resend Verification Email'}
              </Button>
              <Link to="/Login" className="text-sm text-center text-primary hover:underline">
                {t('auth.backToLogin') || 'Back to Login'}
              </Link>
            </CardFooter>
          </>
        );

      case "pending":
      default:
        return (
          <>
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4">
                <Mail className="h-16 w-16 text-blue-500" />
              </div>
              <CardTitle className="text-2xl font-bold">{t('auth.checkYourEmail') || 'Check Your Email'}</CardTitle>
              <CardDescription>
                {t('auth.verificationEmailSent') || 'We have sent a verification link to your email address. Please click the link to verify your account.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {t('auth.didntReceiveEmail') || "Didn't receive the email? Check your spam folder or click below to resend."}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button onClick={handleResendVerification} variant="outline" className="w-full" disabled={isResending}>
                {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('auth.resendVerification') || 'Resend Verification Email'}
              </Button>
              <Link to="/Login" className="text-sm text-center text-primary hover:underline">
                {t('auth.backToLogin') || 'Back to Login'}
              </Link>
            </CardFooter>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <Card className="w-full max-w-md">
        {renderContent()}
      </Card>
    </div>
  );
}
