"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
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
  website_url: string;
  contact_linkedin: string | null;
  contact_twitter: string | null;
  contact_facebook: string | null;
  contact_instagram: string | null;
}

interface Subscription {
  monthly_lead_quota: number;
  reset_day: number;
  current_period_start: string;
  last_export_at: string | null;
  exported_this_period: boolean;
  export_formats: string | null;
}

interface AnalyticsData {
  sent: number; opened: number; openRate: number; bounced: number; bounceRate: number;
  replies: number; replyRate: number;
  classificationBreakdown: { classification: string; count: number }[];
  conversions: { status: string; count: number; totalValue: number }[];
  recentReplies: { id: number; sender: string; sender_email: string; subject: string; body: string; received_at: string; classification: string; company_name: string }[];
}
interface LeadMonthInfo {
  currentMonth: number;
  pastMonths: number;
  monthlyCap: number;
  total: number;
}

function extractHook(notes: string | null): string {
  if (!notes) return "";
  const match = notes.match(/Hook:\s*(.+?)(?:\n|$)/i);
  if (match) return match[1].trim();
  const firstLine = notes.split("\n")[0];
  if (firstLine.length > 10) return firstLine.trim();
  return "";
}

interface SocialLink { platform: string; url: string; }

function extractSocials(notes: string | null, lead?: Lead): SocialLink[] {
  const socials: SocialLink[] = [];
  const seen = new Set<string>();
  
  // Priority 1: Use dedicated columns (actual verified URLs)
  if (lead) {
    if (lead.contact_facebook && !seen.has('facebook')) { socials.push({ platform: 'Facebook', url: lead.contact_facebook }); seen.add('facebook'); }
    if (lead.contact_instagram && !seen.has('instagram')) { socials.push({ platform: 'Instagram', url: lead.contact_instagram }); seen.add('instagram'); }
    if (lead.contact_linkedin && !seen.has('linkedin')) { socials.push({ platform: 'LinkedIn', url: lead.contact_linkedin }); seen.add('linkedin'); }
    if (lead.contact_twitter && !seen.has('twitter')) { socials.push({ platform: 'Twitter/X', url: lead.contact_twitter }); seen.add('twitter'); }
  }
  
  if (!notes) return socials;
  
  // Priority 2: URL-based social media in notes
  const urlPatterns = [
    { platform: "Facebook", key: "facebook", regex: /Facebook:\s*(https?:\/\/[^\s\n]+)/gi },
    { platform: "Instagram", key: "instagram", regex: /Instagram:\s*(https?:\/\/[^\s\n]+)/gi },
    { platform: "LinkedIn", key: "linkedin", regex: /LinkedIn:\s*(https?:\/\/[^\s\n]+)/gi },
    { platform: "Twitter/X", key: "twitter", regex: /Twitter:\s*(https?:\/\/[^\s\n]+)/gi },
    { platform: "TikTok", key: "tiktok", regex: /TikTok:\s*(https?:\/\/[^\s\n]+)/gi },
    { platform: "YouTube", key: "youtube", regex: /YouTube:\s*(https?:\/\/[^\s\n]+)/gi },
  ];
  for (const { platform, key, regex } of urlPatterns) {
    if (seen.has(key)) continue;
    let m;
    while ((m = regex.exec(notes)) !== null) {
      socials.push({ platform, url: m[1] });
      seen.add(key);
    }
  }
  
  // Priority 3: "Social: facebook, instagram" — only show as platform names (no URL)
  const socialMatch = notes.match(/Social:\s*(.+)/i);
  if (socialMatch) {
    const platforms = socialMatch[1].split(/[,|]/).map(s => s.trim().toLowerCase());
    for (const p of platforms) {
      if (p && !seen.has(p)) {
        const name = p.charAt(0).toUpperCase() + p.slice(1);
        socials.push({ platform: name, url: "" });
        seen.add(p);
      }
    }
  }
  
  // Priority 4: Social links section from rewritten notes
  const linksMatch = notes.match(/Social links:\s*(.+)/i);
  if (linksMatch) {
    const parts = linksMatch[1].split('|');
    for (const part of parts) {
      const [platform, url] = part.split(': ').map(s => s.trim());
      const key = platform.toLowerCase();
      if (url && url.startsWith('http') && !seen.has(key)) {
        socials.push({ platform, url });
        seen.add(key);
      }
    }
  }
  
  // Priority 5: "Social platforms (no URL found)" section
  const noUrlMatch = notes.match(/Social platforms \(no URL found\):\s*(.+)/i);
  if (noUrlMatch) {
    const platforms = noUrlMatch[1].split(',').map(s => s.trim().toLowerCase());
    for (const p of platforms) {
      if (p && !seen.has(p)) {
        const name = p.charAt(0).toUpperCase() + p.slice(1);
        socials.push({ platform: `${name} (no link found)`, url: "" });
        seen.add(p);
      }
    }
  }
  
  return socials;
}

function extractLocation(notes: string | null, baseLocation: string | null): string {
  let loc = baseLocation || "";
  if (notes) {
    const sourceMatch = notes.match(/Source:\s*(.+?)(?:\n|$)/i);
    if (sourceMatch && !loc.includes(sourceMatch[1].trim())) {
      loc = loc ? `${loc} — ${sourceMatch[1].trim()}` : sourceMatch[1].trim();
    }
  }
  return loc || "—";
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
  const [leadMonthInfo, setLeadMonthInfo] = useState<LeadMonthInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState<"password" | "otp">("password");
  const [clientSlug, setClientSlug] = useState("");
  const [clientId, setClientId] = useState<number | null>(null);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

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
        setTempToken(data.tempToken);
        if (data.otpCode) setDebugOtp(data.otpCode);
        if (data.emailSent) {
          toast.success("Check your email for the code");
        } else {
          toast.info("Email could not be sent — use the code below");
        }
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
          tempToken,
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
      setLeadMonthInfo(data.leadMonthInfo || null);
      setClientSlug(params.slug as string);
      setClientId(data.clientId);
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
          tempToken,
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

  useEffect(() => {
    if (!authenticated || !params.slug) return;
    fetch(`/api/client-analytics/${params.slug}`)
      .then(r => r.json())
      .then(setAnalytics)
      .catch(() => {});
  }, [authenticated, params.slug]);

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
      const res = await fetch(`/api/leads/export?format=${format}&clientId=${clientId}`);
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
                {debugOtp && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-yellow-600 mb-1">Your verification code:</p>
                    <p className="text-3xl font-bold tracking-[0.3em] text-yellow-800">{debugOtp}</p>
                    <p className="text-xs text-yellow-500 mt-1">Enter this code below</p>
                  </div>
                )}
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
      {/* Hero Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-5 md:py-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">{client?.name}</h1>
              <p className="text-sm text-gray-500 mt-1">{client?.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Export:</span>
              {["xlsx", "docx", "pptx", "pdf"].map((fmt) => (
                <Button key={fmt} variant="outline" size="sm" className="h-8 px-2.5 text-xs"
                  onClick={() => handleExport(fmt)} disabled={subscription?.exported_this_period}>
                  {fmt.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          {subscription?.exported_this_period && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-3">
              Export used this period. Next export on the {subscription.reset_day}th.
            </p>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-8">

        {/* Monthly Lead Cap Banner */}
        {leadMonthInfo && leadMonthInfo.monthlyCap > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-blue-500 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-sm font-semibold text-gray-700">Monthly Lead Cap:</span>
              <span className="text-sm text-gray-600">
                <span className="font-bold text-blue-600">{leadMonthInfo.currentMonth}</span> this month
              </span>
              <span className="text-sm text-gray-400 hidden sm:inline">|</span>
              <span className="text-sm text-gray-600">
                <span className="font-bold text-gray-800">{leadMonthInfo.pastMonths}</span> from past months
              </span>
              <span className="text-sm text-gray-400 hidden sm:inline">|</span>
              <span className="text-sm text-gray-600">
                Cap: <span className="font-bold text-gray-800">{leadMonthInfo.monthlyCap}</span>/mo
              </span>
              <span className="text-sm text-gray-400 hidden sm:inline">|</span>
              <span className="text-sm text-gray-600">
                <span className="font-bold text-amber-600">{Math.max(0, leadMonthInfo.monthlyCap - leadMonthInfo.currentMonth)}</span> remaining this month
              </span>
            </div>
          </div>
        )}

        {/* KPI Cards — 2x2 on mobile, 4-col on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Total Leads", value: leads.length, color: "border-l-blue-500" },
            { label: "Avg Score", value: `${avgScore}/10`, color: "border-l-emerald-500" },
            { label: "Contacted", value: contactedCount, color: "border-l-amber-500" },
            { label: "Qualified", value: qualifiedCount, color: "border-l-purple-500" },
          ].map(k => (
            <div key={k.label} className={`bg-white rounded-xl border border-gray-100 border-l-4 ${k.color} p-4 shadow-sm`}>
              <p className="text-2xl font-bold text-gray-900">{k.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Charts — stacked on mobile, 2-col on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Lead Status</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={85} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">By Industry</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={industryData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={55} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Email Performance */}
        {analytics && (
          <>
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Email Performance</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[
                  { label: "Sent", value: analytics.sent, color: "border-l-blue-500" },
                  { label: "Opened", value: `${analytics.opened} (${analytics.openRate}%)`, color: "border-l-emerald-500" },
                  { label: "Replied", value: `${analytics.replies} (${analytics.replyRate}%)`, color: "border-l-amber-500" },
                  { label: "Bounced", value: `${analytics.bounced} (${analytics.bounceRate}%)`, color: "border-l-red-500" },
                ].map(k => (
                  <div key={k.label} className={`bg-white rounded-xl border border-gray-100 border-l-4 ${k.color} p-4 shadow-sm`}>
                    <p className="text-2xl font-bold text-gray-900">{k.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply Classification + Conversion Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analytics.classificationBreakdown.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Reply Classification</h3>
                  <div className="space-y-2">
                    {[
                      { key: "positive", label: "Positive", color: "bg-emerald-100 text-emerald-800" },
                      { key: "neutral", label: "Neutral", color: "bg-blue-100 text-blue-800" },
                      { key: "negative", label: "Negative", color: "bg-red-100 text-red-800" },
                      { key: "auto", label: "Auto", color: "bg-gray-100 text-gray-800" },
                    ].map(({ key, label, color }) => {
                      const item = analytics.classificationBreakdown.find(c => c.classification === key);
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{label}</span>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>
                            {item ? item.count : 0}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Conversion Pipeline</h3>
                {analytics.conversions.length > 0 ? (
                  <div className="space-y-2">
                    {[
                      { status: "replied", label: "Replied" },
                      { status: "meeting_scheduled", label: "Meeting Scheduled" },
                      { status: "proposal_sent", label: "Proposal Sent" },
                      { status: "negotiating", label: "Negotiating" },
                      { status: "closed_won", label: "Closed Won" },
                      { status: "closed_lost", label: "Closed Lost" },
                    ].map(({ status, label }) => {
                      const item = analytics.conversions.find(c => c.status === status);
                      return (
                        <div key={status}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-700">{label}</span>
                            <span className="font-semibold text-gray-900">
                              {item ? `${item.count}${item.totalValue ? ` ($${item.totalValue})` : ""}` : "0"}
                            </span>
                          </div>
                          {analytics.conversions.length > 1 && (
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${(item?.count || 0) / Math.max(...analytics.conversions.map(c => c.count)) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No conversions tracked yet</p>
                )}
              </div>
            </div>

            {/* Recent Replies */}
            {analytics.recentReplies.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Replies</h3>
                <div className="space-y-3">
                  {analytics.recentReplies.map(r => (
                    <div key={r.id} className="flex items-start justify-between gap-3 pb-3 border-b border-gray-50 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{r.company_name || r.sender}</p>
                        <p className="text-xs text-gray-500 truncate">{r.subject}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{r.body}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          r.classification === "positive" ? "bg-emerald-100 text-emerald-800" :
                          r.classification === "negative" ? "bg-red-100 text-red-800" :
                          r.classification === "neutral" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-600"
                        }`}>{r.classification || "auto"}</span>
                        <p className="text-xs text-gray-400 mt-1">{r.received_at ? new Date(r.received_at).toLocaleDateString() : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Lead List — Card-based for mobile */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Your Leads</h2>
          <p className="text-sm text-gray-500 mb-5">
            {leads.length} lead{leads.length !== 1 ? 's' : ''}
            {leadMonthInfo && (
              <span> — {leadMonthInfo.currentMonth} this month, {leadMonthInfo.pastMonths} from past months</span>
            )}
            — click any to see details
          </p>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="max-w-xs">Hook</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.sort((a, b) => b.score - a.score).map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedLead(lead)}>
                    <TableCell className="font-medium">
                      {lead.contact_name}
                      {lead.contact_email && <span className="block text-xs text-muted-foreground">{lead.contact_email}</span>}
                      {lead.website_url && (
                        <a href={lead.website_url} target="_blank" rel="noopener noreferrer"
                          className="block text-xs text-blue-500 hover:underline truncate max-w-[180px]"
                          onClick={e => e.stopPropagation()}>
                          {lead.website_url.replace(/^https?:\/\//, "").slice(0, 40)}
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{lead.location || "—"}</TableCell>
                    <TableCell className="text-sm">{lead.industry || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                        lead.score >= 9 ? "bg-red-100 text-red-800" :
                        lead.score >= 7 ? "bg-orange-100 text-orange-800" :
                        lead.score >= 5 ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"}`}>
                        {lead.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate" title={extractHook(lead.notes)}>
                      {extractHook(lead.notes) || "—"}
                    </TableCell>
                    <TableCell>
                      <select value={lead.status}
                        onChange={e => { e.stopPropagation(); updateLeadStatus(lead.id, e.target.value); }}
                        className="text-sm border rounded-lg px-3 py-2 bg-white">
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {leads.sort((a, b) => b.score - a.score).map((lead) => (
              <div key={lead.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm active:bg-gray-50"
                onClick={() => setSelectedLead(lead)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{lead.contact_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{lead.location || lead.industry || "—"}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold ${
                    lead.score >= 9 ? "bg-red-100 text-red-800" :
                    lead.score >= 7 ? "bg-orange-100 text-orange-800" :
                    lead.score >= 5 ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"}`}>
                    {lead.score}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2.5">
                  <select value={lead.status}
                    onChange={e => { e.stopPropagation(); updateLeadStatus(lead.id, e.target.value); }}
                    onClick={e => e.stopPropagation()}
                    className="text-xs border rounded-lg px-2.5 py-1.5 bg-gray-50 flex-1">
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {lead.contact_email && <span className="text-xs text-blue-600">✉️</span>}
                  {lead.contact_phone && <span className="text-xs text-blue-600">📞</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Detail Dialog */}
        <Dialog open={!!selectedLead} onOpenChange={(open) => { if (!open) setSelectedLead(null); }}>
          <DialogContent className="max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">{selectedLead?.contact_name || selectedLead?.company_name}</DialogTitle>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-5">
                {/* Score + Industry */}
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-sm font-bold ${
                    selectedLead.score >= 9 ? "bg-red-100 text-red-800" :
                    selectedLead.score >= 7 ? "bg-orange-100 text-orange-800" :
                    selectedLead.score >= 5 ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"}`}>
                    {selectedLead.score}/10
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Lead Score</p>
                    <p className="text-xs text-gray-500">{selectedLead.industry || "Unknown industry"}</p>
                  </div>
                </div>

                {/* Contact — Clean list */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</h4>
                  <div className="space-y-1.5 text-sm">
                    {selectedLead.contact_name && <p className="text-gray-900">{selectedLead.contact_name}</p>}
                    {selectedLead.contact_email && <a href={`mailto:${selectedLead.contact_email}`} className="block text-blue-600 hover:underline">✉️ {selectedLead.contact_email}</a>}
                    {selectedLead.contact_phone && <a href={`tel:${selectedLead.contact_phone}`} className="block text-blue-600 hover:underline">📞 {selectedLead.contact_phone}</a>}
                    {selectedLead.website_url && (
                      <a href={selectedLead.website_url.startsWith('http') ? selectedLead.website_url : `https://${selectedLead.website_url}`}
                        target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline truncate">
                        🌐 {selectedLead.website_url.replace(/^https?:\/\//, "").slice(0, 45)}
                      </a>
                    )}
                    {extractLocation(selectedLead.notes, selectedLead.location) !== "—" && (
                      <p className="text-gray-600">📍 {extractLocation(selectedLead.notes, selectedLead.location)}</p>
                    )}
                  </div>
                </div>

                {/* Social */}
                {extractSocials(selectedLead.notes, selectedLead).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Social</h4>
                    <div className="flex flex-wrap gap-2">
                      {extractSocials(selectedLead.notes, selectedLead).map((s, i) => (
                        s.url ? (
                          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-xs font-medium hover:bg-gray-200 transition">
                            {s.platform} ↗
                          </a>
                        ) : (
                          <span key={i} className="inline-flex items-center bg-gray-100 text-gray-500 rounded-full px-3 py-1 text-xs">
                            {s.platform}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Assessment */}
                {(selectedLead.notes.includes('Assessment:') || extractHook(selectedLead.notes)) && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Assessment</h4>
                    <p className="text-sm text-blue-900 leading-relaxed">
                      {selectedLead.notes.includes('Assessment:')
                        ? selectedLead.notes.split('Assessment:')[1].split('\n')[0].trim()
                        : extractHook(selectedLead.notes)}
                    </p>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <Label className="text-sm text-gray-600">Status:</Label>
                  <select value={selectedLead.status}
                    onChange={e => {
                      updateLeadStatus(selectedLead.id, e.target.value);
                      setSelectedLead({ ...selectedLead, status: e.target.value });
                    }}
                    className="text-sm border rounded-lg px-3 py-2 bg-white">
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
