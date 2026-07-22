"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalLeads: number;
  totalClients: number;
  leadsThisMonth: number;
  avgScore: number;
  statusBreakdown: { status: string; count: number }[];
  topClients: { name: string; lead_count: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [leadsRes, clientsRes] = await Promise.all([
          fetch("/api/leads"),
          fetch("/api/clients"),
        ]);
        const leads = await leadsRes.json();
        const clients = await clientsRes.json();

        const now = new Date();
        const thisMonth = leads.filter((l: Record<string, unknown>) => {
          const d = new Date(l.created_at as string);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });

        const statusMap: Record<string, number> = {};
        leads.forEach((l: Record<string, unknown>) => {
          const s = (l.status as string) || "new";
          statusMap[s] = (statusMap[s] || 0) + 1;
        });

        const scoreSum = leads.reduce((acc: number, l: Record<string, unknown>) => acc + ((l.score as number) || 0), 0);

        setStats({
          totalLeads: leads.length,
          totalClients: clients.length,
          leadsThisMonth: thisMonth.length,
          avgScore: leads.length > 0 ? Math.round(scoreSum / leads.length) : 0,
          statusBreakdown: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
          topClients: clients
            .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.lead_count as number) - (a.lead_count as number))
            .slice(0, 5),
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Welcome to LeadGen Pipeline</h2>
        <p className="text-muted-foreground mt-2">
          Start by adding your first client and scraping some leads.
        </p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    qualified: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your lead generation pipeline</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Leads</CardDescription>
            <CardTitle className="text-3xl">{stats.totalLeads}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Clients</CardDescription>
            <CardTitle className="text-3xl">{stats.totalClients}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Leads This Month</CardDescription>
            <CardTitle className="text-3xl">{stats.leadsThisMonth}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Score</CardDescription>
            <CardTitle className="text-3xl">{stats.avgScore}/10</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Status</CardTitle>
            <CardDescription>Breakdown by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.statusBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-sm">No leads yet</p>
            ) : (
              stats.statusBreakdown.map(({ status, count }) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[status] || "bg-gray-100"}>
                      {status}
                    </Badge>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Top Clients</CardTitle>
            <CardDescription>By number of assigned leads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topClients.length === 0 ? (
              <p className="text-muted-foreground text-sm">No clients yet</p>
            ) : (
              stats.topClients.map((client, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-medium">{client.name}</span>
                  <Badge variant="secondary">{client.lead_count} leads</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
