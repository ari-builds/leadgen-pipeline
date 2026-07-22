"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExportButton } from "@/components/export-button";
import { toast } from "sonner";

interface Lead {
  id: number;
  company_name: string;
  contact_name: string;
  contact_email: string;
  industry: string;
  location: string;
  score: number;
  status: string;
  client_names: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: "#2563EB",
  contacted: "#CA8A04",
  qualified: "#16A34A",
  closed: "#7C3AED",
};

const INDUSTRY_COLORS = [
  "#2563EB", "#CA8A04", "#16A34A", "#7C3AED", "#DC2626",
  "#0891B2", "#DB2777", "#65A30D", "#EA580C", "#6366F1",
];

export default function AnalyticsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data) => setLeads(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>;
  }

  const totalLeads = leads.length;
  const avgScore =
    totalLeads > 0
      ? (leads.reduce((a, l) => a + l.score, 0) / totalLeads).toFixed(1)
      : "0";

  const statusCounts = {
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    qualified: leads.filter((l) => l.status === "qualified").length,
    closed: leads.filter((l) => l.status === "closed").length,
  };

  // Status pie data
  const statusData = [
    { name: "New", value: statusCounts.new },
    { name: "Contacted", value: statusCounts.contacted },
    { name: "Qualified", value: statusCounts.qualified },
    { name: "Closed", value: statusCounts.closed },
  ];

  // Industry bar data
  const industryMap = new Map<string, number>();
  leads.forEach((l) => {
    const ind = l.industry || "Unknown";
    industryMap.set(ind, (industryMap.get(ind) || 0) + 1);
  });
  const industryData = Array.from(industryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Score distribution
  const scoreBuckets = [
    { range: "1-2", count: 0 },
    { range: "3-4", count: 0 },
    { range: "5-6", count: 0 },
    { range: "7-8", count: 0 },
    { range: "9-10", count: 0 },
  ];
  leads.forEach((l) => {
    if (l.score <= 2) scoreBuckets[0].count++;
    else if (l.score <= 4) scoreBuckets[1].count++;
    else if (l.score <= 6) scoreBuckets[2].count++;
    else if (l.score <= 8) scoreBuckets[3].count++;
    else scoreBuckets[4].count++;
  });

  // Top 10 leads
  const topLeads = [...leads].sort((a, b) => b.score - a.score).slice(0, 10);

  // Unique clients count
  const clientSet = new Set(
    leads
      .map((l) => l.client_names)
      .filter(Boolean)
      .flatMap((c) => c.split(", "))
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Overview of all leads across clients
          </p>
        </div>
        <ExportButton />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Leads</CardDescription>
            <CardTitle className="text-3xl">{totalLeads}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Score</CardDescription>
            <CardTitle className="text-3xl">{avgScore}/10</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Qualified</CardDescription>
            <CardTitle className="text-3xl">{statusCounts.qualified}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clients</CardDescription>
            <CardTitle className="text-3xl">{clientSet.size}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Leads by Status</CardTitle>
            <CardDescription>Distribution of lead statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name.toLowerCase()] || "#999"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Industry Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Leads by Industry</CardTitle>
            <CardDescription>Top industries represented</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={industryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  height={70}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {industryData.map((_, i) => (
                    <Cell key={i} fill={INDUSTRY_COLORS[i % INDUSTRY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>How leads are scored</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Leads</CardTitle>
            <CardDescription>Highest scoring leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topLeads.map((lead, i) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-5">
                      {i + 1}.
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {lead.company_name || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.contact_name || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{lead.score}/10</span>
                    <p className="text-xs text-muted-foreground">
                      {lead.status}
                    </p>
                  </div>
                </div>
              ))}
              {topLeads.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No leads yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
