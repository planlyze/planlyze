import { Analysis } from "@/entities/Analysis";
import { runChainedAnalysis } from "@/functions/runChainedAnalysis";
import { notifyAnalysisComplete, notifyAnalysisFailed } from "@/components/utils/notificationHelper";
import { logAnalysisCreated } from "@/components/utils/activityHelper";
import { base44 } from "@/api/base44Client";

// Kicks off the backend chained generation and polls the Analysis to drive progress in UI.

/**
 * Start chained prompts and poll status until completion without a client-side timeout.
 * Clean code improvements:
 * - Centralized poll interval as a constant
 * - JSDoc for clarity
 * - Early-exit conditions and small utility for notifying progress
 */

/**
 * Polling base interval in milliseconds
 */
const POLL_INTERVAL_MS = 2500; // increased from 1500 to reduce request rate

// Utility: sleep with jitter
const sleep = (ms) => new Promise((res) => setTimeout(res, ms + Math.floor(Math.random() * 250)));

/**
 * Runs the chained analysis and polls for progress.
 * This function no longer times out on the client; it will keep polling until the
 * analysis reports "completed" or "failed".
 * @param {Object} params
 * @param {string} params.analysisId
 * @param {string} params.businessIdea
 * @param {string} params.industry
 * @param {string} [params.targetHint]
 * @param {string} [params.language='english']
 * @param {string} [params.country='Syria']
 * @param {string|null} [params.competitorFileUrl]
 * @param {(percent:number)=>void} [params.onProgress]
 * @returns {Promise<{status:'completed'|'failed', analysis?:any}>}
 */
export async function runChainedPrompts({
  analysisId,
  businessIdea,
  industry,
  targetHint = "",
  language = "english",
  country = "Syria",
  competitorFileUrl = null,
  onProgress
}) {
  // Get user email for notifications
  let userEmail = null;
  try {
    const user = await base44.auth.me();
    userEmail = user?.email;
    // Log analysis created activity
    if (userEmail) {
      await logAnalysisCreated(userEmail, businessIdea, analysisId);
    }
  } catch {
    // ignore auth errors
  }

  // 1) Start the backend chained process (fire and forget)
  try {
    // Attach catch to avoid unhandled rejection surfacing as "Network Error"
    // eslint-disable-next-line no-void
    void runChainedAnalysis({
      analysisId,
      business_idea: businessIdea,
      industry,
      target_hint: targetHint,
      report_language: language,
      country,
      // pass only file url (removed competitor_data_json)
      competitor_file_url: competitorFileUrl || undefined
    }).catch(() => {});
  } catch {
    // ignore immediate sync errors
  }

  const notify = (p) => { if (typeof onProgress === "function") onProgress(p); };

  // 2) Poll progress from the Analysis record
  let lastProgress = 10;
  notify(lastProgress);

  // Exponential backoff for transient network errors with jitter (max ~30s)
  let failureCount = 0;

  // Keep polling until the backend marks the analysis completed or failed.
  // No client-side timeout.
  // If transient errors occur, we simply wait a bit and retry.
  // This trusts the backend to eventually resolve the status.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // If offline, wait until back online to avoid failing GETs
    if (typeof navigator !== "undefined" && navigator && navigator.onLine === false) {
      // Poll online status every 2s while offline
      await sleep(2000);
      continue;
    }

    // Tolerate transient network/rls hiccups while polling
    let item = null;
    try {
      const list = await Analysis.filter({ id: analysisId });
      item = Array.isArray(list) ? list[0] : null;
      // Reset backoff after a successful request
      failureCount = 0;
    } catch {
      // Exponential backoff with jitter, cap at ~30s
      failureCount = Math.min(failureCount + 1, 6);
      const backoff = Math.min(POLL_INTERVAL_MS * Math.pow(2, failureCount), 30000);
      await sleep(backoff);
      continue;
    }

    if (item) {
      const p = typeof item.progress_percent === "number" ? item.progress_percent : lastProgress;
      if (p !== lastProgress) {
        lastProgress = p;
        notify(p);
      }

      if (item.status === "completed" || p >= 100) {
        notify(100);
        // Send notification on completion
        if (userEmail) {
          await notifyAnalysisComplete(userEmail, analysisId, businessIdea, language === "arabic");
        }
        return { status: "completed", analysis: item };
      }
      if (item.status === "failed") {
        // Send notification on failure
        if (userEmail) {
          await notifyAnalysisFailed(userEmail, businessIdea, analysisId, language === "arabic");
        }
        return { status: "failed", analysis: item };
      }
    }

    await sleep(POLL_INTERVAL_MS);
  }
}