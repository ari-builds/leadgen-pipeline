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
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                        {lead.company_name}
                      </Link>
                    </TableCell>
                    <TableCell>{lead.contact_name}</TableCell>
                    <TableCell>{lead.industry}</TableCell>
                    <TableCell>{lead.score}/10</TableCell>
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
