import Dashboard from './pages/Dashboard';
import NewAnalysis from './pages/NewAnalysis';
import Reports from './pages/Reports';
import AnalysisResult from './pages/AnalysisResult';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Credits from './pages/Credits';
import AdminCredits from './pages/AdminCredits';
import AdminPayments from './pages/AdminPayments';
import Subscriptions from './pages/Subscriptions';
import RoleManagement from './pages/RoleManagement';
import UserRoleAssignment from './pages/UserRoleAssignment';
import PaymentAnalytics from './pages/PaymentAnalytics';
import AuditLogs from './pages/AuditLogs';
import AIAssistant from './pages/AIAssistant';
import Notifications from './pages/Notifications';
import SharedReport from './pages/SharedReport';
import Referrals from './pages/Referrals';
import EmailTemplates from './pages/EmailTemplates';
import AdminNotifications from './pages/AdminNotifications';
import AdminDiscounts from './pages/AdminDiscounts';
import AdminSettings from './pages/AdminSettings';
import AdminReports from './pages/AdminReports';
import AdminReferrals from './pages/AdminReferrals';
import AdminUsers from './pages/AdminUsers';
import AdminCurrencies from './pages/AdminCurrencies';
import NGODashboard from './pages/NGODashboard';
import AdminNGORequests from './pages/AdminNGORequests';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "NewAnalysis": NewAnalysis,
    "Reports": Reports,
    "AnalysisResult": AnalysisResult,
    "Profile": Profile,
    "UserProfile": UserProfile,
    "Credits": Credits,
    "AdminCredits": AdminCredits,
    "AdminPayments": AdminPayments,
    "Subscriptions": Subscriptions,
    "RoleManagement": RoleManagement,
    "UserRoleAssignment": UserRoleAssignment,
    "PaymentAnalytics": PaymentAnalytics,
    "AuditLogs": AuditLogs,
    "AIAssistant": AIAssistant,
    "Notifications": Notifications,
    "SharedReport": SharedReport,
    "Referrals": Referrals,
    "EmailTemplates": EmailTemplates,
    "AdminNotifications": AdminNotifications,
    "AdminDiscounts": AdminDiscounts,
    "AdminSettings": AdminSettings,
    "AdminReports": AdminReports,
    "AdminReferrals": AdminReferrals,
    "AdminUsers": AdminUsers,
    "AdminCurrencies": AdminCurrencies,
    "NGODashboard": NGODashboard,
    "AdminNGORequests": AdminNGORequests,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};