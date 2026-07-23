"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/export-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";

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

interface Client {
  id: number;
  name: string;
  slug: string;
  description: string;
  ideal_customer_profile: string;
  created_at: string;
}

interface Lead {
  id: number;
  company_name: string;
  contact_name: string;
  contact_email: string;
  industry: string;
  score: number;
  status: string;
  notes: string;
}

function extractHook(notes: string | null): string {
  if (!notes) return "";
  const match = notes.match(/Hook:\s*(.+?)(?:\n|$)/i);
  return match ? match[1].trim() : "";
}

export default function ClientDetailPage() {
  const params = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [clientRes, leadsRes] = await Promise.all([
          fetch(`/api/clients/${params.id}`),
          fetch(`/api/leads?clientId=${params.id}`),
        ]);
        if (clientRes.ok) setClient(await clientRes.json());
        if (leadsRes.ok) setLeads(await leadsRes.json());
      } catch {
        toast.error("Failed to load client data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!client) {
    return <div className="text-center py-12">Client not found</div>;
  }

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    qualified: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/clients" className="text-sm text-muted-foreground hover:underline">
            ← Back to Clients
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{client.name}</h1>
          <p className="text-muted-foreground mt-1">{client.description}</p>
        </div>
        <div className="flex gap-2">
          <ExportButton clientId={Number(params.id)} />
          <a href={`/client/${client.slug}`} target="_blank">
            <Button variant="outline">Client Dashboard ↗</Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Leads</CardDescription>
            <CardTitle className="text-3xl">{leads.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Qualified</CardDescription>
            <CardTitle className="text-3xl">
              {leads.filter((l) => l.status === "qualified").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Score</CardDescription>
            <CardTitle className="text-3xl">
              {leads.length > 0
                ? Math.round(
                    leads.reduce((a, l) => a + l.score, 0) / leads.length
                  )
                : 0}
              /10
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Ideal Customer Profile */}
      {client.ideal_customer_profile && (() => {
        let icp: Record<string, unknown>;
        try { icp = JSON.parse(client.ideal_customer_profile); } catch { icp = {}; }
        const icpObj = icp as Record<string, string | string[] | Record<string, string>>;
        return (
          <Card>
            <CardHeader>
              <CardTitle>Ideal Customer Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {icpObj.business && (
                <div><span className="font-medium text-sm">Business:</span> <span className="text-sm">{String(icpObj.business)}</span></div>
              )}
              {icpObj.owner && (
                <div><span className="font-medium text-sm">Owner:</span> <span className="text-sm">{String(icpObj.owner)}</span></div>
              )}
              {icpObj.location && (
                <div><span className="font-medium text-sm">Location:</span> <span className="text-sm">{String(icpObj.location)}</span></div>
              )}
              {icpObj.target_audience && (
                <div><span className="font-medium text-sm">Target Audience:</span> <span className="text-sm">{String(icpObj.target_audience)}</span></div>
              )}
              {Array.isArray(icpObj.services) && icpObj.services.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Services:</span>
                  <ul className="list-disc list-inside text-sm mt-1 space-y-0.5">
                    {icpObj.services.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {icpObj.demographics && typeof icpObj.demographics === "object" && (
                <div>
                  <span className="font-medium text-sm">Demographics:</span>
                  <span className="text-sm ml-1">
                    {Object.entries(icpObj.demographics).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" | ")}
                  </span>
                </div>
              )}
              {Array.isArray(icpObj.segments) && icpObj.segments.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Segments:</span>
                  <ul className="list-disc list-inside text-sm mt-1 space-y-0.5">
                    {icpObj.segments.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {Array.isArray(icpObj.competitor_weaknesses) && icpObj.competitor_weaknesses.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Competitor Weaknesses:</span>
                  <ul className="list-disc list-inside text-sm mt-1 space-y-0.5">
                    {icpObj.competitor_weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {Array.isArray(icpObj.seasonal_triggers) && icpObj.seasonal_triggers.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Seasonal Triggers:</span>
                  <ul className="list-disc list-inside text-sm mt-1 space-y-0.5">
                    {icpObj.seasonal_triggers.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Analytics Charts */}
      {leads.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Leads by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "New", value: leads.filter((l) => l.status === "new").length },
                      { name: "Contacted", value: leads.filter((l) => l.status === "contacted").length },
                      { name: "Qualified", value: leads.filter((l) => l.status === "qualified").length },
                      { name: "Closed", value: leads.filter((l) => l.status === "closed").length },
                    ].filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {["new", "contacted", "qualified", "closed"].map((status) => (
                      <Cell key={status} fill={STATUS_COLORS[status]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leads by Industry</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const map = new Map<string, number>();
                leads.forEach((l) => {
                  const ind = l.industry || "Unknown";
                  map.set(ind, (map.get(ind) || 0) + 1);
                });
                const industryData = Array.from(map.entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([name, count]) => ({ name, count }));

                return (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={industryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={70} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {industryData.map((_, i) => (
                          <Cell key={i} fill={INDUSTRY_COLORS[i % INDUSTRY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assigned Leads</CardTitle>
          <CardDescription>All leads assigned to this client</CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-muted-foreground text-sm">No leads assigned yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="max-w-xs">Score Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                        {lead.contact_name || lead.company_name || "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{lead.industry || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        lead.score >= 9 ? "bg-red-100 text-red-800" :
                        lead.score >= 7 ? "bg-orange-100 text-orange-800" :
                        lead.score >= 5 ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {lead.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate" title={extractHook(lead.notes)}>
                      {extractHook(lead.notes) || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[lead.status] || ""}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
