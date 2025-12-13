import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Globe } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

export default function MarketAnalysis({ report, isArabic = false }) {
  if (!report) {
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardContent className="text-center py-16">
          <p className="text-slate-600">{isArabic ? 'لا تتوفر بيانات تحليل السوق.' : 'Market analysis data not available.'}</p>
        </CardContent>
      </Card>
    );
  }

  const marketSize = report.market_size || {};

  // Helper for conditional text alignment based on RTL
  const textAlignClass = isArabic ? 'text-right' : 'text-left';

  // --- Added helpers for redesigned Market Size ---
  const parseMarketNumber = (val) => {
    if (!val) return null;
    const s = String(val).trim();

    // Quick rejection if clearly non-numeric text without any digits
    if (!/\d/.test(s)) return null;

    // Normalize
    const lower = s.toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ');

    // Extract number and suffix (k, m, b, t)
    const match = lower.match(/([\d.]+)\s*([kmbt])?/);
    if (!match) return null;

    let num = parseFloat(match[1]);
    if (isNaN(num)) return null;

    const suffix = match[2];
    const multipliers = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };
    if (suffix && multipliers[suffix]) num *= multipliers[suffix];

    return num > 0 ? num : null;
  };

  const formatPercent = (value) => `${Math.round(value)}%`;

  const tamNum = parseMarketNumber(marketSize.tam);
  const samNum = parseMarketNumber(marketSize.sam);
  const somNum = parseMarketNumber(marketSize.som);

  // Base for percentages: TAM if valid, otherwise the max of available values
  const base = tamNum || Math.max(...[samNum, somNum].filter(v => v != null), 0);
  const hasParsable = base > 0;

  const tamPct = tamNum != null && base > 0 ? (tamNum / base) * 100 : null;
  const samPct = samNum != null && base > 0 ? (samNum / base) * 100 : null;
  const somPct = somNum != null && base > 0 ? (somNum / base) * 100 : null;

  const barDir = isArabic ? 'to left' : 'to right';

  const BarRow = ({ label, valueStr, percent, color, chipRefLabel }) => {
    return (
      <div className="space-y-2">
        <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            {hasParsable && percent != null && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {formatPercent(percent)} {chipRefLabel ? (isArabic ? 'من' : 'of') + ' ' + chipRefLabel : ''}
              </span>
            )}
          </div>
          <div className="text-sm text-slate-600">{valueStr || (isArabic ? 'غير متوفر' : 'N/A')}</div>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full"
            style={{
              width: `${hasParsable && percent != null ? Math.max(4, Math.min(100, percent)) : 0}%`,
              background: `linear-gradient(${barDir}, ${color}, ${color})`,
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Market Opportunity */}
      {report.market_opportunity && (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              {isArabic ? 'الفرصة السوقية' : 'Market Opportunity'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-slate-700 whitespace-pre-wrap ${textAlignClass}`}>{report.market_opportunity}</p>
          </CardContent>
        </Card>
      )}

      {/* Market Size: TAM / SAM / SOM - Redesigned */}
      {(marketSize.tam || marketSize.sam || marketSize.som) && (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              {isArabic ? 'حجم السوق (TAM / SAM / SOM)' : 'Market Size (TAM / SAM / SOM)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasParsable ? (
              <div className="space-y-6">
                {/* Visual Bar Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'TAM', value: tamNum || 0, fill: '#3b82f6' },
                        { name: 'SAM', value: samNum || 0, fill: '#a855f7' },
                        { name: 'SOM', value: somNum || 0, fill: '#10b981' },
                      ].filter(d => d.value > 0)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <XAxis type="number" tickFormatter={(v) => {
                        if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
                        if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
                        if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
                        return `$${v}`;
                      }} />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip 
                        formatter={(v) => {
                          if (v >= 1e9) return [`$${(v / 1e9).toFixed(2)}B`, 'Value'];
                          if (v >= 1e6) return [`$${(v / 1e6).toFixed(2)}M`, 'Value'];
                          if (v >= 1e3) return [`$${(v / 1e3).toFixed(2)}K`, 'Value'];
                          return [`$${v}`, 'Value'];
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {[
                          { name: 'TAM', value: tamNum || 0, fill: '#3b82f6' },
                          { name: 'SAM', value: samNum || 0, fill: '#a855f7' },
                          { name: 'SOM', value: somNum || 0, fill: '#10b981' },
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Progress Bars */}
                <div className="space-y-4">
                  <BarRow
                    label="TAM"
                    valueStr={marketSize.tam}
                    percent={tamPct}
                    color="#3b82f6"
                    chipRefLabel={isArabic ? 'TAM' : 'TAM'}
                  />
                  <BarRow
                    label="SAM"
                    valueStr={marketSize.sam}
                    percent={samPct}
                    color="#a855f7"
                    chipRefLabel="TAM"
                  />
                  <BarRow
                    label="SOM"
                    valueStr={marketSize.som}
                    percent={somPct}
                    color="#10b981"
                    chipRefLabel="TAM"
                  />
                </div>

                <p className={`text-xs text-slate-500 ${textAlignClass}`}>
                  {isArabic
                    ? 'النسب تظهر مقارنةً بـ TAM. في حال عدم توفر قيم دقيقة، يتم استخدام أعلى قيمة متاحة كأساس.'
                    : 'Percentages are relative to TAM; if TAM is unavailable, the largest available value is used as the base.'}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {marketSize.tam && (
                  <div className={`p-4 rounded-lg bg-blue-50 border border-blue-100 ${textAlignClass}`}>
                    <p className="text-sm font-semibold text-blue-800">TAM</p>
                    <p className="text-blue-700">{marketSize.tam}</p>
                  </div>
                )}
                {marketSize.sam && (
                  <div className={`p-4 rounded-lg bg-purple-50 border border-purple-100 ${textAlignClass}`}>
                    <p className="text-sm font-semibold text-purple-800">SAM</p>
                    <p className="text-purple-700">{marketSize.sam}</p>
                  </div>
                )}
                {marketSize.som && (
                  <div className={`p-4 rounded-lg bg-emerald-50 border border-emerald-100 ${textAlignClass}`}>
                    <p className="text-sm font-semibold text-emerald-800">SOM</p>
                    <p className="text-emerald-700">{marketSize.som}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Local Demand Assessment (Syria) */}
      {report.local_demand_assessment && (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-600" />
              {isArabic ? 'تقييم الطلب المحلي (سوريا)' : 'Local Demand (Syria)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-slate-700 whitespace-pre-wrap ${textAlignClass}`}>{report.local_demand_assessment}</p>
          </CardContent>
        </Card>
      )}

      {/* Competition Analysis */}
      {report.competition_analysis && (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-600" />
              {isArabic ? 'تحليل المنافسة' : 'Competition Analysis'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-slate-700 whitespace-pre-wrap ${textAlignClass}`}>{report.competition_analysis}</p>
          </CardContent>
        </Card>
      )}

      {/* Infrastructure Readiness */}
      {report.infrastructure_readiness && (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-red-600" />
              {isArabic ? 'جاهزية البنية التحتية' : 'Infrastructure Readiness'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-slate-700 whitespace-pre-wrap ${textAlignClass}`}>{report.infrastructure_readiness}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}