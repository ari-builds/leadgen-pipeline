"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend,
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

const QUALITY_COLORS: Record<string, string> = { Strong: "#10b981", Good: "#f59e0b", Weak: "#ef4444" };
const STATUS_COLORS: Record<string, string> = { pass: "#10b981", warn: "#f59e0b", fail: "#ef4444" };
const PIE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function ReportPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedLead, setExpandedLead] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "strong" | "good" | "weak" | "no-website">("all");
  const [sortBy, setSortBy] = useState<"score" | "health" | "name">("score");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/reports/public/${slug}`);
        if (!res.ok) throw new Error("Failed to load report");
        const reportData = await res.json();
        setData(reportData);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const filteredLeads = useMemo(() => {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading report...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-red-500 text-lg">{error || "No data found"}</p>
        <p className="text-gray-400 mt-2">This report may not be available yet.</p>
      </div>
    </div>
  );

  const { client: c, summary: s, breakdowns: b } = data;

  const qualityData = [
    { name: "Strong", value: s.strongCount },
    { name: "Good", value: s.goodCount },
    { name: "Weak", value: s.weakCount },
  ].filter(d => d.value > 0);

  const contactData = [
    { name: "Email", value: s.withEmail },
    { name: "Phone", value: s.withPhone },
    { name: "Social", value: s.withSocial },
    { name: "No Email", value: s.totalLeads - s.withEmail },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold tracking-wide uppercase">NetClicks by Ari</p>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">{c.name} — Lead Analysis Report</h1>
              <p className="text-gray-500 mt-1">{c.description}</p>
            </div>
            <div className="text-right text-sm text-gray-400">
              <p>Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              <p>{s.totalLeads} leads analyzed</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Leads", value: s.totalLeads, color: "text-gray-900" },
            { label: "Strong", value: s.strongCount, color: "text-emerald-600" },
            { label: "Avg Health", value: `${s.avgHealthScore}/100`, color: "text-blue-600" },
            { label: "With Website", value: s.withWebsite, color: "text-purple-600" },
            { label: "No Website", value: s.withoutWebsite, color: "text-orange-600" },
            { label: "Avg Issues", value: s.avgIssues, color: "text-red-600" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">{kpi.label}</p>
              <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Quality Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Lead Quality</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={qualityData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {qualityData.map((entry) => (
                    <Cell key={entry.name} fill={QUALITY_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Industry Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">By Industry</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={b.industry.slice(0, 6)}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Website Issues */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Website Issues</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={b.topIssues.slice(0, 6)} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Platforms</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={b.platforms} cx="50%" cy="50%" outerRadius={70} dataKey="count" nameKey="name" label={(props) => `${props.name ?? ""}: ${props.value ?? ""}`}>
                  {b.platforms.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* No-Website Leads (Best Prospects) */}
        {s.withoutWebsite > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-6">
            <h3 className="text-lg font-bold text-orange-900 mb-2">
              Best Prospects — {s.withoutWebsite} Businesses Without Websites
            </h3>
            <p className="text-sm text-orange-700 mb-4">
              These businesses have NO website at all. They need you the most.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.leads.filter(l => !l.hasWebsite).map(lead => (
                <div key={lead.id} className="bg-white rounded-lg p-3 border border-orange-200">
                  <p className="font-semibold text-gray-900 text-sm">{lead.companyName}</p>
                  <p className="text-xs text-gray-500">{lead.location || "No location"}</p>
                  {lead.contactPhone && <p className="text-xs text-blue-600 mt-1">{lead.contactPhone}</p>}
                  {lead.contactEmail && <p className="text-xs text-blue-600">{lead.contactEmail}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* City Breakdown */}
        {b.cities.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Geographic Distribution</h3>
            <div className="flex flex-wrap gap-2">
              {b.cities.map(city => (
                <span key={city.name} className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs font-medium text-blue-700">
                  {city.name} <span className="text-blue-400">({city.count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filter + Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-500">Filter:</span>
          {(["all", "strong", "good", "weak", "no-website"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
              {f === "no-website" ? "No Website" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-sm text-gray-500">Sort:</span>
          {(["score", "health", "name"] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                sortBy === s ? "bg-gray-800 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <span className="text-sm text-gray-400 ml-auto">{filteredLeads.length} leads</span>
        </div>

        {/* Lead Cards */}
        <div className="space-y-3">
          {filteredLeads.map(lead => (
            <div key={lead.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Lead Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Quality Badge */}
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: QUALITY_COLORS[lead.quality] }}>
                    {lead.quality.charAt(0)}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">{lead.companyName}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      {lead.location && <span>{lead.location}</span>}
                      {lead.industry && <span className="bg-gray-100 px-2 py-0.5 rounded">{lead.industry}</span>}
                      {lead.hasWebsite && <span className="text-green-600">Has website</span>}
                      {!lead.hasWebsite && <span className="text-orange-600 font-medium">No website</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Contact pills */}
                  <div className="flex gap-1">
                    {lead.hasEmail && <span className="w-2 h-2 rounded-full bg-green-400" title="Has email"></span>}
                    {lead.hasPhone && <span className="w-2 h-2 rounded-full bg-blue-400" title="Has phone"></span>}
                    {lead.hasSocial && <span className="w-2 h-2 rounded-full bg-purple-400" title="Has social"></span>}
                  </div>
                  {/* Health Score */}
                  {lead.audit && (
                    <div className={`text-center px-3 py-1 rounded-lg ${
                      lead.audit.healthScore >= 70 ? "bg-green-50 text-green-700" :
                      lead.audit.healthScore >= 50 ? "bg-yellow-50 text-yellow-700" :
                      "bg-red-50 text-red-700"
                    }`}>
                      <p className="text-lg font-bold">{lead.audit.healthScore}</p>
                      <p className="text-[10px] uppercase">Health</p>
                    </div>
                  )}
                  {!lead.hasWebsite && (
                    <div className="text-center px-3 py-1 rounded-lg bg-orange-50 text-orange-700">
                      <p className="text-lg font-bold">{lead.dataCompleteness}%</p>
                      <p className="text-[10px] uppercase">Complete</p>
                    </div>
                  )}
                  {/* Expand Arrow */}
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedLead === lead.id ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedLead === lead.id && (
                <div className="border-t border-gray-100 p-5 bg-gray-50">
                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase">Contact</h4>
                      {lead.contactEmail && (
                        <a href={`mailto:${lead.contactEmail}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                          <span className="text-gray-400">Email:</span> {lead.contactEmail}
                        </a>
                      )}
                      {lead.contactPhone && (
                        <a href={`tel:${lead.contactPhone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                          <span className="text-gray-400">Phone:</span> {lead.contactPhone}
                        </a>
                      )}
                      {lead.websiteUrl && (
                        <a href={lead.websiteUrl.startsWith("http") ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                          <span className="text-gray-400">Website:</span> {lead.websiteUrl.replace(/^https?:\/\//, "").slice(0, 50)}
                        </a>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase">Social</h4>
                      <div className="flex flex-wrap gap-2">
                        {lead.contactFacebook && (
                          <a href={lead.contactFacebook} target="_blank" rel="noopener noreferrer"
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-100">Facebook</a>
                        )}
                        {lead.contactInstagram && (
                          <a href={lead.contactInstagram} target="_blank" rel="noopener noreferrer"
                            className="text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded-full hover:bg-pink-100">Instagram</a>
                        )}
                        {lead.contactLinkedin && (
                          <a href={lead.contactLinkedin} target="_blank" rel="noopener noreferrer"
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-100">LinkedIn</a>
                        )}
                        {lead.contactTwitter && (
                          <a href={lead.contactTwitter} target="_blank" rel="noopener noreferrer"
                            className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-full hover:bg-gray-100">Twitter/X</a>
                        )}
                        {!lead.hasSocial && <span className="text-xs text-gray-400">No social media found</span>}
                      </div>
                    </div>
                  </div>

                  {/* Website Audit Results */}
                  {lead.audit && (
                    <div className="space-y-4">
                      {/* Platform + Opportunity */}
                      <div className="flex flex-wrap gap-3">
                        <span className="inline-flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium">
                          Platform: <span className="ml-1 font-bold">{lead.audit.platform}</span>
                        </span>
                        <span className="inline-flex items-center bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-1.5 text-xs">
                          {lead.audit.passCount} pass
                        </span>
                        <span className="inline-flex items-center bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg px-3 py-1.5 text-xs">
                          {lead.audit.warnCount} warnings
                        </span>
                        <span className="inline-flex items-center bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-1.5 text-xs">
                          {lead.audit.failCount} critical
                        </span>
                      </div>

                      {/* Opportunity */}
                      {lead.audit.opportunity && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-700 mb-1">Opportunity</p>
                          <p className="text-sm text-blue-900">{lead.audit.opportunity}</p>
                        </div>
                      )}

                      {/* Issues Grid */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Website Audit Results</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {Object.entries(lead.audit.issues).map(([key, issue]) => (
                            <div key={key} className={`flex items-start gap-2 p-2 rounded text-xs ${
                              issue.status === "pass" ? "bg-green-50" :
                              issue.status === "warn" ? "bg-yellow-50" : "bg-red-50"
                            }`}>
                              <span className="mt-0.5">
                                {issue.status === "pass" ? "✅" : issue.status === "warn" ? "⚠️" : "❌"}
                              </span>
                              <span className={issue.status === "pass" ? "text-green-800" :
                                issue.status === "warn" ? "text-yellow-800" : "text-red-800"}>
                                {issue.detail}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommended Services */}
                      {lead.audit.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Recommended Services</h4>
                          <div className="flex flex-wrap gap-2">
                            {lead.audit.recommendations.map((rec, i) => (
                              <span key={i} className="inline-flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs font-medium">
                                {rec}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* No Website - Directory Listings */}
                  {!lead.hasWebsite && (
                    <div className="bg-orange-50 rounded-lg p-4 mt-4">
                      <h4 className="text-sm font-semibold text-orange-800 mb-2">No Website — Prime Prospect</h4>
                      <p className="text-sm text-orange-700">
                        This business has no website and needs one. They can be reached at the contact info above.
                        Reach out with a proposal for a custom website.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-gray-400 border-t border-gray-200">
          <p>Report generated by <span className="font-semibold text-gray-600">NetClicks by Ari</span></p>
          <p className="mt-1">Proprietary prospecting system — {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
