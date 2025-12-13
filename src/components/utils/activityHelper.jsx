import { base44 } from "@/api/base44Client";

const ActivityFeed = base44.entities.ActivityFeed;

/**
 * Creates an activity feed entry
 */
export async function logActivity({ userEmail, actionType, title, description, metadata, isPublic = false }) {
  try {
    await ActivityFeed.create({
      user_email: userEmail,
      action_type: actionType,
      title,
      description,
      metadata,
      is_public: isPublic
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

// Activity logging helpers

export async function logAnalysisCreated(userEmail, businessIdea, analysisId) {
  await logActivity({
    userEmail,
    actionType: "analysis_created",
    title: "New Analysis Started",
    description: `Started analysis for "${businessIdea}"`,
    metadata: { analysisId, businessIdea },
    isPublic: false
  });
}

export async function logAnalysisCompleted(userEmail, businessIdea, analysisId) {
  await logActivity({
    userEmail,
    actionType: "analysis_completed",
    title: "Analysis Completed",
    description: `Completed analysis for "${businessIdea}"`,
    metadata: { analysisId, businessIdea },
    isPublic: false
  });
}

export async function logAnalysisFailed(userEmail, businessIdea, analysisId, error) {
  await logActivity({
    userEmail,
    actionType: "analysis_failed",
    title: "Analysis Failed",
    description: `Analysis failed for "${businessIdea}"`,
    metadata: { analysisId, businessIdea, error },
    isPublic: false
  });
}

export async function logPaymentSubmitted(userEmail, amount, credits) {
  await logActivity({
    userEmail,
    actionType: "payment_submitted",
    title: "Payment Submitted",
    description: `Submitted payment of $${amount} for ${credits} credits`,
    metadata: { amount, credits },
    isPublic: false
  });
}

export async function logPaymentApproved(userEmail, amount, credits, approvedBy) {
  await logActivity({
    userEmail,
    actionType: "payment_approved",
    title: "Payment Approved",
    description: `Payment of $${amount} approved - ${credits} credits added`,
    metadata: { amount, credits, approvedBy },
    isPublic: false
  });
}

export async function logPaymentRejected(userEmail, amount, reason, rejectedBy) {
  await logActivity({
    userEmail,
    actionType: "payment_rejected",
    title: "Payment Rejected",
    description: `Payment of $${amount} was rejected`,
    metadata: { amount, reason, rejectedBy },
    isPublic: false
  });
}

export async function logProfileUpdated(userEmail) {
  await logActivity({
    userEmail,
    actionType: "profile_updated",
    title: "Profile Updated",
    description: "Profile information was updated",
    metadata: {},
    isPublic: false
  });
}

export async function logUserRegistered(userEmail, userName) {
  await logActivity({
    userEmail,
    actionType: "user_registered",
    title: "New User Joined",
    description: `${userName} joined Planlyze`,
    metadata: { userName },
    isPublic: true
  });
}