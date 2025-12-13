import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, FileText, DollarSign } from "lucide-react";

const COLORS = ['#6d28d9', '#ea580c', '#10b981', '#3b82f6', '#f59e0b'];

export default function ActivityCharts({ stats }) {
  // Prepare data for premium vs free analyses
  const analysisTypeData = [
    { name: 'Premium', value: stats.premiumAnalyses, color: '#6d28d9' },
    { name: 'Free', value: stats.freeAnalyses, color: '#94a3b8' }
  ];

  // Prepare user activity data (last 7 days)
  const userActivityData = stats.dailyActivity || [];

  // Prepare credit sales data
  const creditSalesData = stats.monthlySales || [];

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Premium vs Free Analysis */}
      <Card className="glass-effect border-2 border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-purple-600" />
            Analysis Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analysisTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analysisTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-2xl font-bold text-purple-700">{stats.premiumAnalyses}</p>
              <p className="text-sm text-slate-600">Premium Reports</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-2xl font-bold text-slate-700">{stats.freeAnalyses}</p>
              <p className="text-sm text-slate-600">Free Reports</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Activity Trend */}
      <Card className="glass-effect border-2 border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            User Activity (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={userActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="newUsers" fill="#10b981" name="New Users" radius={[8, 8, 0, 0]} />
              <Bar dataKey="activeUsers" fill="#6d28d9" name="Active Users" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Credit Sales Trend */}
      <Card className="glass-effect border-2 border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5 text-orange-600" />
            Credit Sales (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={creditSalesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#ea580c" 
                strokeWidth={3}
                name="Revenue ($)"
                dot={{ fill: '#ea580c', r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="credits" 
                stroke="#6d28d9" 
                strokeWidth={3}
                name="Credits Sold"
                dot={{ fill: '#6d28d9', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Active Users by Country */}
      <Card className="glass-effect border-2 border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-blue-600" />
            Top Countries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.topCountries || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="country" type="category" width={100} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="users" fill="#3b82f6" name="Users" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}