"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Site {
  id: number;
  business_name: string;
  business_category: string;
  tagline: string;
  status: string;
  site_url: string;
  vercel_url: string;
  created_at: string;
  deployed_at: string;
}

interface BusinessConfig {
  businessName: string;
  tagline: string;
  category: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  description: string;
  services: { title: string; description: string }[];
  features: { title: string; description: string }[];
}

const defaultServices = [
  { title: "", description: "" },
  { title: "", description: "" },
  { title: "", description: "" },
];

const defaultFeatures = [
  { title: "", description: "" },
  { title: "", description: "" },
  { title: "", description: "" },
];

const industries = [
  { value: "professional", label: "Professional / Corporate" },
  { value: "restaurant", label: "Food & Restaurants" },
  { value: "health", label: "Health & Wellness" },
  { value: "tech", label: "Tech / Startup" },
  { value: "creative", label: "Creative / Portfolio" },
  { value: "home_services", label: "Home Services" },
];

export default function BuilderPage() {
  const [config, setConfig] = useState<BusinessConfig>({
    businessName: "",
    tagline: "",
    category: "",
    phone: "",
    email: "",
    address: "",
    hours: "",
    description: "",
    services: [...defaultServices],
    features: [...defaultFeatures],
  });
  const [sites, setSites] = useState<Site[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [generatedId, setGeneratedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [tab, setTab] = useState<"config" | "preview" | "sites">("config");

  useEffect(() => {
    loadSites();
  }, []);

  async function loadSites() {
    try {
      const res = await fetch("/api/builder/sites");
      if (res.ok) {
        const data = await res.json();
        setSites(data);
      }
    } catch { /* ignore */ }
  }

  function updateField(field: keyof BusinessConfig, value: string) {
    setConfig((prev) => ({ ...prev, [field]: value }));
  }

  function updateService(index: number, field: "title" | "description", value: string) {
    const services = [...config.services];
    services[index] = { ...services[index], [field]: value };
    setConfig((prev) => ({ ...prev, services }));
  }

  async function handleGenerate() {
    if (!config.businessName.trim()) {
      toast.error("Business name is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok) {
        setPreviewHtml(data.html);
        setGeneratedId(data.id);
        setTab("preview");
        toast.success("Site generated!");
        loadSites();
      } else {
        toast.error(data.error || "Generation failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeploy() {
    if (!generatedId) {
      toast.error("Generate a site first");
      return;
    }
    setDeploying(true);
    try {
      const res = await fetch("/api/builder/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: generatedId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Deployed to ${data.url}`);
        loadSites();
      } else {
        toast.error(data.error || "Deploy failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeploying(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this site?")) return;
    try {
      const res = await fetch(`/api/builder/sites?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Site deleted");
        loadSites();
      }
    } catch {
      toast.error("Delete failed");
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏗️</span>
              <h1 className="text-xl font-bold text-slate-900">NetClicks Builder</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">{sites.length} sites built</span>
              <a href="/" className="text-sm text-blue-600 hover:text-blue-700">Dashboard</a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8">
          {(["config", "preview", "sites"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t === "config" ? "⚙️ Configure" : t === "preview" ? "👁️ Preview" : "📋 Sites"}
            </button>
          ))}
        </div>

        {tab === "config" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Business Info</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Business Name *</label>
                    <input
                      type="text"
                      value={config.businessName}
                      onChange={(e) => updateField("businessName", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Legacy Memorial Restorations"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                    <select
                      value={config.category}
                      onChange={(e) => updateField("category", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Auto-detect</option>
                      {industries.map((ind) => (
                        <option key={ind.value} value={ind.value}>{ind.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tagline</label>
                    <input
                      type="text"
                      value={config.tagline}
                      onChange={(e) => updateField("tagline", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Professional Restoration Services You Can Trust"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                      value={config.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Brief description of the business..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Info</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={config.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={config.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="info@example.com"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={config.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123 Main Street, City, ST 12345"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Business Hours</label>
                    <input
                      type="text"
                      value={config.hours}
                      onChange={(e) => updateField("hours", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mon-Fri: 9AM-5PM"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Services</h2>
                <p className="text-sm text-slate-500 mb-4">Leave empty to use auto-generated services based on industry.</p>
                {config.services.map((svc, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 pb-3 border-b border-slate-100 last:border-0">
                    <input
                      type="text"
                      value={svc.title}
                      onChange={(e) => updateService(i, "title", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Service ${i + 1} name`}
                    />
                    <input
                      type="text"
                      value={svc.description}
                      onChange={(e) => updateService(i, "description", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Service description"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                <h3 className="font-semibold text-blue-900 mb-2">🚀 Quick Actions</h3>
                <p className="text-sm text-blue-700 mb-4">Fill in the business info and click Generate to create your site.</p>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Generating..." : "⚡ Generate Site"}
                </button>
                {generatedId && (
                  <button
                    onClick={handleDeploy}
                    disabled={deploying}
                    className="w-full mt-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {deploying ? "Deploying..." : "🚀 Deploy to Vercel"}
                  </button>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-2">📊 Stats</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>Total sites: <strong>{sites.length}</strong></p>
                  <p>Deployed: <strong>{sites.filter(s => s.status === "deployed").length}</strong></p>
                  <p>Drafts: <strong>{sites.filter(s => s.status === "draft").length}</strong></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "preview" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Site Preview</h2>
              <div className="flex gap-2">
                {generatedId && (
                  <button
                    onClick={handleDeploy}
                    disabled={deploying}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {deploying ? "Deploying..." : "🚀 Deploy to Vercel"}
                  </button>
                )}
                <button
                  onClick={() => setTab("config")}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Back to Config
                </button>
              </div>
            </div>
            {previewHtml ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[80vh] bg-white"
                  title="Site Preview"
                  sandbox="allow-scripts"
                />
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400">
                No preview yet. Configure and generate a site first.
              </div>
            )}
          </div>
        )}

        {tab === "sites" && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Built Sites</h2>
            {sites.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                No sites built yet. Start by configuring a new site.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sites.map((site) => (
                  <div key={site.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-900">{site.business_name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        site.status === "deployed" ? "bg-green-100 text-green-700" :
                        site.status === "draft" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {site.status}
                      </span>
                    </div>
                    {site.tagline && (
                      <p className="text-sm text-slate-500 mb-2">{site.tagline}</p>
                    )}
                    {site.business_category && (
                      <p className="text-xs text-slate-400 mb-3">{site.business_category}</p>
                    )}
                    <div className="flex flex-col gap-1 text-xs text-slate-400 mb-4">
                      <span>Created: {new Date(site.created_at).toLocaleDateString()}</span>
                      {site.deployed_at && (
                        <span>Deployed: {new Date(site.deployed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {site.vercel_url && (
                        <a
                          href={site.vercel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Open Site
                        </a>
                      )}
                      {site.status === "draft" && (
                        <button
                          onClick={async () => {
                            setPreviewHtml(null);
                            setGeneratedId(site.id);
                            const res = await fetch("/api/builder/sites");
                            if (res.ok) {
                              const all: Site[] = await res.json();
                              const s = all.find((x: Site) => x.id === site.id);
                              if (s) {
                                setConfig(prev => ({ ...prev, businessName: s.business_name, tagline: s.tagline || '', category: s.business_category || '' }));
                              }
                            }
                            setTab("config");
                          }}
                          className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(site.id)}
                        className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors ml-auto"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
