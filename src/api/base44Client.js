// Re-export all API clients for backward compatibility during migration
export { api, auth, Analysis, Transaction, CreditPackage, Payment, 
  EmailTemplate, PaymentMethod, DiscountCode, Role, AuditLog, 
  ActivityFeed, Notification, ReportShare, ChatConversation, 
  Referral, User, AI, InvokeLLM } from './client';
