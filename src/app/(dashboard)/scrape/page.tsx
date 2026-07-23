"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ScrapedLead {
  lead_id: number;
  company_name: string;
  emails: string[];
  phones: string[];
  website: string;
  industry_hint: string;
  social: Record<string, string>;
  source_query: string;
  description?: string;
  location?: string;
}

interface BulkResult {
  icp: string;
  location: string;
  queries_used: string[];
  total_urls_found: number;
  total_scraped: number;
  total_saved: number;
  leads: ScrapedLead[];
}

export default function ScrapePage() {
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [clientId, setClientId] = useState("none");

  // ICP-driven bulk scrape
  const [icp, setIcp] = useState("");
  const [location, setLocation] = useState("");
  const [leadCount, setLeadCount] = useState("50");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState("");
  const [bulkResults, setBulkResults] = useState<BulkResult | null>(null);

  // Single URL scrape
  const [url, setUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<ScrapedLead | null>(null);

  // Mode toggle
  const [mode, setMode] = useState<"bulk" | "url">("bulk");

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function handleBulkScrape() {
    if (!icp.trim()) {
      toast.error("Enter your ideal customer profile");
      return;
    }
    setBulkLoading(true);
    setBulkProgress("Starting bulk scrape...");
    setBulkResults(null);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk",
          icp: icp.trim(),
          location: location.trim(),
          count: Number(leadCount) || 50,
          clientId: clientId !== "none" ? clientId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk scrape failed");

      setBulkResults(data);
      setBulkProgress("");
      toast.success(`Found ${data.total_saved} leads!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk scrape failed");
      setBulkProgress("");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleScrapeUrl() {
    if (!url.trim()) return;
    setUrlLoading(true);
    setSingleResult(null);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scrape_and_save",
          url: url.trim(),
          clientId: clientId !== "none" ? clientId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scrape failed");
      setSingleResult(data);
      toast.success(`Scraped: ${data.company_name || "Unknown"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scrape failed");
    } finally {
      setUrlLoading(false);
    }
  }

  const totalSaved = bulkResults?.total_saved || 0;
  const totalScraped = bulkResults?.total_scraped || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lead Scraper</h1>
        <p className="text-muted-foreground mt-1">
          Find bulk leads from any industry, anywhere. Enter your ICP and hit scrape.
        </p>
      </div>

      {/* Client Assignment */}
      {clients.length > 0 && (
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium">Assign to client:</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="No client (general leads)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No client (general)</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button variant={mode === "bulk" ? "default" : "outline"} onClick={() => setMode("bulk")}>
          Bulk Scrape (ICP)
        </Button>
        <Button variant={mode === "url" ? "default" : "outline"} onClick={() => setMode("url")}>
          Single URL
        </Button>
      </div>

      {/* Bulk Scrape Mode */}
      {mode === "bulk" && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Lead Scrape</CardTitle>
            <CardDescription>
              Describe your ideal customer and we&apos;ll find them across the web.
              Searches directories, Google, industry sites, and more.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ideal Customer Profile (ICP)</Label>
              <Textarea
                placeholder='e.g., "dental practices", "HVAC companies", "plumbing contractors", "law firms specializing in personal injury"...'
                value={icp}
                onChange={(e) => setIcp(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location (optional)</Label>
                <Input
                  placeholder="e.g., Austin TX, Dallas-Fort Worth, California"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Lead Count</Label>
                <Select value={leadCount} onValueChange={setLeadCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 leads (quick test)</SelectItem>
                    <SelectItem value="25">25 leads</SelectItem>
                    <SelectItem value="50">50 leads</SelectItem>
                    <SelectItem value="100">100 leads</SelectItem>
                    <SelectItem value="150">150 leads</SelectItem>
                    <SelectItem value="200">200 leads (max)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleBulkScrape}
              disabled={bulkLoading || !icp.trim()}
              className="w-full"
              size="lg"
            >
              {bulkLoading ? "Scraping... (this may take a few minutes)" : `Find ${leadCount} Leads`}
            </Button>

            {bulkProgress && (
              <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                {bulkProgress}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Single URL Mode */}
      {mode === "url" && (
        <Card>
          <CardHeader>
            <CardTitle>Scrape Single Website</CardTitle>
            <CardDescription>Enter a website URL to extract company info</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScrapeUrl()}
                className="flex-1"
              />
              <Button onClick={handleScrapeUrl} disabled={urlLoading}>
                {urlLoading ? "Scraping..." : "Scrape & Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single URL Result */}
      {singleResult && (
        <LeadCard lead={singleResult} />
      )}

      {/* Bulk Results */}
      {bulkResults && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalSaved}</div>
                  <div className="text-sm text-muted-foreground">Leads Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalScraped}</div>
                  <div className="text-sm text-muted-foreground">Websites Scraped</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{bulkResults.total_urls_found}</div>
                  <div className="text-sm text-muted-foreground">URLs Found</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{bulkResults.queries_used.length}</div>
                  <div className="text-sm text-muted-foreground">Queries Used</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scraped Leads ({bulkResults.leads.length})</CardTitle>
              <CardDescription>
                Saved to database. Assign and manage from the Leads page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {bulkResults.leads.map((lead, i) => (
                  <LeadCard key={lead.lead_id || i} lead={lead} compact />
                ))}
                {bulkResults.leads.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No leads found. Try a different ICP or location.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function LeadCard({ lead, compact = false }: { lead: ScrapedLead; compact?: boolean }) {
  return (
    <div className={`border rounded-lg ${compact ? "p-3" : "p-4"} space-y-2`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">{lead.company_name || "Unknown Company"}</h3>
          {lead.website && (
            <a
              href={lead.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-all"
            >
              {lead.website}
            </a>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0 ml-4">
          {lead.industry_hint && <Badge variant="secondary">{lead.industry_hint}</Badge>}
          <Badge>5/10</Badge>
        </div>
      </div>

      {!compact && lead.description && (
        <p className="text-sm text-muted-foreground">{lead.description}</p>
      )}

      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        {lead.emails?.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="text-green-600">Email:</span> {lead.emails[0]}
          </span>
        )}
        {lead.phones?.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="text-blue-600">Phone:</span> {lead.phones[0]}
          </span>
        )}
      </div>

      {lead.social && Object.keys(lead.social).length > 0 && (
        <div className="flex gap-2">
          {Object.entries(lead.social).map(([platform, link]) => (
            <a
              key={platform}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 capitalize"
            >
              {platform}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
