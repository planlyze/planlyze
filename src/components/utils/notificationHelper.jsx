import { auth, api, Analysis, Payment, User, AI } from "@/api/client";
import { logAnalysisCompleted, logAnalysisFailed, logPaymentApproved, logPaymentRejected } from "./activityHelper";

const Notification = api.Notification;

/**
 * Sends an email using a template
 */
async function sendEmail(userEmail, templateKey, variables, language = 'english') {
  try {
    await api.post('sendTemplatedEmail', {
      userEmail,
      templateKey,
      variables,
      language
    });
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

/**
 * Creates a notification for a user
 * @param {Object} params - Notification parameters
 * @param {string} params.userEmail - Email of the user to notify
 * @param {string} params.type - Type of notification
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} [params.link] - Optional link to navigate to
 * @param {Object} [params.metadata] - Optional additional data
 */
export async function createNotification({ userEmail, type, title, message, link, metadata }) {
  try {
    await Notification.create({
      user_email: userEmail,
      type,
      title,
      message,
      link,
      metadata,
      is_read: false
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

/**
 * Creates an analysis complete notification
 */
export async function notifyAnalysisComplete(userEmail, analysisId, businessIdea, isArabic = false) {
  await createNotification({
    userEmail,
    type: "analysis_complete",
    title: isArabic ? "اكتمل التحليل!" : "Analysis Complete!",
    message: isArabic 
      ? `تقرير التحليل الخاص بـ "${businessIdea}" جاهز للعرض.`
      : `Your analysis report for "${businessIdea}" is ready to view.`,
    link: `/AnalysisResult?id=${analysisId}`,
    metadata: { analysisId, businessIdea }
  });
  
  // Send email notification
  const user = await User.filter({ email: userEmail });
  if (user && user.length > 0) {
    await sendEmail(userEmail, 'analysis_completed', {
      user_name: user[0].display_name || user[0].full_name || userEmail.split('@')[0],
      business_idea: businessIdea,
      report_url: `${window.location.origin}/AnalysisResult?id=${analysisId}`
    }, isArabic ? 'arabic' : 'english');
  }
  
  // Log activity
  await logAnalysisCompleted(userEmail, businessIdea, analysisId);
}

/**
 * Creates an analysis failed notification
 */
export async function notifyAnalysisFailed(userEmail, businessIdea, analysisId = null, isArabic = false) {
  await createNotification({
    userEmail,
    type: "analysis_failed",
    title: isArabic ? "فشل التحليل" : "Analysis Failed",
    message: isArabic 
      ? `لم نتمكن من إكمال تحليل "${businessIdea}". يرجى المحاولة مرة أخرى.`
      : `We couldn't complete the analysis for "${businessIdea}". Please try again.`,
    link: `/NewAnalysis`,
    metadata: { businessIdea }
  });
  
  // Log activity
  await logAnalysisFailed(userEmail, businessIdea, analysisId, "Analysis generation failed");
}

/**
 * Creates a low credits notification
 */
export async function notifyLowCredits(userEmail, remainingCredits, isArabic = false) {
  await createNotification({
    userEmail,
    type: "credits_low",
    title: isArabic ? "رصيد منخفض" : "Low Credits",
    message: isArabic 
      ? `لديك ${remainingCredits} رصيد متبقي فقط. اشترِ المزيد للاستمرار في إنشاء التقارير.`
      : `You only have ${remainingCredits} credit${remainingCredits === 1 ? '' : 's'} remaining. Purchase more to continue creating reports.`,
    link: `/Credits`,
    metadata: { remainingCredits }
  });

  // Send email notification
  const user = await User.filter({ email: userEmail });
  if (user && user.length > 0) {
    await sendEmail(userEmail, 'low_credits', {
      user_name: user[0].display_name || user[0].full_name || userEmail.split('@')[0],
      remaining_credits: remainingCredits,
      credits_url: `${window.location.origin}/Credits`
    }, isArabic ? 'arabic' : 'english');
  }
}

/**
 * Notifies about credit deduction
 */
export async function notifyCreditDeducted(userEmail, businessIdea, remainingCredits, isArabic = false) {
  const user = await User.filter({ email: userEmail });
  if (user && user.length > 0) {
    await sendEmail(userEmail, 'credit_deducted', {
      user_name: user[0].display_name || user[0].full_name || userEmail.split('@')[0],
      business_idea: businessIdea,
      remaining_credits: remainingCredits,
      credits_url: `${window.location.origin}/Credits`
    }, isArabic ? 'arabic' : 'english');
  }
}

/**
 * Notifies when a shared report is accessed
 */
export async function notifySharedReportAccessed(ownerEmail, businessIdea, accessorEmail, isArabic = false) {
  await createNotification({
    userEmail: ownerEmail,
    type: "system",
    title: isArabic ? "تم الوصول إلى التقرير المشترك" : "Shared Report Accessed",
    message: isArabic 
      ? `تم الوصول إلى تقريرك المشترك "${businessIdea}" بواسطة ${accessorEmail}`
      : `Your shared report "${businessIdea}" was accessed by ${accessorEmail}`,
    metadata: { businessIdea, accessorEmail }
  });

  // Send email notification
  const user = await User.filter({ email: ownerEmail });
  if (user && user.length > 0) {
    await sendEmail(ownerEmail, 'shared_report_accessed', {
      user_name: user[0].display_name || user[0].full_name || ownerEmail.split('@')[0],
      business_idea: businessIdea,
      accessor_email: accessorEmail,
      access_date: new Date().toLocaleString(),
      report_url: `${window.location.origin}/Reports`
    }, isArabic ? 'arabic' : 'english');
  }
}

/**
 * Creates a credits purchased notification
 */
export async function notifyCreditsPurchased(userEmail, credits, isArabic = false) {
  await createNotification({
    userEmail,
    type: "credits_purchased",
    title: isArabic ? "تمت إضافة الأرصدة!" : "Credits Added!",
    message: isArabic 
      ? `تمت إضافة ${credits} رصيد إلى حسابك بنجاح.`
      : `${credits} credit${credits === 1 ? ' has' : 's have'} been added to your account.`,
    link: `/Credits`,
    metadata: { credits }
  });
}

/**
 * Creates a payment approved notification
 */
export async function notifyPaymentApproved(userEmail, credits, amount = 0, approvedBy = null, isArabic = false) {
  await createNotification({
    userEmail,
    type: "payment_approved",
    title: isArabic ? "تمت الموافقة على الدفع!" : "Payment Approved!",
    message: isArabic 
      ? `تمت الموافقة على دفعتك وإضافة ${credits} رصيد إلى حسابك.`
      : `Your payment has been approved and ${credits} credit${credits === 1 ? ' has' : 's have'} been added.`,
    link: `/Credits`,
    metadata: { credits }
  });

  // Send email notification
  const user = await User.filter({ email: userEmail });
  if (user && user.length > 0) {
    const userLanguage = user[0].preferred_language === 'arabic' ? 'arabic' : 'english';
    await sendEmail(userEmail, 'payment_approved', {
      user_name: user[0].display_name || user[0].full_name || userEmail.split('@')[0],
      credits: String(credits || 0),
      amount: String(amount || 0),
      credits_url: 'https://app.planlyze.ai/Credits'
    }, userLanguage);
  }
  
  // Log activity
  await logPaymentApproved(userEmail, amount, credits, approvedBy);
}

/**
 * Creates a payment rejected notification
 */
export async function notifyPaymentRejected(userEmail, reason, amount = 0, rejectedBy = null, isArabic = false) {
  await createNotification({
    userEmail,
    type: "payment_rejected",
    title: isArabic ? "تم رفض الدفع" : "Payment Rejected",
    message: isArabic 
      ? `تم رفض دفعتك. ${reason || 'يرجى التواصل مع الدعم للمزيد من المعلومات.'}`
      : `Your payment was rejected. ${reason || 'Please contact support for more information.'}`,
    link: `/Credits`,
    metadata: { reason }
  });

  // Send email notification
  const user = await User.filter({ email: userEmail });
  if (user && user.length > 0) {
    const userLanguage = user[0].preferred_language === 'arabic' ? 'arabic' : 'english';
    await sendEmail(userEmail, 'payment_rejected', {
      user_name: user[0].display_name || user[0].full_name || userEmail.split('@')[0],
      amount: String(amount || 0),
      reason: reason || '',
      credits_url: 'https://app.planlyze.ai/Credits'
    }, userLanguage);
  }
  
  // Log activity
  await logPaymentRejected(userEmail, amount, reason, rejectedBy);
}

/**
 * Creates a welcome notification for new users
 */
export async function notifyWelcome(userEmail, userName, isArabic = false) {
  await createNotification({
    userEmail,
    type: "welcome",
    title: isArabic ? "مرحباً بك في Planlyze!" : "Welcome to Planlyze!",
    message: isArabic 
      ? `مرحباً ${userName}! نحن سعداء بانضمامك. ابدأ بإنشاء أول تحليل لفكرة عملك.`
      : `Hi ${userName}! We're excited to have you. Start by creating your first business idea analysis.`,
    link: `/NewAnalysis`,
    metadata: { userName }
  });
}