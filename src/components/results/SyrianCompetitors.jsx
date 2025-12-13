
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Check, X, Globe, Facebook, Instagram, Linkedin, MessageCircle, Send, Apple, Play } from "lucide-react";

export default function SyrianCompetitors({ businessReport = {}, isArabic = false }) {
  const t = (en, ar) => (isArabic ? ar : en);

  // Helpers
  const coerceArray = (v) =>
    Array.isArray(v) ? v.filter(Boolean) : (v ? String(v).split(/[\n,;]+/).map(s => s.trim()).filter(Boolean) : []);

  // Deeply traverse nested boolean maps into dot-paths (accepts multiple truthy encodings)
  const listFromBooleanMap = (obj) => {
    if (!obj || typeof obj !== "object") return [];
    const out = [];
    const isTrue = (v) => v === true || v === 1 || v === "1" || v === "true" || v === "yes";
    const walk = (node, path = []) => {
      if (!node || typeof node === "function") return; // Added type check for function to prevent errors
      for (const [k, v] of Object.entries(node)) {
        const next = path.concat(k);
        if (v && typeof v === "object" && !Array.isArray(v) && !React.isValidElement(v)) { // Added isValidElement to avoid React elements
          walk(v, next);
        } else if (isTrue(v)) {
          out.push(next.join("."));
        }
      }
    };
    walk(obj, []);
    return out;
  };

  // NEW: Robust extractor that gathers features from any feature-like fields
  const extractFeatures = (c) => {
    if (!c || typeof c !== 'object') return [];

    const collected = [
      ...(Array.isArray(c?.notable_features) ? c.notable_features : []),
      ...(Array.isArray(c?.features) ? c.features : []), // This might be an array or an object
      ...(Array.isArray(c?.features_flat) ? c.features_flat : []),
      ...(Array.isArray(c?.feature_list) ? c.feature_list : []),
    ];

    // Known boolean maps commonly used
    const knownMaps = new Set([
      "features", // Re-process if it's an object
      "features_map",
      "feature_flags",
      "capabilities",
      "capability_map",
      "attributes",
      "attribute_flags",
      "options",
      "options_map"
    ]);

    // Track processed keys to avoid double-processing or infinite loops
    const processedKeys = new Set(['notable_features', 'features_flat', 'feature_list']);

    Object.entries(c).forEach(([k, v]) => {
      if (processedKeys.has(k)) return; // Skip already directly handled array fields

      if (knownMaps.has(k)) { // Specific handling for known maps
        if (v && typeof v === "object" && !Array.isArray(v)) {
          collected.push(...listFromBooleanMap(v));
          processedKeys.add(k); // Mark as processed
        } else if (Array.isArray(v)) { // If it's a 'features' key that was an array
          collected.push(...v);
          processedKeys.add(k);
        }
      } else if (!/feature|capabil|function|flag|option|service/i.test(k)) {
        return; // Skip if key name doesn't suggest a feature
      } else if (v == null) {
        return; // Skip null/undefined values
      } else if (processedKeys.has(k)) {
        return; // Skip if already processed by a generic rule
      }

      // Generic processing for other feature-like fields
      if (typeof v === "object" && !Array.isArray(v)) {
        collected.push(...listFromBooleanMap(v));
      } else if (Array.isArray(v)) {
        collected.push(...v);
      } else {
        collected.push(...coerceArray(v));
      }
      processedKeys.add(k); // Mark as processed
    });

    return collected.filter(Boolean).map(String);
  };


  // NEW: Detect inactive apps from common fields
  const detectInactive = (c) => {
    if (!c || typeof c !== "object") return false;
    const s = String(c.status || c.app_status || c.availability || c.state || "").toLowerCase();
    if (
      s.includes("inactive") || s.includes("closed") || s.includes("discontinued") ||
      s.includes("shutdown") || s.includes("shut down") || s.includes("dead") ||
      s.includes("offline") || s.includes("unavailable")
    ) return true;

    const toBool = (v) => v === true || v === 1 || v === "1" || String(v).toLowerCase() === "true";
    const toFalse = (v) => v === false || v === 0 || v === "0" || String(v).toLowerCase() === "false";

    if (toBool(c.inactive) || toBool(c.is_inactive)) return true;
    if (toFalse(c.active) || toFalse(c.is_active)) return true;

    if (c.status_flags && typeof c.status_flags === "object") {
      const f = c.status_flags;
      if (toBool(f.inactive) || toBool(f.closed) || toBool(f.discontinued)) return true;
    }
    return false;
  };

  const normKey = (s) => String(s || "").toLowerCase().trim().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
  const humanize = (s) => {
    if (!s) return "";
    const spaced = String(s).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_\-.]+/g, " ");
    return spaced.replace(/\s+/g, " ").trim().replace(/\b\w/g, (m) => m.toUpperCase());
  };

  // Try multiple possible keys that may contain the user-supplied competitors
  const rawInput =
    businessReport?.syrian_competitors ??
    businessReport?.competitors_syrian ??
    businessReport?.syrian_competitors_object ??
    businessReport?.syrian_competitors_map ??
    businessReport?.user_supplied_competitors ??
    null;

  const normalizeCompetitors = (raw) => {
    if (!raw) return [];
    const fallbackCategory = businessReport?.industry_name || "";

    if (Array.isArray(raw)) {
      return raw
        .map((c) => {
          const features = extractFeatures(c);

          const social = c?.social || c?.socialMedia || {};
          const apps = c?.app_links || c?.appLinks || {};

          return {
            name: c?.name || c?.appName || "",
            category: c?.category || c?.industry || fallbackCategory,
            description: c?.description || c?.summary || "",
            notable_features: features,
            strengths: coerceArray(c?.strengths || c?.pros),
            weaknesses: coerceArray(c?.weaknesses || c?.cons),
            notes: c?.notes || "",
            website_url: c?.website_url || c?.website || c?.url || c?.link || apps?.website || "",
            social: {
              facebook: social?.facebook ?? null,
              instagram: social?.instagram ?? null,
              linkedin: social?.linkedIn ?? social?.linkedin ?? null,
              whatsapp: social?.whatsapp ?? null,
              telegram: social?.telegram ?? null
            },
            app_links: {
              android: apps?.android ?? null,
              ios: apps?.ios ?? null,
              website: apps?.website ?? null
            },
            // NEW
            inactive: detectInactive(c),
            status_text: c?.status || c?.app_status || c?.availability || "",
            // Keep the original features object for precise display if available
            features: c?.features || null
          };
        })
        .filter((c) => c.name);
    }

    if (typeof raw === "object") {
      return Object.entries(raw)
        .map(([keyName, val]) => {
          if (val && typeof val === "object") {
            const features = extractFeatures(val);

            const socialSrc = val.social || val.socialMedia || {};
            const appsSrc = val.app_links || val.appLinks || {};

            return {
              name: val.name || val.appName || keyName,
              category: val.category || val.industry || fallbackCategory,
              description: val.description || val.summary || "",
              notable_features: features,
              strengths: coerceArray(val.strengths || val.pros),
              weaknesses: coerceArray(val.weaknesses || val.cons),
              notes: val.notes || "",
              website_url: val.website_url || val.website || val.url || val.link || appsSrc?.website || "",
              social: {
                facebook: socialSrc?.facebook ?? null,
                instagram: socialSrc?.instagram ?? null,
                linkedin: socialSrc?.linkedIn ?? socialSrc?.linkedin ?? null,
                whatsapp: socialSrc?.whatsapp ?? null,
                telegram: socialSrc?.telegram ?? null
              },
              app_links: {
                android: appsSrc?.android ?? null,
                ios: appsSrc?.ios ?? null,
                website: appsSrc?.website ?? null
              },
              // NEW
              inactive: detectInactive(val),
              status_text: val?.status || val?.app_status || val?.availability || "",
              // Keep the original features object for precise display if available
              features: val?.features || null
            };
          }
          return {
            name: String(keyName),
            category: fallbackCategory,
            description: String(val || ""),
            notable_features: [],
            strengths: [],
            weaknesses: [],
            notes: "",
            website_url: "",
            social: {},
            app_links: {},
            // NEW
            inactive: false,
            status_text: "",
            features: null
          };
        })
        .filter((c) => c.name);
    }

    return [];
  };

  const allCompetitors = normalizeCompetitors(rawInput);

  const selectedIndustry = businessReport?.industry_name;

  // Filter by category if available; fallback to all if filter results empty
  let items = allCompetitors;
  if (selectedIndustry) {
    const filtered = allCompetitors.filter(
      (c) => c.category && String(c.category).toLowerCase() === String(selectedIndustry).toLowerCase()
    );
    items = filtered.length ? filtered : allCompetitors;
  }

  const diffRecs = Array.isArray(businessReport?.syrian_competitors_meta?.differentiation_recommendations)
    ? businessReport.syrian_competitors_meta.differentiation_recommendations
    : (Array.isArray(businessReport?.competitors_syrian_meta?.differentiation_recommendations)
      ? businessReport.competitors_syrian_meta.differentiation_recommendations
      : []);

  if (items.length === 0) return null;

  // EXACT feature differences from file: read labels exactly as in file
  const isTruthyFeature = (v) => {
    if (v == null) return false;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      return ["true", "yes", "y", "1", "on", "enabled", "present", "available", "supported", "has", "✓", "✔", "✅"].some(t => s === t);
    }
    if (typeof v === "object") {
      // Common patterns: {value: true}, {enabled: "yes"}, {present: 1}
      const candidates = [v.value, v.enabled, v.present, v.available, v.supported, v.has, v.flag, v.active];
      return candidates.some((x) => isTruthyFeature(x));
    }
    return false;
  };

  // Extract feature labels exactly-as-file for a single competitor
  const getExactFeatureLabels = (comp) => {
    const f = comp?.features;
    const out = new Set();

    if (!f) return out;

    if (Array.isArray(f)) {
      f.forEach((item) => {
        if (item == null) return;
        if (typeof item === "string" || typeof item === "number") {
          const label = String(item).trim();
          if (label) out.add(label);
        } else if (typeof item === "object") {
          // Support array of objects: {label/name/title/feature, value/enabled/...}
          const label = item.label ?? item.name ?? item.title ?? item.feature ?? "";
          const val = item.value ?? item.enabled ?? item.present ?? item.available ?? item.supported ?? item.has ?? true;
          const labelStr = String(label).trim();
          if (labelStr && isTruthyFeature(val)) out.add(labelStr);
        }
      });
      return out;
    }

    if (typeof f === "object") {
      Object.entries(f).forEach(([label, val]) => {
        const lbl = String(label).trim();
        if (!lbl) return;
        if (isTruthyFeature(val)) out.add(lbl);
      });
      return out;
    }

    return out;
  };

  // Build union of all labels and per-competitor sets (exact strings)
  const featureSetsPerCompetitor = items.map(getExactFeatureLabels);
  const allLabelsSet = new Set();
  featureSetsPerCompetitor.forEach((set) => set.forEach((lbl) => allLabelsSet.add(lbl)));
  const allLabels = Array.from(allLabelsSet);

  // Count how many competitors have each label
  const trueCounts = new Map();
  allLabels.forEach((label) => {
    let ct = 0;
    featureSetsPerCompetitor.forEach((set) => {
      if (set.has(label)) ct += 1;
    });
    trueCounts.set(label, ct);
  });

  const total = items.length || 0;

  // Keep only differentiating labels; fallback to all if identical
  let informativeLabels = allLabels.filter((label) => {
    const ct = trueCounts.get(label) || 0;
    return ct > 0 && ct < total;
  });
  if (informativeLabels.length === 0 && allLabels.length > 0) {
    informativeLabels = allLabels;
  }

  // Sort by frequency desc then alphabetically
  informativeLabels.sort((a, b) => {
    const da = trueCounts.get(a) || 0;
    const db = trueCounts.get(b) || 0;
    if (db !== da) return db - da;
    return a.localeCompare(b);
  });

  const topFeatureLabels = informativeLabels.slice(0, 20);

  const hasFeature = (compIndex, featureLabel) => featureSetsPerCompetitor[compIndex]?.has(featureLabel) || false;

  const LinkIconBtn = ({ href, title, children }) => {
    if (!href) return null;
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        title={title}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
      >
        {children}
      </a>
    );
  };

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-rose-600" />
          <CardTitle className="text-xl font-bold text-slate-800">
            {t("Syrian Competitors (User-supplied)", "المنافسون في سوريا (بيانات المستخدم)")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* How to be unique */}
        {diffRecs.length > 0 && (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
            <h4 className="font-semibold text-emerald-800 mb-2">
              {t("How to be unique in Syria", "كيف تكون الفكرة مميزة في سوريا")}
            </h4>
            <ul className="list-disc ms-5 text-sm text-emerald-900 space-y-1">
              {diffRecs.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {/* Features comparison (exact labels from file) */}
        {topFeatureLabels.length > 0 && (
          <div className="rounded-xl border border-slate-200">
            <div className="px-4 pt-3">
              <h4 className="text-sm font-semibold text-slate-800">
                {t("Feature Differences", "فروقات الميزات")}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("Showing the most informative features across competitors.", "عرض أكثر الميزات تمييزًا بين المنافسين.")}
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {topFeatureLabels.map((label, i) => (
                <div key={i} className="p-4">
                  <div className="font-medium text-slate-800">{label}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {items.map((c, idx) => {
                      const present = hasFeature(idx, label);
                      return (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${
                            present
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}
                          title={c.name}
                        >
                          {present ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          <span className="truncate max-w-[140px]">{c.name}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual competitor cards with links */}
        {items.map((c, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border border-slate-200/70 ${c.inactive ? 'bg-slate-50 opacity-95' : 'bg-white'}`}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-slate-900 truncate">{c.name}</h4>
                  {c.category && <Badge variant="secondary">{c.category}</Badge>}
                  {c.inactive && (
                    <Badge className="bg-rose-100 text-rose-700 border-rose-200">
                      {t("Inactive", "غير نشط")}
                    </Badge>
                  )}
                </div>

                {/* Social & app links */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <LinkIconBtn href={c.website_url || c.app_links?.website} title={t("Website", "الموقع")}>
                    <Globe className="w-4 h-4" />
                  </LinkIconBtn>
                  <LinkIconBtn href={c.social?.facebook} title="Facebook">
                    <Facebook className="w-4 h-4" />
                  </LinkIconBtn>
                  <LinkIconBtn href={c.social?.instagram} title="Instagram">
                    <Instagram className="w-4 h-4" />
                  </LinkIconBtn>
                  <LinkIconBtn href={c.social?.linkedin} title="LinkedIn">
                    <Linkedin className="w-4 h-4" />
                  </LinkIconBtn>
                  <LinkIconBtn href={c.social?.whatsapp ? (String(c.social.whatsapp).startsWith("http") ? c.social.whatsapp : `https://wa.me/${c.social.whatsapp}`) : null} title="WhatsApp">
                    <MessageCircle className="w-4 h-4" />
                  </LinkIconBtn>
                  <LinkIconBtn href={c.social?.telegram} title="Telegram">
                    <Send className="w-4 h-4" />
                  </LinkIconBtn>
                  {/* Updated app store icons */}
                  <LinkIconBtn href={c.app_links?.android} title="Google Play">
                    <Play className="w-4 h-4" />
                  </LinkIconBtn>
                  <LinkIconBtn href={c.app_links?.ios} title="App Store">
                    <Apple className="w-4 h-4" />
                  </LinkIconBtn>
                </div>

                {c.description && (
                  <p className="text-sm text-slate-600 mt-2">{c.description}</p>
                )}
                {/* Optional status text */}
                {c.status_text && (
                  <p className="text-xs text-slate-500 mt-1">
                    {t("Status:", "الحالة:")} {c.status_text}
                  </p>
                )}
              </div>
            </div>

            {/* Pros/Cons and notes */}
            {(Array.isArray(c.strengths) && c.strengths.length > 0 || Array.isArray(c.weaknesses) && c.weaknesses.length > 0) && (
              <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-emerald-700">
                        {t("Pros", "الإيجابيات")}
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-rose-700">
                        {t("Cons", "السلبيات")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="align-top">
                      <td className="px-4 py-2">
                        {Array.isArray(c.strengths) && c.strengths.length > 0 ? (
                          <ul className="list-disc ms-5 space-y-1 text-slate-700">
                            {c.strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {Array.isArray(c.weaknesses) && c.weaknesses.length > 0 ? (
                          <ul className="list-disc ms-5 space-y-1 text-slate-700">
                            {c.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {c.notes && (
              <div className="mt-2 text-sm text-slate-600">
                <span className="font-semibold">{t("Notes:", "ملاحظات:")}</span> {c.notes}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
