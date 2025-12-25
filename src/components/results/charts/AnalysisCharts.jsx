import React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const CHART_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#a855f7", // purple
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

const SEVERITY_COLORS = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

export function ScoresRadarChart({ data, isArabic = false }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 10]}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
          />
          <Radar
            name={isArabic ? "الدرجات" : "Scores"}
            dataKey="score"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.4}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionPieChart({ data, isArabic = false, title = "" }) {
  if (!data || data.length === 0) return null;

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <div className="w-full h-64 md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
            formatter={(value, name) => [value, name]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HorizontalBarChart({ data, isArabic = false, dataKey = "value", nameKey = "name" }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-64 md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis
            dataKey={nameKey}
            type="category"
            tick={{ fontSize: 11, fill: "#64748b" }}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VerticalBarChart({ data, isArabic = false, dataKey = "value", nameKey = "name", color = "#3b82f6" }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-64 md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey={nameKey}
            tick={{ fontSize: 10, fill: "#64748b" }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || color}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SWOTChart({ swot, isArabic = false }) {
  if (!swot) return null;

  const data = [
    {
      name: isArabic ? "نقاط القوة" : "Strengths",
      value: swot.strengths?.length || 0,
      color: "#10b981",
    },
    {
      name: isArabic ? "نقاط الضعف" : "Weaknesses",
      value: swot.weaknesses?.length || 0,
      color: "#ef4444",
    },
    {
      name: isArabic ? "الفرص" : "Opportunities",
      value: swot.opportunities?.length || 0,
      color: "#3b82f6",
    },
    {
      name: isArabic ? "التهديدات" : "Threats",
      value: swot.threats?.length || 0,
      color: "#f59e0b",
    },
  ].filter((item) => item.value > 0);

  if (data.length === 0) return null;

  return <DistributionPieChart data={data} isArabic={isArabic} />;
}

export function RiskSeverityChart({ risks, isArabic = false }) {
  if (!risks || risks.length === 0) return null;

  const severityCounts = risks.reduce((acc, risk) => {
    const severity = (risk.severity || "medium").toLowerCase();
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {});

  const data = [
    {
      name: isArabic ? "عالي" : "High",
      value: severityCounts.high || 0,
      color: SEVERITY_COLORS.high,
    },
    {
      name: isArabic ? "متوسط" : "Medium",
      value: severityCounts.medium || 0,
      color: SEVERITY_COLORS.medium,
    },
    {
      name: isArabic ? "منخفض" : "Low",
      value: severityCounts.low || 0,
      color: SEVERITY_COLORS.low,
    },
  ].filter((item) => item.value > 0);

  if (data.length === 0) return null;

  return <DistributionPieChart data={data} isArabic={isArabic} />;
}

export function RevenueStreamsChart({ streams, isArabic = false }) {
  if (!streams || streams.length === 0) return null;

  const potentialOrder = { high: 3, medium: 2, low: 1 };

  const data = streams.map((stream, index) => ({
    name: stream.name || `Stream ${index + 1}`,
    value: potentialOrder[(stream.potential || "medium").toLowerCase()] || 2,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return <HorizontalBarChart data={data} isArabic={isArabic} />;
}

export function TeamCostChart({ team, isArabic = false }) {
  if (!team || team.length === 0) return null;

  const data = team.map((member, index) => ({
    name: member.role || `Role ${index + 1}`,
    value: (member.monthly_cost_usd || 0) * (member.count || 1),
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return <HorizontalBarChart data={data} isArabic={isArabic} />;
}

export function TechStackChart({ stack, isArabic = false }) {
  if (!stack || stack.length === 0) return null;

  const categoryColors = {
    frontend: "#3b82f6",
    backend: "#10b981",
    database: "#f59e0b",
    infrastructure: "#a855f7",
  };

  const categoryCounts = stack.reduce((acc, tech) => {
    const category = (tech.category || "other").toLowerCase();
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(categoryCounts).map(([category, count]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: count,
    color: categoryColors[category] || "#64748b",
  }));

  return <DistributionPieChart data={data} isArabic={isArabic} />;
}

export function KPIsChart({ kpis, isArabic = false }) {
  if (!kpis || kpis.length === 0) return null;

  const data = kpis.slice(0, 6).map((kpi, index) => ({
    name: kpi.metric || `KPI ${index + 1}`,
    target: kpi.target || "N/A",
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {data.map((kpi, index) => (
        <div
          key={index}
          className="p-3 rounded-lg border-2 text-center"
          style={{ borderColor: kpi.color, backgroundColor: `${kpi.color}10` }}
        >
          <p className="text-xs text-slate-600 mb-1 truncate" title={kpi.name}>
            {kpi.name}
          </p>
          <p className="text-lg font-bold" style={{ color: kpi.color }}>
            {kpi.target}
          </p>
        </div>
      ))}
    </div>
  );
}

export function MarketSizeChart({ marketData, isArabic = false }) {
  if (!marketData?.market_size_usd && !marketData?.growth_rate_percent) return null;

  const data = [];
  
  if (marketData.market_size_usd) {
    data.push({
      name: isArabic ? "حجم السوق" : "Market Size",
      value: marketData.market_size_usd / 1000000,
      unit: "M USD",
      color: "#10b981",
    });
  }

  if (marketData.growth_rate_percent) {
    data.push({
      name: isArabic ? "معدل النمو" : "Growth Rate",
      value: marketData.growth_rate_percent,
      unit: "%",
      color: "#3b82f6",
    });
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {data.map((item, index) => (
        <div
          key={index}
          className="p-4 rounded-xl text-center"
          style={{ backgroundColor: `${item.color}15`, borderColor: item.color }}
        >
          <p className="text-sm text-slate-600 mb-2">{item.name}</p>
          <p className="text-2xl font-bold" style={{ color: item.color }}>
            {item.value.toFixed(1)}{item.unit}
          </p>
        </div>
      ))}
    </div>
  );
}
