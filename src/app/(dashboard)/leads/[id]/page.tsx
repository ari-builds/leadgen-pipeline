"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Lead {
  id: number;
  company_name: string;
  website_url: string;
  industry: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_linkedin: string;
  contact_title: string;
  tech_stack: string;
  company_size: string;
  revenue_range: string;
  location: string;
  what_they_sell: string;
  pain_points: string;
  competitors: string;
  recent_news: string;
  score: number;
  status: string;
  notes: string;
  source_url: string;
  client_names: string;
  client_ids: string;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/leads/${params.id}`);
        if (res.ok) setLead(await res.json());
      } catch {
        toast.error("Failed to load lead");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function handleSave() {
    if (!lead) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: lead.score,
          status: lead.status,
          notes: lead.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Lead updated");
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!lead || !confirm("Delete this lead?")) return;
    try {
      await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      toast.success("Lead deleted");
      router.push("/leads");
    } catch {
      toast.error("Failed to delete lead");
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!lead) {
    return <div className="text-center py-12">Lead not found</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/leads" className="text-sm text-muted-foreground hover:underline">
            ← Back to Leads
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            {lead.company_name || "Unnamed Company"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {lead.contact_name && `${lead.contact_name}`}
            {lead.contact_title && ` · ${lead.contact_title}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Website</Label>
                <p className="text-sm">
                  {lead.website_url ? (
                    <a href={lead.website_url} target="_blank" className="text-blue-600 hover:underline">
                      {lead.website_url}
                    </a>
                  ) : "—"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Industry</Label>
                <p className="text-sm">{lead.industry || "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Location</Label>
                <p className="text-sm">{lead.location || "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Company Size</Label>
                <p className="text-sm">{lead.company_size || "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Revenue Range</Label>
                <p className="text-sm">{lead.revenue_range || "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tech Stack</Label>
                <p className="text-sm">{lead.tech_stack || "—"}</p>
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">What They Sell</Label>
              <p className="text-sm">{lead.what_they_sell || "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Pain Points</Label>
              <p className="text-sm">{lead.pain_points || "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Competitors</Label>
              <p className="text-sm">{lead.competitors || "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Recent News</Label>
              <p className="text-sm">{lead.recent_news || "—"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Email:</span> {lead.contact_email || "—"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {lead.contact_phone || "—"}</div>
              <div><span className="text-muted-foreground">LinkedIn:</span>{" "}
                {lead.contact_linkedin ? (
                  <a href={lead.contact_linkedin} target="_blank" className="text-blue-600 hover:underline">
                    Profile
                  </a>
                ) : "—"}
              </div>
            </CardContent>
          </Card>

          {/* Scoring */}
          <Card>
            <CardHeader>
              <CardTitle>Scoring & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Score (1-10)</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={lead.score}
                  onChange={(e) => setLead({ ...lead, score: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={lead.status}
                  onValueChange={(v) => setLead({ ...lead, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigned Clients</Label>
                <p className="text-sm text-muted-foreground">
                  {lead.client_names || "Unassigned"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={lead.notes || ""}
                onChange={(e) => setLead({ ...lead, notes: e.target.value })}
                placeholder="Add notes about this lead..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
