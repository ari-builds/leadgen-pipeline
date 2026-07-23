"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
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
} from "recharts";

interface Client {
  name: string;
  description: string;
}

interface Lead {
  id: number;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  industry: string;
  location: string;
  score: number;
  status: string;
  notes: string;
}

interface Subscription {
  monthly_lead_quota: number;
  reset_day: number;
  current_period_start: string;
  last_export_at: string | null;
  exported_this_period: boolean;
  export_formats: string | null;
}

function extractHook(notes: string | null): string {
  if (!notes) return "";
  const match = notes.match(/Hook:\s*(.+?)(?:\n|$)/i);
  return match ? match[1].trim() : "";
}

const COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ClientDashboardPage() {
  const params = useParams();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [client, setClient] = useState<Client | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState<"password" | "otp">("password");
  const [clientSlug, setClientSlug] = useState("");

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/client-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: params.slug,
          password,
          email,
          step: "password",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      if (data.needsOTP) {
        setEmail(data.email);
        setAuthStep("otp");
        toast.success("Check your email for the code");
      }
    } catch {
      toast.error("Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleOTPSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/client-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: params.slug,
          code: otpCode,
          step: "otp",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      setClient(data.client);
      setLeads(data.leads);
      setSubscription(data.subscription || null);
      setClientSlug(params.slug as string);
      setAuthenticated(true);
    } catch {
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function updateLeadStatus(leadId: number, newStatus: string) {
    try {
      const res = await fetch("/api/client-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: clientSlug,
          lead_id: leadId,
          status: newStatus,
          step: "update_status",
        }),
      });
      if (!res.ok) {
        toast.error("Failed to update status");
        return;
      }
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  }

  const statusOptions = ["new", "contacted", "qualified", "closed"];

  // Analytics computations
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      counts[l.status] = (counts[l.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const industryData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const ind = l.industry || "Unknown";
      counts[ind] = (counts[ind] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [leads]);

  const scoreData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const bucket = `${l.score}`;
      counts[bucket] = (counts[bucket] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name: `Score ${name}`, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [leads]);

  const avgScore = leads.length > 0
    ? Math.round(leads.reduce((a, l) => a + l.score, 0) / leads.length)
    : 0;

  const qualifiedCount = leads.filter((l) => l.status === "qualified").length;
  const contactedCount = leads.filter((l) => l.status === "contacted").length;

  // Export handler
  async function handleExport(format: string) {
    if (subscription?.exported_this_period) {
      toast.error("You've already exported this month. Next export available on the " + (subscription.reset_day || 1) + "th.");
      return;
    }
    toast.info("Preparing " + format.toUpperCase() + " export...");
    try {
      const res = await fetch(`/api/leads/export?format=${format}&client_id=1`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${format}-${new Date().toISOString().slice(0, 10)}.${format === "xlsx" ? "xlsx" : format === "docx" ? "docx" : format === "pptx" ? "pptx" : "pdf"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded!");
    } catch {
      toast.error("Export failed");
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Client Dashboard</CardTitle>
            <CardDescription>
              {authStep === "password"
                ? "Enter your email and password to view leads"
                : `Enter the code sent to ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authStep === "password" ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Continue"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOTPSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.5em]"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Verify"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setAuthStep("password")}
                >
                  Back
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client?.name}</h1>
            <p className="text-muted-foreground mt-1">{client?.description}</p>
          </div>
          <div className="flex gap-2">
            {["xlsx", "docx", "pptx", "pdf"].map((fmt) => (
              <Button
                key={fmt}
                variant="outline"
                size="sm"
                onClick={() => handleExport(fmt)}
                disabled={subscription?.exported_this_period}
              >
                {fmt.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
        {subscription?.exported_this_period && (
          <p className="text-sm text-amber-600 mt-2">
            Export used this period. Next export available on the {subscription.reset_day}th.
          </p>
        )}
      </header>

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Leads</CardDescription>
              <CardTitle className="text-3xl">{leads.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Score</CardDescription>
              <CardTitle className="text-3xl">{avgScore}/10</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Contacted</CardDescription>
              <CardTitle className="text-3xl">{contactedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Qualified</CardDescription>
              <CardTitle className="text-3xl">{qualifiedCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By Industry</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={industryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leads
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 5)
                  .map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-2 rounded bg-gray-50">
                      <div>
                        <span className="font-medium text-sm">{lead.contact_name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{lead.location}</span>
                      </div>
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        lead.score >= 9 ? "bg-red-100 text-red-800" :
                        lead.score >= 7 ? "bg-orange-100 text-orange-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {lead.score}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Leads</CardTitle>
            <CardDescription>
              {leads.length} leads generated for your business. Mark leads as you contact them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="max-w-xs">Score Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads
                  .sort((a, b) => b.score - a.score)
                  .map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.contact_name}
                        {lead.contact_email && (
                          <span className="block text-xs text-muted-foreground">{lead.contact_email}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{lead.location || "—"}</TableCell>
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
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1 bg-white"
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
