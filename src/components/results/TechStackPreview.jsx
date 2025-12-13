
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, Server, Database, Cloud, Smartphone } from "lucide-react";

export default function TechStackPreview({ technicalReport }) {
  const tr = technicalReport || {};
  const stack = tr.technology_stack || {};
  // Removed rationale
  const suggestions = Array.isArray(tr.technology_stack_suggestions) ? tr.technology_stack_suggestions : [];

  const items = [
    { key: "frontend", label: "Frontend", icon: Layers, value: stack.frontend },
    { key: "backend", label: "Backend", icon: Server, value: stack.backend },
    { key: "database", label: "Database", icon: Database, value: stack.database },
    { key: "cloud", label: "Cloud", icon: Cloud, value: stack.cloud },
    { key: "mobile", label: "Mobile", icon: Smartphone, value: stack.mobile },
  ].filter((i) => i.value && String(i.value).trim().length > 0);

  // NEW: derive a concise description under the tags if not provided by the report
  const providedDesc =
    tr.technology_stack_description ||
    tr.technology_stack_overview ||
    null;
  const generatedDesc = items.length
    ? items.map((i) => `${i.label}: ${String(i.value)}`).join(" • ")
    : "";
  const stackOverviewText = providedDesc || generatedDesc;

  // Updated early return condition, removed rationale from check
  if (items.length === 0 && suggestions.length === 0 && !stackOverviewText) {
    return null;
  }

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-xl font-bold text-slate-800">
          Recommended Technology Stack
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {items.map(({ key, label, icon: Icon, value }) => (
              <Badge
                key={key}
                variant="outline"
                className="px-3 py-1.5 flex items-center gap-2 whitespace-normal break-words max-w-full"
                title={`${label}: ${String(value)}`}
              >
                <Icon className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="text-slate-700 font-medium shrink-0">{label}:</span>
                <span className="text-slate-700">{String(value)}</span>
              </Badge>
            ))}
          </div>
        )}

        {/* NEW: description under the tags */}
        {stackOverviewText && (
          <div className="rounded-lg border border-slate-200/60 bg-slate-50 p-4">
            <div className="font-semibold text-slate-800 mb-1">Stack Overview</div>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
              {stackOverviewText}
            </p>
          </div>
        )}

        {/* Removed "Why this stack?" rationale block */}

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-slate-600">
              Alternatives considered: {suggestions.length}
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map((sug, idx) => (
                <Badge key={idx} className="bg-purple-50 text-purple-700 border-purple-200 whitespace-normal break-words">
                  {sug?.name || `Option ${idx + 1}`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
