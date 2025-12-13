import { api, auth, Analysis, Transaction, CreditPackage, Payment, 
  EmailTemplate, PaymentMethod, DiscountCode, Role, AuditLog, 
  ActivityFeed, Notification, ReportShare, ChatConversation, 
  Referral, User, AI, InvokeLLM } from './client';

export const base44 = {
  auth: {
    me: auth.me,
    logout: () => {
      auth.removeToken();
      window.location.href = '/';
    },
    redirectToLogin: () => {
      window.location.href = '/login';
    },
    updateMyUserData: auth.updateProfile,
  },
  entities: {
    Analysis,
    Transaction,
    CreditPackage,
    Payment,
    EmailTemplate,
    PaymentMethod,
    DiscountCode,
    Role,
    AuditLog,
    ActivityFeed,
    Notification,
    ReportShare,
    ChatConversation,
    Referral,
    User,
    Query: {
      filter: async () => [],
    }
  },
  integrations: {
    Core: {
      InvokeLLM,
    }
  },
  functions: {
    invoke: async (name, params) => {
      return api.post(`/functions/${name}`, params);
    }
  }
};

export { api, auth };
