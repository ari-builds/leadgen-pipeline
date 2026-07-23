"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
}

export default function ScrapePage() {
  const [query, setQuery] = useState("");
  const [url, setUrl] = useState("");
  const [clientId, setClientId] = useState("none");
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [results, setResults] = useState<ScrapedLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"search" | "url">("search");

  // Load clients for assignment
  useState(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => {});
  });

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_search",
          query: query.trim(),
          clientId: clientId !== "none" ? clientId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.leads || []);
      toast.success(`Found ${data.total_found} leads`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleScrapeUrl() {
    if (!url.trim()) return;
    setLoading(true);
    setResults([]);
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
      setResults([data]);
      toast.success(`Scraped and saved: ${data.company_name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scrape failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lead Scraper</h1>
        <p className="text-muted-foreground mt-1">
          Search the web or scrape individual websites for leads
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Scrape</CardTitle>
          <CardDescription>
            Enter a search query (e.g., &quot;dental practices Austin TX&quot;) or a specific website URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === "search" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("search")}
            >
              Search
            </Button>
            <Button
              variant={mode === "url" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("url")}
            >
              Single URL
            </Button>
          </div>

          {mode === "search" ? (
            <div className="flex gap-2">
              <Input
                placeholder="e.g., HVAC companies in Dallas TX"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? "Searching..." : "Search & Scrape"}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScrapeUrl()}
                className="flex-1"
              />
              <Button onClick={handleScrapeUrl} disabled={loading}>
                {loading ? "Scraping..." : "Scrape & Save"}
              </Button>
            </div>
          )}

          {clients.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Assign to client:</span>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="No client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results ({results.length})</CardTitle>
            <CardDescription>Leads found and saved to database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((lead, i) => (
                <div
                  key={lead.lead_id || i}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{lead.company_name || "Unknown"}</h3>
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {lead.website}
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {lead.industry_hint && (
                        <Badge variant="secondary">{lead.industry_hint}</Badge>
                      )}
                      <Badge>Score: 5/10</Badge>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {lead.emails?.length > 0 && <span>Email: {lead.emails[0]}</span>}
                    {lead.phones?.length > 0 && <span>Phone: {lead.phones[0]}</span>}
                  </div>
                  {lead.social && Object.keys(lead.social).length > 0 && (
                    <div className="flex gap-2">
                      {Object.entries(lead.social).map(([platform, link]) => (
                        <a
                          key={platform}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                        >
                          {platform}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
