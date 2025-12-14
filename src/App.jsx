import './App.css'
import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import PlanlyzeAIPage from '@/landing/pages/PlanlyzeAI';
import PrivacyPolicyPage from '@/landing/pages/PrivacyPolicy';
import IdeaSecurityPage from '@/landing/pages/IdeaSecurity';
import i18n from '@/i18n/config';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : () => <div>Welcome</div>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/Dashboard" replace />;
  }

  return children;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/Login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/Register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      {/* Public legal / info pages */}
      <Route path="/PrivacyPolicy" element={<PrivacyPolicyPage />} />
      <Route path="/IdeaSecurity" element={<IdeaSecurityPage />} />
      <Route path="/" element={
        (() => {
          // If user is authenticated show main protected page, otherwise show landing
          const AuthSwitch = () => {
            const { isAuthenticated, isLoadingAuth } = useAuth();
            if (isLoadingAuth) return (
              <div className="fixed inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
              </div>
            );
            if (isAuthenticated) {
              return (
                <ProtectedRoute>
                  <LayoutWrapper currentPageName={mainPageKey}>
                    <MainPage />
                  </LayoutWrapper>
                </ProtectedRoute>
              );
            }
            return <PlanlyzeAIPage />;
          };

          return <AuthSwitch />
        })()
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route 
          key={path} 
          path={`/${path}`} 
          element={
            path === 'SharedReport' ? (
              <Page />
            ) : (
              <ProtectedRoute>
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              </ProtectedRoute>
            )
          } 
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  useEffect(() => {
    const lang = i18n.language || 'ar';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    const handleLanguageChange = (newLang) => {
      document.documentElement.lang = newLang;
      document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    return () => i18n.off('languageChanged', handleLanguageChange);
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
