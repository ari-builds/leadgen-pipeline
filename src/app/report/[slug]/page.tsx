"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from "recharts";

interface AuditIssue {
  status: string;
  detail: string;
}

interface LeadAudit {
  issues: Record<string, AuditIssue>;
  platform: string;
  healthScore: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  opportunity: string;
  recommendations: string[];
}

interface Lead {
  id: number;
  companyName: string;
  websiteUrl: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactFacebook: string;
  contactInstagram: string;
  contactLinkedin: string;
  contactTwitter: string;
  location: string;
  score: number;
  status: string;
  hasWebsite: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasSocial: boolean;
  dataCompleteness: number;
  quality: string;
  audit: LeadAudit | null;
}

interface ReportData {
  client: { id: number; name: string; description: string; slug: string };
  summary: {
    totalLeads: number; strongCount: number; goodCount: number; weakCount: number;
    withWebsite: number; withoutWebsite: number; withEmail: number; withPhone: number;
    withSocial: number; avgHealthScore: number; avgIssues: number;
  };
  breakdowns: {
    industry: { name: string; count: number }[];
    topIssues: { name: string; count: number }[];
    platforms: { name: string; count: number }[];
    cities: { name: string; count: number }[];
  };
  leads: Lead[];
}

const QC: Record<string, string> = { Strong: "#10b981", Good: "#f59e0b", Weak: "#ef4444" };

const PIE = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

function HealthBadge({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" :
    score >= 50 ? "bg-amber-50 text-amber-700 ring-amber-200" :
    "bg-red-50 text-red-700 ring-red-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${color}`}>
      {score}/100
    </span>
  );
}

function ContactDot({ has, color, label }: { has: boolean; color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1" title={label}>
      <span className={`w-2 h-2 rounded-full ${has ? color : "bg-gray-200"}`} />
      <span className={`text-xs ${has ? "text-gray-700" : "text-gray-400"}`}>{label}</span>
    </span>
  );
}

export default function ReportPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "strong" | "good" | "weak" | "no-website">("all");
  const [sortBy, setSortBy] = useState<"score" | "health" | "name">("score");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/reports/public/${slug}`);
        if (!res.ok) throw new Error("Failed to load report");
        setData(await res.json());
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let leads = [...data.leads];
    if (filter === "strong") leads = leads.filter(l => l.quality === "Strong");
    else if (filter === "good") leads = leads.filter(l => l.quality === "Good");
    else if (filter === "weak") leads = leads.filter(l => l.quality === "Weak");
    else if (filter === "no-website") leads = leads.filter(l => !l.hasWebsite);
    if (sortBy === "score") leads.sort((a, b) => b.score - a.score);
    else if (sortBy === "health") leads.sort((a, b) => (b.audit?.healthScore || 0) - (a.audit?.healthScore || 0));
    else leads.sort((a, b) => a.companyName.localeCompare(b.companyName));
    return leads;
  }, [data, filter, sortBy]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto" />
        <p className="text-sm text-gray-400 mt-4">Loading report...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <p className="text-red-500 text-lg">{error || "No data found"}</p>
        <p className="text-gray-400 mt-2 text-sm">This report may not be available yet.</p>
      </div>
    </div>
  );

  const { client: c, summary: s, breakdowns: b } = data;
  const qualityData = [
    { name: "Strong", value: s.strongCount },
    { name: "Good", value: s.goodCount },
    { name: "Weak", value: s.weakCount },
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
          <p className="text-xs font-semibold text-blue-600 tracking-widest uppercase">NetClicks by Ari</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2 break-words">{c.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{c.description}</p>
          <p className="text-xs text-gray-400 mt-3">
            Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} — {s.totalLeads} leads analyzed
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-8 md:space-y-12">

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {[
            { label: "Total Leads", value: s.totalLeads, accent: "text-gray-900" },
            { label: "Strong", value: s.strongCount, accent: "text-emerald-600" },
            { label: "Avg Health", value: `${s.avgHealthScore}`, accent: "text-blue-600" },
            { label: "Has Website", value: s.withWebsite, accent: "text-purple-600" },
            { label: "No Website", value: s.withoutWebsite, accent: "text-orange-600" },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 text-center shadow-sm">
              <p className={`text-2xl md:text-3xl font-bold ${k.accent}`}>{k.value}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Charts — stacked on mobile, 2-col on desktop */}
        <div className="space-y-6">
          {/* Quality + Industry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Lead Quality</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={qualityData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}>
                    {qualityData.map(e => <Cell key={e.name} fill={QC[e.name]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">By Industry</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={b.industry.slice(0, 6)}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Issues + Platforms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Website Issues</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={b.topIssues.slice(0, 8)} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Platforms</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={b.platforms} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="name"
                    label={(p) => `${p.name ?? ""}: ${p.value ?? ""}`}>
                    {b.platforms.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Best Prospects — No Website */}
        {s.withoutWebsite > 0 && (
          <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl border border-orange-100 p-5 md:p-8">
            <h3 className="text-lg font-bold text-orange-900">
              Best Prospects — {s.withoutWebsite} Businesses Without Websites
            </h3>
            <p className="text-sm text-orange-700/80 mt-1 mb-5">These businesses need a website the most.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.leads.filter(l => !l.hasWebsite).map(lead => (
                <div key={lead.id} className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm">
                  <p className="font-semibold text-gray-900 text-sm">{lead.companyName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{lead.location || "No location"}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
                    {lead.contactPhone && <span>📞 {lead.contactPhone}</span>}
                    {lead.contactEmail && <span>✉️ {lead.contactEmail}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cities */}
        {b.cities.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Geographic Distribution</h3>
            <div className="flex flex-wrap gap-2">
              {b.cities.slice(0, 15).map(city => (
                <span key={city.name} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs font-medium">
                  {city.name} <span className="text-blue-400">({city.count})</span>
                </span>
              ))}
              {b.cities.length > 15 && (
                <span className="text-xs text-gray-400 self-center">+{b.cities.length - 15} more</span>
              )}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {(["all", "strong", "good", "weak", "no-website"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  filter === f ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}>
                {f === "no-website" ? "No Website" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 sm:ml-auto">
            {(["score", "health", "name"] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  sortBy === s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}>
                {s === "score" ? "Score" : s === "health" ? "Health" : "A-Z"}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 sm:hidden">{filtered.length} leads</span>
        </div>

        {/* Lead List */}
        <div className="space-y-3">
          {filtered.map(lead => {
            const isOpen = expanded === lead.id;
            return (
              <div key={lead.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                {/* Collapsed Header — Two lines max */}
                <button className="w-full text-left p-4 md:p-5" onClick={() => setExpanded(isOpen ? null : lead.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: QC[lead.quality] }}>
                        {lead.quality.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm md:text-base truncate">{lead.companyName}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                          {lead.location && <span className="text-xs text-gray-500">{lead.location}</span>}
                          {lead.industry && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{lead.industry}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="hidden sm:flex items-center gap-2">
                        <ContactDot has={lead.hasEmail} color="bg-emerald-400" label="Email" />
                        <ContactDot has={lead.hasPhone} color="bg-blue-400" label="Phone" />
                        <ContactDot has={lead.hasSocial} color="bg-purple-400" label="Social" />
                      </div>
                      {lead.audit && <HealthBadge score={lead.audit.healthScore} />}
                      {!lead.hasWebsite && (
                        <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full font-medium">No site</span>
                      )}
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {/* Mobile contact dots */}
                  <div className="flex sm:hidden items-center gap-3 mt-2">
                    <ContactDot has={lead.hasEmail} color="bg-emerald-400" label="Email" />
                    <ContactDot has={lead.hasPhone} color="bg-blue-400" label="Phone" />
                    <ContactDot has={lead.hasSocial} color="bg-purple-400" label="Social" />
                  </div>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-4 pb-5 md:px-5 md:pb-6 pt-4 space-y-5 bg-gray-50/50">
                    {/* Contact + Social */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact</h4>
                        <div className="space-y-1.5 text-sm">
                          {lead.contactEmail && <a href={`mailto:${lead.contactEmail}`} className="block text-blue-600 hover:underline truncate">✉️ {lead.contactEmail}</a>}
                          {lead.contactPhone && <a href={`tel:${lead.contactPhone}`} className="block text-blue-600 hover:underline">📞 {lead.contactPhone}</a>}
                          {lead.websiteUrl && (
                            <a href={lead.websiteUrl.startsWith("http") ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                              target="_blank" rel="noopener noreferrer"
                              className="block text-blue-600 hover:underline truncate">
                              🌐 {lead.websiteUrl.replace(/^https?:\/\//, "").slice(0, 45)}
                            </a>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Social</h4>
                        <div className="flex flex-wrap gap-2">
                          {lead.contactFacebook && <a href={lead.contactFacebook} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full hover:bg-blue-100">Facebook</a>}
                          {lead.contactInstagram && <a href={lead.contactInstagram} target="_blank" rel="noopener noreferrer" className="text-xs bg-pink-50 text-pink-700 px-2.5 py-1 rounded-full hover:bg-pink-100">Instagram</a>}
                          {lead.contactLinkedin && <a href={lead.contactLinkedin} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full hover:bg-blue-100">LinkedIn</a>}
                          {lead.contactTwitter && <a href={lead.contactTwitter} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full hover:bg-gray-200">Twitter/X</a>}
                          {!lead.hasSocial && <span className="text-xs text-gray-400">No social media found</span>}
                        </div>
                      </div>
                    </div>

                    {/* Audit Summary */}
                    {lead.audit && (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">{lead.audit.platform}</span>
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">{lead.audit.passCount} pass</span>
                          <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">{lead.audit.warnCount} warnings</span>
                          <span className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full">{lead.audit.failCount} critical</span>
                        </div>

                        {lead.audit.opportunity && (
                          <div className="bg-blue-50 rounded-xl p-3.5 text-sm text-blue-800">
                            <span className="font-semibold">Opportunity:</span> {lead.audit.opportunity}
                          </div>
                        )}

                        {/* Issues — Collapsible */}
                        <details className="group">
                          <summary className="text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none">
                            Website Audit Results ({Object.keys(lead.audit.issues).length} checks)
                          </summary>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                            {Object.entries(lead.audit.issues).map(([key, issue]) => (
                              <div key={key} className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
                                issue.status === "pass" ? "bg-emerald-50" :
                                issue.status === "warn" ? "bg-amber-50" : "bg-red-50"
                              }`}>
                                <span className="mt-0.5 shrink-0">
                                  {issue.status === "pass" ? "✅" : issue.status === "warn" ? "⚠️" : "❌"}
                                </span>
                                <span className={`leading-relaxed ${issue.status === "pass" ? "text-emerald-800" :
                                  issue.status === "warn" ? "text-amber-800" : "text-red-800"}`}>
                                  {issue.detail}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>

                        {lead.audit.recommendations.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recommended Services</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {lead.audit.recommendations.map((rec, i) => (
                                <span key={i} className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs font-medium">{rec}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* No Website Callout */}
                    {!lead.hasWebsite && (
                      <div className="bg-orange-50 rounded-xl p-4 text-sm text-orange-800">
                        This business has no website. They&apos;re a prime prospect for web development services.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-xs text-gray-400 border-t border-gray-100">
          <p>Generated by <span className="font-semibold text-gray-500">NetClicks by Ari</span></p>
          <p className="mt-1">Proprietary lead intelligence — {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
