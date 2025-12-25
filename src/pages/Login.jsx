import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/api/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import planLyzeLogo from "@assets/Main_logo-04_1766053107732.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success(t('common.success'), { duration: 1000 });
      navigate("/Dashboard");
    } catch (error) {
      if (error.data?.requires_verification) {
        localStorage.setItem("pending_verification_email", error.data.email || email);
        toast.error(error.message || t('auth.verificationRequired'), { duration: 1000 });
        navigate("/verify-email");
      } else {
        toast.error(error.message || t('auth.invalidCredentials'), { duration: 1000 });
      }
    } finally {
      setIsLoading(false);
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
          <p className="text-gray-600 dark:text-gray-400">{t('auth.loginDescription') || 'Welcome back! Sign in to continue.'}</p>
        </div>

        <Card className="border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-800">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">{t('auth.loginTitle')}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
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
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">{t('auth.password')}</Label>
                  <Link to="/forgot-password" className="text-sm text-orange-500 hover:text-orange-600 hover:underline transition-colors duration-200">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
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
                    autoComplete="current-password"
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
                    <span>{t('auth.login')}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                )}
              </Button>
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                {t('auth.noAccount')}{" "}
                <Link to="/Register" className="text-orange-500 hover:text-orange-600 font-semibold hover:underline transition-colors duration-200">
                  {t('auth.register')}
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
