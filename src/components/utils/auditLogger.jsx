import { auth, api, Analysis, Payment, User, AI } from "@/api/client";

/**
 * Audit Logger Utility
 * Creates audit log entries for significant user actions
 */

export const auditLogger = {
  // Log credit purchase
  logCreditPurchase: async (userEmail, credits, amount, paymentId) => {
    try {
      await api.AuditLog.create({
        action_type: "credit_purchase",
        user_email: userEmail,
        performed_by: userEmail,
        description: `Purchased ${credits} credits for $${amount}`,
        metadata: {
          credits,
          amount_usd: amount,
          payment_id: paymentId
        },
        entity_id: paymentId,
        entity_type: "Payment"
      });
    } catch (error) {
      console.error("Failed to log credit purchase:", error);
    }
  },

  // Log credit usage
  logCreditUsage: async (userEmail, credits, analysisId, businessIdea) => {
    try {
      await api.AuditLog.create({
        action_type: "credit_usage",
        user_email: userEmail,
        performed_by: userEmail,
        description: `Used ${credits} credit(s) for analysis: ${businessIdea?.substring(0, 50)}...`,
        metadata: {
          credits,
          analysis_id: analysisId,
          business_idea: businessIdea
        },
        entity_id: analysisId,
        entity_type: "Analysis"
      });
    } catch (error) {
      console.error("Failed to log credit usage:", error);
    }
  },

  // Log admin credit adjustment
  logCreditAdjustment: async (adminEmail, userEmail, credits, isAddition, notes) => {
    try {
      const action = isAddition ? "added" : "deducted";
      await api.AuditLog.create({
        action_type: "credit_adjustment",
        user_email: userEmail,
        performed_by: adminEmail,
        description: `Admin ${action} ${Math.abs(credits)} credits. ${notes || ''}`,
        metadata: {
          credits,
          is_addition: isAddition,
          notes
        }
      });
    } catch (error) {
      console.error("Failed to log credit adjustment:", error);
    }
  },

  // Log payment approval
  logPaymentApproval: async (adminEmail, userEmail, paymentId, credits, amount) => {
    try {
      await api.AuditLog.create({
        action_type: "payment_approved",
        user_email: userEmail,
        performed_by: adminEmail,
        description: `Payment approved: ${credits} credits ($${amount})`,
        metadata: {
          credits,
          amount_usd: amount,
          payment_id: paymentId
        },
        entity_id: paymentId,
        entity_type: "Payment"
      });
    } catch (error) {
      console.error("Failed to log payment approval:", error);
    }
  },

  // Log payment rejection
  logPaymentRejection: async (adminEmail, userEmail, paymentId, reason) => {
    try {
      await api.AuditLog.create({
        action_type: "payment_rejected",
        user_email: userEmail,
        performed_by: adminEmail,
        description: `Payment rejected. Reason: ${reason}`,
        metadata: {
          payment_id: paymentId,
          reason
        },
        entity_id: paymentId,
        entity_type: "Payment"
      });
    } catch (error) {
      console.error("Failed to log payment rejection:", error);
    }
  },

  // Log payment submission
  logPaymentSubmission: async (userEmail, paymentId, credits, amount) => {
    try {
      await api.AuditLog.create({
        action_type: "payment_submitted",
        user_email: userEmail,
        performed_by: userEmail,
        description: `Submitted payment request: ${credits} credits ($${amount})`,
        metadata: {
          credits,
          amount_usd: amount,
          payment_id: paymentId
        },
        entity_id: paymentId,
        entity_type: "Payment"
      });
    } catch (error) {
      console.error("Failed to log payment submission:", error);
    }
  },

  // Log role assignment
  logRoleAssignment: async (adminEmail, userEmail, roleName, permissions) => {
    try {
      await api.AuditLog.create({
        action_type: "role_assigned",
        user_email: userEmail,
        performed_by: adminEmail,
        description: `Role assigned: ${roleName}`,
        metadata: {
          role_name: roleName,
          permissions
        }
      });
    } catch (error) {
      console.error("Failed to log role assignment:", error);
    }
  },

  // Log analysis creation
  logAnalysisCreation: async (userEmail, analysisId, businessIdea, isPremium) => {
    try {
      await api.AuditLog.create({
        action_type: "analysis_created",
        user_email: userEmail,
        performed_by: userEmail,
        description: `Created ${isPremium ? 'premium' : 'basic'} analysis: ${businessIdea?.substring(0, 50)}...`,
        metadata: {
          analysis_id: analysisId,
          business_idea: businessIdea,
          is_premium: isPremium
        },
        entity_id: analysisId,
        entity_type: "Analysis"
      });
    } catch (error) {
      console.error("Failed to log analysis creation:", error);
    }
  },

  // Log user registration
  logUserRegistration: async (userEmail, fullName) => {
    try {
      await api.AuditLog.create({
        action_type: "user_registered",
        user_email: userEmail,
        performed_by: userEmail,
        description: `New user registered: ${fullName}`,
        metadata: {
          full_name: fullName
        }
      });
    } catch (error) {
      console.error("Failed to log user registration:", error);
    }
  }
};