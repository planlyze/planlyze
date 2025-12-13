
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ScoreCard({
  title,
  Icon,
  score,          // number 0-10 or null
  max = 10,
  color = "#10b981", // default emerald
  subtitle,       // e.g., "Excellent", "Good", etc.
  footnote,       // small helper text (optional)
}) {
  const safeScore = typeof score === "number" && !isNaN(score) ? Math.min(max, Math.max(0, score)) : null;
  const percent = safeScore == null ? 0 : Math.round((safeScore / max) * 100);
  const ringColor = color || "#10b981";
  const trackColor = "#e5e7eb"; // slate-200
  const textColor = "#0f172a";  // slate-900

  return (
    <Card className="glass-effect border-0 shadow-lg h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          {Icon && <Icon className="w-5 h-5" style={{ color: ringColor }} />}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <div
          className="relative h-24 w-24 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(${ringColor} ${percent}%, ${trackColor} 0)`,
          }}
        >
          <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: textColor }}>
                {safeScore != null ? `${safeScore}/10` : "-"}
              </div>
              <div className="text-[10px] text-slate-500">{percent}%</div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {subtitle && (
            <Badge variant="secondary" className="mb-2">
              {subtitle}
            </Badge>
          )}
          {footnote && (
            <p className="text-xs text-slate-500 leading-relaxed">{footnote}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
