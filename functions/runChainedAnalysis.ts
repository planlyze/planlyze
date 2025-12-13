import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Planlyze - Chained Analysis Orchestrator
 * Improvements:
 * - Smaller prompts with limited previous context
 * - Retry + backoff on LLM calls
 * - Light rate-limiting jitter between steps
 * - Split heavy steps into smaller sub-steps (e.g., tech stack options)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const DEFAULT_COUNTRY = 'Syria';
const MAX_CONTEXT_CHARS = 20000;
const MAX_BUSINESS_CTX_CHARS = 15000;
const MAX_TECH_CTX_CHARS = 8000;
const TOTAL_STEPS = 18;

const PREV_CTX_LIMIT = 1200;              // reduced previous-step context to keep prompts light
const MIN_STEP_DELAY_MS = 200;            // jittered delay to avoid hammering LLM
const MAX_STEP_DELAY_MS = 6000;
const INVOKE_MAX_RETRIES = 3;             // retry attempts for transient failures
const INVOKE_BASE_DELAY_MS = 800;         // base backoff
const INVOKE_JITTER_MS = 400;

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Jitter helper
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Build a short JSON context string from last step output to pass to LLM.
 * @param {any} lastOut - Previous step output
 * @param {string} label - Human-friendly label of previous step
 * @param {number} limit - Max characters to include
 * @returns {string} - Context string or empty string
 */
function previousContextFrom(lastOut, label, limit = PREV_CTX_LIMIT) {
  if (!lastOut) return "";
  const json = safeTruncate(JSON.stringify(lastOut), limit);
  return `\nPrevious step (${label}) JSON (truncated):\n${json}\n`;
}

/**
 * Builds a geographic context note for LLM prompts.
 * @param {string | undefined | null} country - The country for which the note should be generated.
 * @returns {string} - The geographic context note.
 */
function buildGeoNote(country) {
  const c = (country || DEFAULT_COUNTRY).trim();
  return [
    `Geographic context: ${c}.`,
    `All market sizing, demand, competition, examples, pricing and regulation must be specific to ${c}.`,
    `If comparative context is needed, prefer ${c}-only comparisons or global references when unavoidable.`
  ].join(' ');
}

/**
 * Provides language instruction for LLM prompts.
 * @param {string | undefined | null} reportLanguage - The desired language for the report.
 * @returns {string} - The language instruction.
 */
function languageInstruction(reportLanguage) {
  const lang = (reportLanguage || 'english').toLowerCase();
  if (lang === 'arabic') return 'Respond in Arabic. Use clear, professional Modern Standard Arabic.';
  return 'Respond in English. Use clear, concise, professional language.';
}

/**
 * Industry instruction for prompts.
 * If 'Other', include the custom industry and instruct to keep it without competitor.
 * @param {string | undefined | null} industry - The main industry category.
 * @param {string | undefined | null} customIndustry - The custom industry name if `industry` is 'Other'.
 * @returns {string} - The industry context note.
 */
function industryInstruction(industry, customIndustry) {
  if (!industry) return '';
  if (industry === 'Other') {
    const name = (customIndustry || '').trim();
    // Updated instruction for clarity and consistency
    return `Industry context: ${name || 'user-specified'}. Do not mention or include competitors in your response.`;
  }
  return `Industry context: ${industry}.`;
}

/**
 * Fetches an analysis entity by its ID from Base44.
 * @param {any} base44 - The Base44 client instance.
 * @param {string} id - The ID of the analysis to fetch.
 * @returns {Promise<any | null>} - The analysis entity or null if not found.
 */
async function getAnalysisById(base44, id) {
  const items = await base44.entities.Analysis.filter({ id });
  return Array.isArray(items) ? items[0] : null;
}

/**
 * Normalizes the output from an LLM call, attempting to parse JSON if it's a string.
 * @param {any} res - The raw response from the LLM.
 * @returns {any} - The normalized LLM output, preferably an object.
 */
function normalizeLLM(res) {
  const v = res && res.output ? res.output : res;
  if (v && typeof v === 'object') return v;
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) { void e; } // no-op: ignore parse error
  }
  return {};
}

/**
 * Safely truncates a string to a maximum length.
 * @param {string | null | undefined} str - The string to truncate.
 * @param {number} max - The maximum desired length.
 * @returns {string} - The truncated string.
 */
function safeTruncate(str, max = 20000) {
  if (!str) return "";
  const s = String(str);
  return s.length > max ? s.slice(0, max) : s;
}

/**
 * Simplifies raw competitor JSON data into a structured array of competitor objects.
 * @param {string | null | undefined} rawJsonString - The raw JSON string of competitor data.
 * @param {string | null | undefined} desiredCategory - An optional category to filter or emphasize.
 * @returns {Array<object>} - An array of simplified competitor objects.
 */
function simplifyCompetitorData(rawJsonString, desiredCategory = null) {
  if (!rawJsonString) return [];
  let obj = null;
  try {
    obj = JSON.parse(rawJsonString);
  } catch {
    return [];
  }

  const deepList = (m) => {
    if (!m || typeof m !== "object") return [];
    const out = [];
    const walk = (node, path = []) => {
      if (!node || typeof node !== "object") return;
      for (const [k, v] of Object.entries(node)) {
        const next = path.concat(k);
        if (v && typeof v === "object" && !Array.isArray(v)) {
          walk(v, next);
        } else if (v === true || v === 1 || v === "true") {
          out.push(next.join("."));
        }
      }
    };
    walk(m, []);
    return out;
  };

  const out = [];
  const pushItem = (category, item) => {
    if (!item || typeof item !== 'object') return;
    const name = item.appName || item.name || item.title || "";
    if (!name) return;

    // original feature sources
    const featuresObj =
      (item.features && typeof item.features === "object" && !Array.isArray(item.features)) ? item.features :
      (item.features_map && typeof item.features_map === "object") ? item.features_map : null;

    const featuresArr = Array.isArray(item.notable_features) ? item.notable_features :
      (Array.isArray(item.features) ? item.features : []);
    const featuresFlat = Array.isArray(item.features_flat) ? item.features_flat : [];

    const flattenedFromBool = deepList(featuresObj);
    const combinedList = [...flattenedFromBool, ...featuresArr, ...featuresFlat].filter(Boolean).map(String);

    // Deduplicate while preserving order
    const seen = new Set();
    const finalList = [];
    for (const f of combinedList) {
      const key = f.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        finalList.push(f);
      }
    }

    const socialRaw = item.social || item.socialMedia || {};
    const appLinksRaw = item.app_links || item.appLinks || {};

    const social = {
      facebook: socialRaw?.facebook || null,
      instagram: socialRaw?.instagram || null,
      linkedin: socialRaw?.linkedIn || null,
      whatsapp: socialRaw?.whatsapp || null,
      telegram: socialRaw?.telegram || null
    };

    const app_links = {
      android: appLinksRaw?.android || null,
      ios: appLinksRaw?.ios || null,
      website: appLinksRaw?.website || null
    };

    const notes = item.comments?.myPointOfView || item.notes || "";

    out.push({
      name,
      category: category || "General",
      // Preserve boolean map (source of truth) + a flat list for convenience
      features: featuresObj || undefined,
      features_flat: finalList,
      notable_features: finalList,
      notes: notes ? String(notes).slice(0, 300) : "",
      website_url: item.website || item.website_url || "",
      social,
      app_links
    });
  };

  const desired = desiredCategory ? String(desiredCategory).toLowerCase() : null;

  if (Array.isArray(obj)) {
    const cat = desiredCategory || "General";
    obj.forEach((item) => pushItem(cat, item));
  } else if (obj && typeof obj === "object") {
    let matchedAny = false;
    if (desired) {
      for (const [cat, arr] of Object.entries(obj)) {
        if (!Array.isArray(arr)) continue;
        const lcCat = String(cat).toLowerCase();
        const matches = (lcCat === desired || lcCat.includes(desired) || desired.includes(lcCat));
        if (matches) {
          arr.forEach((item) => pushItem(cat, item));
          matchedAny = true;
        }
      }
    }
    if (!desired || !matchedAny) {
      for (const [cat, arr] of Object.entries(obj)) {
        if (Array.isArray(arr)) arr.forEach((item) => pushItem(cat, item));
      }
    }
  }
  return out.slice(0, 50);
}

/**
 * Invoke LLM with retry/backoff. Keeps prompts small and resilient under load.
 */
async function invokeLLMWithRetry(base44, opts, tag = 'llm') {
  const { prompt, response_json_schema, add_context_from_internet = true } = opts || {};
  let lastErr = null;
  for (let attempt = 1; attempt <= INVOKE_MAX_RETRIES; attempt++) {
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema,
        add_context_from_internet
      });
      return res;
    } catch (e) {
      lastErr = e;
      // Exponential backoff with jitter
      const delay = INVOKE_BASE_DELAY_MS * Math.pow(2, attempt - 1) + randInt(0, INVOKE_JITTER_MS);
      console.warn(`[${tag}] attempt ${attempt} failed, retrying in ${delay}ms:`, e?.message || e);
      await sleep(delay);
    }
  }
  throw lastErr || new Error('InvokeLLM failed after multiple retries');
}

Deno.serve(async (req) => {
  try {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    let body = {};
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON payload' }, { status: 400, headers: corsHeaders });
    }

    // Input mapping (keep snake_case for DB fields, camelCase for locals when relevant)
    const analysisId = body.analysisId;
    const business_idea = (body.business_idea || '').trim();
    const industry = body.industry || '';
    const custom_industry = body.custom_industry || ''; // ADDED: Custom industry input
    const target_hint = body.target_hint || '';
    const report_language = body.report_language || 'english';
    const country = (body.country && String(body.country).trim()) || DEFAULT_COUNTRY;

    // Use ONLY competitor_file_url
    const competitor_file_url = typeof body.competitor_file_url === 'string' ? body.competitor_file_url : null;

    if (!analysisId || !business_idea) {
      return Response.json({ error: 'analysisId and business_idea are required' }, { status: 400, headers: corsHeaders });
    }

    await base44.entities.Analysis.update(analysisId, {
      status: 'analyzing',
      report_generated: false,
      progress_percent: 10,
      last_error: null
    });

    const processChain = async () => {
      // NOTE: TOTAL_STEPS constant for coherent progress calculations.
      const total = TOTAL_STEPS;
      const updateProgress = async (step, extra = {}) => {
        const percent = Math.min(99, Math.max(10, Math.round((step / total) * 100)));
        await base44.entities.Analysis.update(analysisId, { progress_percent: percent, ...extra });
        // small jitter delay to prevent congesting the LLM provider
        await sleep(randInt(MIN_STEP_DELAY_MS, MAX_STEP_DELAY_MS));
      };

      let lastOut = null;

      const callLLMOrEmpty = async (schema, prompt, stepTag, addCtx = true) => {
        try {
          const raw = await invokeLLMWithRetry(base44, {
            prompt,
            response_json_schema: schema,
            add_context_from_internet: addCtx
          }, stepTag);
          return normalizeLLM(raw);
        } catch (e) {
          await base44.entities.Analysis.update(analysisId, {
            last_error: `${stepTag} failed: ${e?.message || String(e)}`
          });
          return {};
        }
      };

      // Fetch analysis once to get the most accurate industry and custom_industry for generating notes
      const initialAnalysis = await getAnalysisById(base44, analysisId);
      const currentEffectiveIndustry = initialAnalysis?.industry || industry; // `industry` from body is fallback
      const currentEffectiveCustomIndustry = initialAnalysis?.custom_industry || custom_industry; // `custom_industry` from body is fallback

      const geoNote = buildGeoNote(country);
      const langNote = languageInstruction(report_language);
      // NEW: Derived industry note using effective values
      const industryNote = industryInstruction(currentEffectiveIndustry, currentEffectiveCustomIndustry);

      // Define sectorLabel here, as it's used by multiple steps
      const sectorLabel = (currentEffectiveIndustry === 'Other' ? currentEffectiveCustomIndustry : currentEffectiveIndustry || 'technology').toString().replace(/[_-]/g, ' ').trim() || 'technology';

      // STEP 1: Problem & Solution (small)
      {
        const schema = { type: "object", additionalProperties: true, properties: {
          core_problem: { type: "string" },
          solution_approach: { type: "string" },
          value_proposition: { type: "string" }
        }};
        const prompt = `
You are a startup strategist.
${langNote}
${geoNote}
${industryNote}
Task: In short, provide:
- core_problem (1–2 sentences)
- solution_approach (1–2 sentences)
- value_proposition (1–2 sentences)
Idea: "${business_idea}"
Target hint: ${target_hint || 'infer for the country'}
Return JSON only.`; // REMOVED: "Industry: ${industry || 'unspecified'}"
        const out = await callLLMOrEmpty(schema, prompt, 'step1_problem_solution', false);
        const a = await getAnalysisById(base44, analysisId);
        const br = { ...(a?.business_report || {}) };
        br.problem_solution_framework = {
          ...(br.problem_solution_framework || {}),
          core_problem: out.core_problem,
          solution_approach: out.solution_approach,
          value_proposition: out.value_proposition
        };
        await base44.entities.Analysis.update(analysisId, { business_report: br, step1_problem_solution: out });
        lastOut = out;
        await updateProgress(1);
      }

      // STEP 2: Target Audience (small lists)
      {
        const schema = { type: "object", additionalProperties: true, properties: {
          target_description: { type: "string" },
          demographics: { type: "array", items: { type: "string" } },
          psychographics: { type: "array", items: { type: "string" } },
          pain_points: { type: "array", items: { type: "string" } }
        }};
        const previousContext = previousContextFrom(lastOut, "Problem & Solution");
        const prompt = `
You are a GTM strategist.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Task: Provide concise:
- target_description (1 sentence)
- 3–4 demographics
- 3–4 psychographics
- 3–4 pain_points
Idea: "${business_idea}"
Return JSON only.`;
        const out = await callLLMOrEmpty(schema, prompt, 'step2_target_audience', false);
        const a = await getAnalysisById(base44, analysisId);
        const br = { ...(a?.business_report || {}) };
        const psf = { ...(br.problem_solution_framework || {}) };
        psf.target_audience = {
          target_description: out.target_description,
          demographics: out.demographics || [],
          psychographics: out.psychographics || [],
          pain_points: out.pain_points || []
        };
        await base44.entities.Analysis.update(analysisId, { business_report: { ...br, problem_solution_framework: psf }, step2_target_audience: out });
        lastOut = out;
        await updateProgress(2);
      }

      // STEP 3: Market Opportunity (compact)
      {
        const schema = { type: "object", additionalProperties: true, properties: {
          market_opportunity: { type: "string" },
          key_opportunities: { type: "array", items: { type: "string" } }
        }};
        const previousContext = previousContextFrom(lastOut, "Target Audience");
        const prompt = `
You are a market analyst.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Task: Provide brief:
- market_opportunity (3–4 sentences)
- key_opportunities (3–4 bullets)
Idea: "${business_idea}"
Return JSON only.`;
        const out = await callLLMOrEmpty(schema, prompt, 'step3_market_opportunity', true);
        const a = await getAnalysisById(base44, analysisId);
        const br = { ...(a?.business_report || {}) };
        br.market_opportunity = out.market_opportunity;
        br.key_opportunities = out.key_opportunities || [];
        await base44.entities.Analysis.update(analysisId, { business_report: br, step3_market_opportunity: out });
        lastOut = out;
        await updateProgress(3);
      }

      // STEP 4: Market Size (requires internet context)
      {
        const schema = { type: "object", additionalProperties: true, properties: {
          market_size: { type: "object", additionalProperties: true, properties: {
            tam: { type: "string" }, sam: { type: "string" }, som: { type: "string" },
            tam_basis: { type: "string" }, sam_basis: { type: "string" }, som_basis: { type: "string" },
            methodology_notes: { type: "string" }
          }}
        }};
        const previousContext = previousContextFrom(lastOut, "Market Opportunity");
        const prompt = `
You are an expert business strategist.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Task: Estimate ${country} market size briefly with clear basis (USD strings).
Idea: "${business_idea}"
Return JSON strictly matching the schema.`;
        const out = await callLLMOrEmpty(schema, prompt, 'step4_market_size', true);
        const a = await getAnalysisById(base44, analysisId);
        const br = { ...(a?.business_report || {}) };
        if (out?.market_size && typeof out.market_size === 'object') {
          br.market_size = {
            ...(br.market_size || {}),
            ...out.market_size
          };
        } else {
          br.market_size = {};
        }
        await base44.entities.Analysis.update(analysisId, { business_report: br, step4_market_size: out });
        lastOut = out;
        await updateProgress(4);
      }

      // STEP 5: Local Demand (compact, no web)
      {
        const schema = { type: "object", additionalProperties: true, properties: {
          local_demand_assessment: { type: "string" }
        }};
        const previousContext = previousContextFrom(lastOut, "Market Size");
        const prompt = `
You are an expert country-focused demand analyst.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Task: Assess local_demand_assessment (3–4 sentences) for "${business_idea}". Return JSON only.`;
        const out = await callLLMOrEmpty(schema, prompt, 'step5_local_demand', false);
        const a = await getAnalysisById(base44, analysisId);
        const br = { ...(a?.business_report || {}) };
        br.local_demand_assessment = out.local_demand_assessment;
        await base44.entities.Analysis.update(analysisId, { business_report: br, step5_local_demand: out });
        lastOut = out;
        await updateProgress(5);
      }

      // STEP 6: Competition (compact)
      {
        const schema = { type: "object", additionalProperties: true, properties: {
          competition_analysis: { type: "string" }
        }};
        const previousContext = previousContextFrom(lastOut, "Local Demand");
        const prompt = `
You are an expert competition analyst.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Task: Provide a ${country}-specific competition_analysis (3–4 sentences) for "${business_idea}". Return JSON only.`;
        const out = await callLLMOrEmpty(schema, prompt, 'step6_competition', true);
        const a = await getAnalysisById(base44, analysisId);
        const br = { ...(a?.business_report || {}) };
        br.competition_analysis = out.competition_analysis || br.competition_analysis || "";
        await base44.entities.Analysis.update(analysisId, { business_report: br, step6_competition: out });
        lastOut = out;
        await updateProgress(6);
      }

      // STEP 7: GTM & Revenue (compact)
      {
        const schema = { type: "object", additionalProperties: true, properties: {
          go_to_market: { type: "string" },
          revenue_streams: { type: "array", items: { type: "string" } }
        }};
        const previousContext = previousContextFrom(lastOut, "Competition Analysis");
        const prompt = `
You are an expert GTM strategist.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Task: 
- go_to_market (3–4 sentences)
- revenue_streams (5 bullets)
Idea: "${business_idea}"
Return JSON only.`;
        const out = await callLLMOrEmpty(schema, prompt, 'step7_goto_market_revenue', false);
        const a = await getAnalysisById(base44, analysisId);
        const br = { ...(a?.business_report || {}) };
        br.go_to_market = out.go_to_market;
        br.revenue_streams = out.revenue_streams || [];
        await base44.entities.Analysis.update(analysisId, { business_report: br, step7_goto_market_revenue: out });
        lastOut = out;
        await updateProgress(7);
      }

      // STEP 8a: Technology Stack Suggestions (split into 3 micro calls + separate recommendation)
      {
        const optionSchema = {
          type: "object",
          additionalProperties: true,
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            frontend: { type: "string" },
            backend: { type: "string" },
            database: { type: "string" },
            cloud: { type: "string" },
            mobile: { type: "string" },
            pros: { type: "array", items: { type: "string" } },
            cons: { type: "array", items: { type: "string" } },
            estimated_timeline_weeks: { type: "integer" },
            timeline_breakdown: {
              type: "array",
              items: { type: "object", additionalProperties: true, properties: {
                phase: { type: "string" },
                weeks: { type: "integer" },
                notes: { type: "string" }
              }}
            },
            team_roles: {
              type: "array",
              items: { type: "object", additionalProperties: true, properties: {
                role: { type: "string" },
                seniority: { type: "string" },
                count: { type: "integer" },
                salary_usd_per_month: { type: "number" }
              }}
            },
            estimated_monthly_team_cost_usd: { type: "number" },
            estimated_mvp_cost_usd: { type: "number" }
          }
        };

        const previousContext = previousContextFrom(lastOut, "GTM & Revenue");

        const options = [];
        for (let i = 1; i <= 3; i++) {
          const promptOption = `
You are a senior solution architect.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Task: Provide ONE concise Technology Stack Option #${i} for "${business_idea}" in ${country} (${sectorLabel}).
Keep lists short (3-5 pros, 2-4 cons, 2-4 phases, 2-4 team roles). Ensure team salaries reflect ${country} context.
Include fields exactly per schema. Return JSON only.`;
          const outOpt = await callLLMOrEmpty(optionSchema, promptOption, `step8a_option_${i}`, false);
          if (outOpt && typeof outOpt === 'object') options.push(outOpt);
          await sleep(randInt(150, 350)); // small gap between micro-calls
        }

        // Recommendation step using the 3 options (small, no web)
        const recommendationSchema = {
          type: "object",
          additionalProperties: true,
          properties: {
            recommended_option_index: { type: "integer" },
            recommended_rationale: { type: "string" }
          }
        };
        const optionsCtx = safeTruncate(JSON.stringify(options), PREV_CTX_LIMIT);
        const promptRec = `
You are a pragmatic architect.
${langNote}
${geoNote}
${industryNote}
We have 3 stack options (JSON, truncated):
${optionsCtx}
Task: Choose recommended_option_index (0–2) and write a brief recommended_rationale (2–4 sentences) for "${business_idea}" in ${country}.
Return JSON only.`;
        const outRec = await callLLMOrEmpty(recommendationSchema, promptRec, 'step8a_recommendation', false);

        // Save into technical_report + step8_tech_stack_suggestions (keeps UI compatible)
        const a = await getAnalysisById(base44, analysisId);
        const tr = { ...(a?.technical_report || {}) };

        tr.technology_stack_suggestions = options;
        if (typeof outRec?.recommended_option_index === 'number') {
          tr.technology_stack_recommendation_index = outRec.recommended_option_index;
          const idx = outRec.recommended_option_index;
          if (idx >= 0 && options[idx]) {
            const chosen = options[idx];
            tr.technology_stack = {
              mobile: chosen.mobile || "",
              frontend: chosen.frontend || "",
              backend: chosen.backend || "",
              database: chosen.database || "",
              cloud: chosen.cloud || ""
            };
          }
        }
        if (outRec?.recommended_rationale) {
          tr.technology_stack_recommendation_reason = outRec.recommended_rationale;
        }

        await base44.entities.Analysis.update(analysisId, {
          step8_tech_stack_suggestions: { technology_stack_suggestions: options, recommended_option_index: tr.technology_stack_recommendation_index, recommended_rationale: tr.technology_stack_recommendation_reason },
          technical_report: tr
        });
        lastOut = { technology_stack_suggestions: options, ...outRec };
        await updateProgress(8);
      }

      // STEP 8b: Technical Implementation
      {
        const schema = {
          type: "object",
          additionalProperties: true,
          properties: {          
            architecture_overview: { type: "string" },
            security_considerations: { type: "string" },
            integrations: { type: "array", items: { type: "string" } }
          }
        };
        const previousContext = previousContextFrom(lastOut, "Tech Stack Suggestions");
        const prompt = `
You are a senior software architect.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Task: Using the recommended stack (summarized in context), produce:
- architecture_overview (3–5 sentences, focus on MVP pragmatism and ops in ${country})
- security_considerations (3–5 sentences)
- integrations (6–8 bullet items)
Idea: "${business_idea}"
Return a JSON matching the schema.`; // REMOVED: "Industry: ${industry || 'unspecified'}"
        const out = await callLLMOrEmpty(schema, prompt, 'step8_technical_implementation', false);
        const a = await getAnalysisById(base44, analysisId);
        const tr = { ...(a?.technical_report || {}) };
        tr.architecture_overview = out.architecture_overview;
        tr.security_considerations = out.security_considerations;
        tr.integrations = out.integrations || [];
        await base44.entities.Analysis.update(analysisId, {
          technical_report: tr,
          step8_technical_implementation: out
        });
        lastOut = out;
        await updateProgress(9);
      }

      // STEP 9: Development Plan
      {
        const schema = {
          type: "object",
          additionalProperties: true,
          properties: {
            mvp_core_features: { type: "array", items: { type: "string" } },
            development_phases: { type: "array", items: { type: "string" } },
            mvp_launch_action_plan: { type: "array", items: { type: "string" } },
            team_requirements: { type: "array", items: { type: "string" } }
          }
        };
        const previousContext = previousContextFrom(lastOut, "Technical Implementation");
        const prompt = `
You are an expert product delivery lead.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Task: Outline a lean MVP delivery plan adapted to ${country} for "${business_idea}":
- MVP Core Features (10–14 bullet items), with description for each 
- Development Phases (3–5 phases with brief details)
- MVP Launch Action Plan (8–12 bullet items), with description
- Team Requirements (technical and business roles needed for MVP and early growth)
Return a JSON matching the schema.`;
        const out = await callLLMOrEmpty(schema, prompt, 'step9_development_plan', false);
        const a = await getAnalysisById(base44, analysisId);
        const tr = { ...(a?.technical_report || {}) };
        tr.mvp_core_features = out.mvp_core_features || [];
        tr.development_phases = out.development_phases || [];
        tr.mvp_launch_action_plan = out.mvp_launch_action_plan || [];
        tr.team_requirements = out.team_requirements || [];
        await base44.entities.Analysis.update(analysisId, {
          technical_report: tr,
          step9_development_plan: out
        });
        lastOut = out;
        await updateProgress(10);
      }

      // STEP 10a: Timeline & Pricing
      {
        const schema = {
          type: "object",
          additionalProperties: true,
          properties: {
            pricing_country: { type: "string" },
            pricing_currency: { type: "string" },
            country_pricing_basis: { type: "string" },
            timeline_pricing: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: true,
                properties: {
                  item: { type: "string" },
                  level: { type: "string" },
                  duration_weeks: { type: "integer" },
                  estimated_cost_usd: { type: "number" },
                  notes: { type: "string" }
                }
              }
            }
          }
        };
        const previousContext = previousContextFrom(lastOut, "Development Plan"); // Changed from 'Financials' as that was a later step
        const prompt = `
You are a product delivery lead preparing an MVP timeline and budget.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Goal: Create a realistic timeline and pricing for "${business_idea}" in ${country} (${sectorLabel} sector), based on local salary benchmarks and delivery pace.
Return JSON strictly matching the schema. Details needed for:
- pricing_country: "${country}"
- pricing_currency: "USD"
- country_pricing_basis: 2–4 sentences explaining local cost assumptions.
- timeline_pricing: 4–8 stages. Each stage: item (name), level, duration_weeks, estimated_cost_usd, notes.`;
        const out = await callLLMOrEmpty(schema, prompt, 'step10a_timeline_pricing', true);
        const a = await getAnalysisById(base44, analysisId);
        const tr = { ...(a?.technical_report || {}) };
        if (Array.isArray(out?.timeline_pricing)) {
          tr.timeline_pricing = out.timeline_pricing;
        }
        if (out?.pricing_country) tr.pricing_country = out.pricing_country;
        if (out?.pricing_currency) tr.pricing_currency = out.pricing_currency;
        if (out?.country_pricing_basis) tr.country_pricing_basis = out.country_pricing_basis;
        await base44.entities.Analysis.update(analysisId, {
          technical_report: tr,
          step10_financials_risks_swot: { ...(a?.step10_financials_risks_swot || {}), timeline_pricing: out?.timeline_pricing }
        });
        lastOut = out;
        await updateProgress(11); // Increment for the split step
      }

      // STEP 10b: Risks + SWOT (split into multiple micro-calls)
      {
        const previousContext = previousContextFrom(lastOut, "Timeline & Pricing");

        const risksSchema = {
          type: "object",
          additionalProperties: true,
          properties: {
            risks_and_mitigation: { type: "string" },
            technical_risks: { type: "string" }
          }
        };
        const risksPrompt = `
You are a startup advisor focused on risk.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Task: Provide for ${country}:
- Business Risks & Mitigations (8–12 sentences)
- Technical Risks (6–10 sentences)
Idea: "${business_idea}"
Return a JSON matching the schema.`;
        const risksOut = await callLLMOrEmpty(risksSchema, risksPrompt, 'step10b_risks', true);
        await sleep(randInt(MIN_STEP_DELAY_MS / 2, MAX_STEP_DELAY_MS / 2)); // Small jitter between sub-steps

        const strengthsSchema = {
          type: "object",
          additionalProperties: true,
          properties: { strengths: { type: "array", items: { type: "string" } } }
        };
        const strengthsPrompt = `
You are a market strategy expert.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Task: For ${country}, list 6–10 concise, non-overlapping bullet points for SWOT — Strengths — for "${business_idea}". 
Focus on real, ${country}-specific advantages.
Return JSON with "strengths": string[].`;
        const strengthsOut = await callLLMOrEmpty(strengthsSchema, strengthsPrompt, 'step10b_swot_strengths', true);
        await sleep(randInt(MIN_STEP_DELAY_MS / 2, MAX_STEP_DELAY_MS / 2));

        const weaknessesSchema = {
          type: "object",
          additionalProperties: true,
          properties: { weaknesses: { type: "array", items: { type: "string" } } }
        };
        const weaknessesPrompt = `
You are a market strategy expert.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Task: For ${country}, list 6–10 concise, non-overlapping bullet points for SWOT — Weaknesses — for "${business_idea}". 
Be candid about internal limitations and likely execution gaps in ${country}.
Return JSON with "weaknesses": string[].`;
        const weaknessesOut = await callLLMOrEmpty(weaknessesSchema, weaknessesPrompt, 'step10b_swot_weaknesses', true);
        await sleep(randInt(MIN_STEP_DELAY_MS / 2, MAX_STEP_DELAY_MS / 2));

        const opportunitiesSchema = {
          type: "object",
          additionalProperties: true,
          properties: { opportunities: { type: "array", items: { type: "string" } } }
        };
        const opportunitiesPrompt = `
You are a market strategy expert.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Task: For ${country}, list 6–10 concise, non-overlapping bullet points for SWOT — Opportunities — for "${business_idea}". 
Focus on growth angles relevant to ${country}.
Return JSON with "opportunities": string[].`;
        const opportunitiesOut = await callLLMOrEmpty(opportunitiesSchema, opportunitiesPrompt, 'step10b_swot_opportunities', true);
        await sleep(randInt(MIN_STEP_DELAY_MS / 2, MAX_STEP_DELAY_MS / 2));

        const threatsSchema = {
          type: "object",
          additionalProperties: true,
          properties: { threats: { type: "array", items: { type: "string" } } }
        };
        const threatsPrompt = `
You are a market strategy expert.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Task: For ${country}, list 6–10 concise, non-overlapping bullet points for SWOT — Threats — for "${business_idea}". 
Include competition, regulation, macroeconomics, and execution risks specific to ${country}.
Return JSON with "threats": string[].`;
        const threatsOut = await callLLMOrEmpty(threatsSchema, threatsPrompt, 'step10b_swot_threats', true);
        await sleep(randInt(MIN_STEP_DELAY_MS / 2, MAX_STEP_DELAY_MS / 2));

        const a = await getAnalysisById(base44, analysisId);
        const br = { ...(a?.business_report || {}) };
        const tr = { ...(a?.technical_report || {}) };
        br.risks_and_mitigation = risksOut.risks_and_mitigation || br.risks_and_mitigation;
        tr.technical_risks = risksOut.technical_risks || tr.technical_risks;
        br.swot_analysis = {
          ...(br.swot_analysis || {}),
          strengths: Array.isArray(strengthsOut.strengths) ? strengthsOut.strengths : (br.swot_analysis?.strengths || []),
          weaknesses: Array.isArray(weaknessesOut.weaknesses) ? weaknessesOut.weaknesses : (br.swot_analysis?.weaknesses || []),
          opportunities: Array.isArray(opportunitiesOut.opportunities) ? opportunitiesOut.opportunities : (br.swot_analysis?.opportunities || []),
          threats: Array.isArray(threatsOut.threats) ? threatsOut.threats : (br.swot_analysis?.threats || []),
        };
        const step10 = { ...(a?.step10_financials_risks_swot || {}) };
        Object.assign(step10, {
          risks_and_mitigation: br.risks_and_mitigation || "",
          technical_risks: tr.technical_risks || "",
          swot_analysis: br.swot_analysis
        });
        await base44.entities.Analysis.update(analysisId, {
          business_report: br,
          technical_report: tr,
          step10_financials_risks_swot: step10
        });
        lastOut = { ...risksOut, ...br.swot_analysis };
        await updateProgress(12); // Increment for this split step
      }

      // STEP 10c: Validation & Metrics
      {
        const schema = {
          type: "object",
          additionalProperties: true,
          properties: {
            success_metrics: { type: "array", items: { type: "string" } },
            validation_methodology: { type: "string" }
          }
        };
        const previousContext = previousContextFrom(lastOut, "Risks & SWOT");
        const prompt = `
You are a startup validation expert.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Task: Produce for ${country}:
- Success Metrics (8–12 bullet KPIs for the first 6–12 months)
- Validation Methodology (8–12 sentences)
Idea: "${business_idea}"
Return a JSON matching the schema.`;
        const out = await callLLMOrEmpty(schema, prompt, 'step10c_validation_metrics', false);
        const a = await getAnalysisById(base44, analysisId);
        const br = { ...(a?.business_report || {}) };
        // Ensure tr is defined here for consistency if needed in future, though not directly used in update
        const tr = { ...(a?.technical_report || {}) }; 
        br.success_metrics = out.success_metrics || [];
        br.validation_methodology = out.validation_methodology;
        const step10 = { ...(a?.step10_financials_risks_swot || {}) };
        Object.assign(step10, {
          success_metrics: out.success_metrics || [],
          validation_methodology: out.validation_methodology
        });
        await base44.entities.Analysis.update(analysisId, {
          business_report: br,
          technical_report: tr, 
          step10_financials_risks_swot: step10
        });
        lastOut = out;
        await updateProgress(13); // Increment for this split step
      }

      // STEP 10d: Partnerships & Funding
      {
        const schema = {
          type: "object",
          additionalProperties: true,
          properties: {
            partnerships_opportunities: { type: "array", items: { type: "string" } },
            funding_recommendations: { type: "string" }
          }
        };
        const previousContext = previousContextFrom(lastOut, "Validation & Metrics");
        const prompt = `
You are a startup partnerships and funding strategist.
${langNote}
${geoNote}
${industryNote}
${previousContext}
Task: Produce for ${country}:
- Partnerships Opportunities (6–10 bullet items)
- Funding Recommendations (8–12 sentences)
Idea: "${business_idea}"
Return a JSON matching the schema.`;
        const out = await callLLMOrEmpty(schema, prompt, 'step10d_partnerships_funding', true);
        const a = await getAnalysisById(base44, analysisId);
        const br = { ...(a?.business_report || {}) };
        br.partnerships_opportunities = out.partnerships_opportunities || [];
        br.funding_recommendations = out.funding_recommendations;
        const step10 = { ...(a?.step10_financials_risks_swot || {}) };
        Object.assign(step10, {
          partnerships_opportunities: out.partnerships_opportunities || [],
          funding_recommendations: out.funding_recommendations
        });
        await base44.entities.Analysis.update(analysisId, {
          business_report: br,
          step10_financials_risks_swot: step10
        });
        lastOut = out;
        await updateProgress(14); // Increment for this split step
      }

      // Syrian competitors (file-only)
      {
        const isOtherIndustry = (currentEffectiveIndustry || "").toLowerCase() === "other";

        if (isOtherIndustry) {
          // If industry is 'Other', skip LLM calls for competitors entirely.
          // This ensures no competitor info is generated or processed.
          lastOut = { syrian_competitors: [], differentiation_recommendations: [] };
          await updateProgress(15);
        } else {
          let compText = null;
          if (competitor_file_url) {
            try {
              const r = await fetch(competitor_file_url);
              if (r.ok) {
                compText = await r.text();
              }
            } catch (e) { void e; } // no-op: ignore fetch error
          }

          let simplified = [];
          let simplifiedJson = "";
          if (compText) {
            try {
              // Use currentEffectiveIndustry here for filtering/emphasizing
              const parsed = JSON.parse(compText);
              simplified = simplifyCompetitorData(JSON.stringify(parsed), currentEffectiveIndustry);
              simplifiedJson = safeTruncate(JSON.stringify(simplified), MAX_CONTEXT_CHARS);
            } catch (e) { void e; } // no-op: treat as raw below
          }

          const schema = {
            type: "object",
            additionalProperties: true,
            properties: {
              syrian_competitors: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: true,
                  properties: {
                    name: { type: "string" },
                    category: { type: "string" },
                    description: { type: "string" },
                    notable_features: { type: "array", items: { type: "string" } },
                    strengths: { type: "array", items: { type: "string" } },
                    weaknesses: { type: "array", items: { type: "string" } },
                    notes: { type: "string" },
                    website_url: { type: "string" },
                    social: {
                      type: "object",
                      additionalProperties: true,
                      properties: {
                        facebook: { type: "string" },
                        instagram: { type: "string" },
                        linkedin: { type: "string" },
                        whatsapp: { type: "string" },
                        telegram: { type: "string" }
                      }
                    },
                    app_links: {
                      type: "object",
                      additionalProperties: true,
                      properties: {
                        android: { type: "string" },
                        ios: { type: "string" },
                        website: { type: "string" }
                      }
                    }
                  }
                }
              },
              differentiation_recommendations: {
                type: "array",
                items: { type: "string" }
              }
            }
          };

          let outSyrian = { syrian_competitors: [], differentiation_recommendations: [] };

          if (simplifiedJson && simplified.length > 0) {
            const prompt = `
You are a competition analyst for the ${sectorLabel} sector in ${country}.
${langNote}
${geoNote}
${industryNote}
Task:
Normalize the following simplified competitor entries into "syrian_competitors" for the ${sectorLabel} sector in ${country}.
- For each item, produce: name, category (short tag), a concise 1–2 sentence description derived from features/notes, notable_features (bullets), 3–5 strengths, 2–4 weaknesses, notes (from user comments), and website_url if known.
Also add "differentiation_recommendations": 3–5 concrete strategies for the idea "${business_idea}" tailored to ${country}.

Simplified competitor entries (JSON):
${simplifiedJson}

Return JSON strictly matching the schema.`;
            try {
              outSyrian = normalizeLLM(await invokeLLMWithRetry(base44, {
                prompt,
                response_json_schema: schema,
                add_context_from_internet: false // Keep false for competitor file processing
              }, 'step_syrian_competitors_json'));
            } catch (e) {
              await base44.entities.Analysis.update(analysisId, {
                last_error: `Syrian competitors step (JSON) fallback used: ${e?.message || String(e)}`
              });
              outSyrian.syrian_competitors = simplified.map((c) => ({
                name: c.name || "",
                category: c.category || "General",
                description: c.notable_features?.length ? `Notable features: ${c.notable_features.slice(0,5).join(", ")}.` : "",
                notable_features: Array.isArray(c.notable_features) ? c.notable_features.slice(0, 25) : [],
                strengths: [],
                weaknesses: [],
                notes: c.notes || "",
                website_url: c.website_url || "",
                social: c.social || {},
                app_links: c.app_links || {}
              }));
            }
          } else if (compText) {
            const prompt = `
You are a competition analyst for the ${sectorLabel} sector in ${country}.
${langNote}
${geoNote}
${industryNote}
The following text is raw, unstructured competitor information supplied by the user.
Extract a clean, deduplicated list of competitors in Syria and structure them under "syrian_competitors".
For each: include name, a short category tag, 1–2 sentence description, notable_features (bullets), 3–5 strengths, 2–4 weaknesses, notes (from user comments if any), and website_url if present.
Also provide "differentiation_recommendations": 3–5 concrete strategies for the idea "${business_idea}" to stand out in ${country}.

Raw file content (truncated):
${safeTruncate(compText, MAX_CONTEXT_CHARS)}

Return JSON strictly matching the schema.`;
            try {
              outSyrian = normalizeLLM(await invokeLLMWithRetry(base44, {
                prompt,
                response_json_schema: schema,
                add_context_from_internet: false // Keep false for competitor file processing
              }, 'step_syrian_competitors_raw'));
            } catch (e) {
              await base44.entities.Analysis.update(analysisId, {
                last_error: `Syrian competitors step (raw) failed: ${e?.message || String(e)}`
              });
            }
          }

          const a = await getAnalysisById(base44, analysisId);
          const br = { ...(a?.business_report || {}) };

          const byName = new Map();
          simplified.forEach((s) => {
            if (!s?.name) return;
            byName.set(String(s.name).toLowerCase().trim(), s);
          });

          const outList = Array.isArray(outSyrian?.syrian_competitors) ? outSyrian.syrian_competitors : [];
          const merged = (outList.length ? outList : simplified).map((c) => {
            const key = String(c?.name || "").toLowerCase().trim();
            const base = byName.get(key);

            const mergedSocial = {
              ...(base?.social || {}),
              ...(c?.social || {})
            };
            const mergedApps = {
              ...(base?.app_links || {}),
              ...(c?.app_links || {})
            };

            // Prefer features from file (base) if present; otherwise keep LLM-extracted features
            const baseFeaturesFlat = Array.isArray(base?.features_flat) ? base.features_flat : [];
            const llmFeaturesFlat = Array.isArray(c?.notable_features) ? c.notable_features : (Array.isArray(c?.features) ? c.features : []);
            const chosenFeaturesFlat = baseFeaturesFlat.length ? baseFeaturesFlat : llmFeaturesFlat;

            return {
              description: c?.description || base?.description || "",
              strengths: Array.isArray(c?.strengths) ? c.strengths : (Array.isArray(base?.strengths) ? base.strengths : []),
              weaknesses: Array.isArray(c?.weaknesses) ? c.weaknesses : (Array.isArray(base?.weaknesses) ? base.weaknesses : []),

              // Identity and categorization
              name: base?.name || c?.name || "",
              category: base?.category || c?.category || "General",

              // Notes and links
              notes: base?.notes || c?.notes || "",
              website_url: base?.website_url || c?.website_url || "",

              // Preserve boolean map (source of truth) if the file provided it
              features: base?.features || undefined,

              // Flat list used by UI; fall back to LLM-extracted list when file lacks features
              features_flat: chosenFeaturesFlat || [],
              notable_features: chosenFeaturesFlat || [],

              // Merge socials and apps from both sources
              social: mergedSocial,
              app_links: mergedApps
            };
          });

          br.syrian_competitors = merged;

          br.syrian_competitors_meta = {
            ...(br.syrian_competitors_meta || {}),
            differentiation_recommendations: Array.isArray(outSyrian?.differentiation_recommendations)
              ? outSyrian.differentiation_recommendations
              : (br.syrian_competitors_meta?.differentiation_recommendations || [])
          };
          await base44.entities.Analysis.update(analysisId, { business_report: br });
          lastOut = outSyrian;
          await updateProgress(15); // Adjust step number based on new flow
        }
      }

      // Detailed Competitors - removed per request (keep step numbering stable)
      {
        void 0; 
      }

      // Post-process: hide Syrian competitors section if industry is Other or no competitor file URL provided
      {
        const a = await getAnalysisById(base44, analysisId);
        const industryVal = ((a && a.industry) || industry || "").toString().trim();
        const isOtherIndustry = industryVal.toLowerCase() === "other";
        const hasCompetitorFile = Boolean(competitor_file_url);

        if (isOtherIndustry || !hasCompetitorFile) {
          const br = { ...(a?.business_report || {}) };

          // Remove all fields the SyrianCompetitors component relies on
          delete br.syrian_competitors;
          delete br.competitors_syrian; // Older/alternative field name
          delete br.syrian_competitors_object; // Older/alternative field name
          delete br.syrian_competitors_map; // Older/alternative field name
          delete br.user_supplied_competitors; // Older/alternative field name
          delete br.syrian_competitors_meta;
          delete br.competitors_syrian_meta; // Older/alternative field name

          await base44.entities.Analysis.update(analysisId, {
            business_report: br
          });
        }
      }

      // Recommendations & Next Steps
      {
        const a0 = await getAnalysisById(base44, analysisId);
        const brCtx = a0?.business_report ? safeTruncate(JSON.stringify(a0.business_report), MAX_BUSINESS_CTX_CHARS) : "{}";
        const trCtx = a0?.technical_report ? safeTruncate(JSON.stringify(a0.technical_report), MAX_TECH_CTX_CHARS) : "{}";
        const schema = {
          type: "object",
          additionalProperties: true,
          properties: {
            recommendation_summary: { type: "string" }
          }
        };
        const prompt = `
You are a seasoned startup advisor.
${langNote}
${geoNote}
${industryNote}
Context (truncated):
Business Report (JSON):
${brCtx}

Technical Report (JSON):
${trCtx}

Task:
Write a concise, actionable Recommendations & Next Steps section (3–4 bullet points or short paragraphs). 
Make it practical and prioritized, focusing on the next 30–90 days, referencing the idea, market, and technical feasibility.

Return JSON strictly matching the schema.`;
        const out = await callLLMOrEmpty(schema, prompt, 'step_recommendations_next', false);
        const a = await getAnalysisById(base44, analysisId);
        const br = { ...(a?.business_report || {}) };
        br.recommendation_summary = out?.recommendation_summary || br.recommendation_summary || "";
        await base44.entities.Analysis.update(analysisId, {
          business_report: br,
        });
        lastOut = out;
        await updateProgress(16);
      }

      // Scoring
      {
        const a0 = await getAnalysisById(base44, analysisId);
        const brCtx = a0?.business_report ? safeTruncate(JSON.stringify(a0.business_report), MAX_BUSINESS_CTX_CHARS) : "{}";
        const trCtx = a0?.technical_report ? safeTruncate(JSON.stringify(a0.technical_report), MAX_TECH_CTX_CHARS) : "{}";
        const schema = {
          type: "object",
          additionalProperties: true,
          properties: {
            business_overall_viability_score: { type: "number" },
            business_overall_viability_assessment: { type: "number" },
            technical_complexity_score: { type: "number" },
            technical_mvp_by_ai_tool_score: { type: "number" },
            rationale: { type: "string" }
          }
        };
        const prompt = `
You are evaluating the startup's viability and build complexity.
${langNote}
${geoNote}
${industryNote}
Context (truncated):
Business Report (JSON):
${brCtx}

Technical Report (JSON):
${trCtx}

Task:
Based on the context, provide the following 0–10 scores (integers preferred; decimals allowed):
- business_overall_viability_score (0=poor, 10=excellent commercial viability)
- business_overall_viability_assessment (duplicate of above, also 0–10, to support UI fallbacks)
- technical_complexity_score (0=very simple to build, 10=very complex)
- technical_mvp_by_ai_tool_score (0=not feasible with AI/low-code, 10=mostly feasible with AI/low-code)
Add a short rationale.

Return JSON strictly matching the schema.`;
        const out = await callLLMOrEmpty(schema, prompt, 'step_scoring', false);
        const a = await getAnalysisById(base44, analysisId);
        const br = { ...(a?.business_report || {}) };
        const tr = { ...(a?.technical_report || {}) };
        if (typeof out?.business_overall_viability_score === "number") {
          br.overall_viability_score = out.business_overall_viability_score;
        }
        if (typeof out?.business_overall_viability_assessment === "number") {
          br.overall_business_viability_assessment = out.business_overall_viability_assessment;
        }
        if (typeof out?.technical_complexity_score === "number") {
          tr.complexity_score = out.technical_complexity_score;
        }
        if (typeof out?.technical_mvp_by_ai_tool_score === "number") {
          tr.mvp_by_ai_tool_score = out.technical_mvp_by_ai_tool_score;
        }
        await base44.entities.Analysis.update(analysisId, {
          business_report: br,
          technical_report: tr,
        });
        lastOut = out;
        await updateProgress(17);
      }

      // AI tools (no-code/low-code focused)
      {
        const a0 = await getAnalysisById(base44, analysisId);
        const brCtx = a0?.business_report ? safeTruncate(JSON.stringify(a0.business_report), MAX_BUSINESS_CTX_CHARS) : "{}";
        const trCtx = a0?.technical_report ? safeTruncate(JSON.stringify(a0.technical_report), MAX_TECH_CTX_CHARS) : "{}";
        const schema = {
          type: "object",
          additionalProperties: true,
          properties: {
            ai_tools_recommendations: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: true,
                properties: {
                  name: { type: "string" },
                  category: { type: "string" },
                  primary_use_cases: { type: "array", items: { type: "string" } },
                  why_it_fits: { type: "string" },
                  pricing_tier: { type: "string" },
                  integration_notes: { type: "string" },
                  pros: { type: "array", items: { type: "string" } },
                  cons: { type: "array", items: { type: "string" } },
                  website_url: { type: "string" }
                }
              }
            }
          }
        };
        const prompt = `
You are advising a first-time founder who wants to launch a software idea fast and cheaply, with little to no coding.
${langNote}
${geoNote}
${industryNote}
Context (truncated):
Business Report (JSON):
${brCtx}

Technical Report (JSON):
${trCtx}

Goal:
Recommend 6–10 practical no-code or low-code tools to build and operate the MVP with minimum engineering effort.
Prioritize:
- Speed to launch (days to a few weeks)
- Low monthly cost (free or budget-friendly plans; ideally <= $50–$100 per tool)
- Ease of use for non-technical founders (templates, visual builders)
- Native integrations or easy automation (Zapier/Make, webhooks)
- Ability to grow or swap tools later to reduce lock-in

Cover a useful mix of categories, for example:
- No-code app builder (web/mobile)
- Database/spreadsheet backend (e.g., Airtable-like)
- Automation (Zapier/Make) to connect tools and workflows
- Forms/surveys and simple data capture
- Payments/auth/user management (if relevant)
- Chat/AI assistant or support bot
- CMS/website/landing page
- Analytics or session recording
- Lightweight CRM/helpdesk

For EACH tool, provide:
- name
- category (simple label like "No-code app builder", "Automation", "Forms", "CMS", "Payments", "Analytics", "Support/CRM")
- primary_use_cases (2–4 short bullets)
- why_it_fits (tie to this specific idea and the need to move fast without code)
- pricing_tier (e.g., "Free", "Starter $19/mo")
- integration_notes (how it connects to other tools, e.g., Zapier triggers/actions, native integrations, webhooks, data limits, data residency if relevant)
- pros (2–3, in plain language: speed, templates, affordability)
- cons (1–2, in plain language: limits, vendor lock-in, learning curve)
- website_url

Favor stacks that avoid custom code. If a bit of code may be needed, suggest the lowest-code path.
Keep the recommendations concise and practical for a founder starting today.

Return JSON strictly matching the schema.`;
        const out = await callLLMOrEmpty(schema, prompt, 'step_ai_tools', true);
        const a = await getAnalysisById(base44, analysisId);
        const tr = { ...(a?.technical_report || {}) };
        tr.ai_tools_recommendations = Array.isArray(out?.ai_tools_recommendations) ? out.ai_tools_recommendations : (tr.ai_tools_recommendations || []);
        await base44.entities.Analysis.update(analysisId, {
          technical_report: tr,
        });
        lastOut = out;
        await updateProgress(TOTAL_STEPS);
      }

      await base44.entities.Analysis.update(analysisId, {
        status: 'completed',
        report_generated: true,
        progress_percent: 100,
        last_error: null
      });
    };

    // Run the chain asynchronously to return a 202 quickly
    setTimeout(() => {
      processChain().catch(async (err) => {
        try {
          await base44.entities.Analysis.update(analysisId, {
            status: 'failed',
            last_error: err?.message || String(err) || 'Unknown error'
          });
        } catch (e2) { void e2; }
        console.error('Chained generation failed:', err);
      });
    }, 0);

    return Response.json({ status: 'started', analysisId }, { status: 202, headers: corsHeaders });
  } catch (error) {
    try {
      const base44 = createClientFromRequest(req);
      const urlBody = await req.json().catch(() => ({}));
      if (urlBody?.analysisId) {
        await base44.entities.Analysis.update(urlBody.analysisId, {
          status: 'failed',
          last_error: error?.message || String(error) || 'Unknown error'
        });
      }
    } catch (e3) { void e3; }
    return Response.json({ error: error.message || 'Chained generation failed' }, { status: 500, headers: corsHeaders });
  }
});