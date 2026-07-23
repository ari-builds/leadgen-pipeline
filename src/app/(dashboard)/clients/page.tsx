"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Client {
  id: number;
  name: string;
  slug: string;
  description: string;
  lead_count: number;
  created_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    idealCustomerProfile: "",
    dashboardPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [quotaClient, setQuotaClient] = useState<Client | null>(null);
  const [quotaForm, setQuotaForm] = useState({ monthly_lead_quota: 100, reset_day: 1 });
  const [quotaConfirm, setQuotaConfirm] = useState(false);
  const [savingQuota, setSavingQuota] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const res = await fetch("/api/clients");
      setClients(await res.json());
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Client "${form.name}" created`);
      setDialogOpen(false);
      setForm({ name: "", description: "", idealCustomerProfile: "", dashboardPassword: "" });
      fetchClients();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setSaving(false);
    }
  }

  async function openQuotaDialog(client: Client) {
    setQuotaClient(client);
    setQuotaConfirm(false);
    try {
      const res = await fetch(`/api/clients/${client.id}/subscription`);
      if (res.ok) {
        const sub = await res.json();
        setQuotaForm({ monthly_lead_quota: sub.monthly_lead_quota, reset_day: sub.reset_day });
      }
    } catch {}
    setQuotaDialogOpen(true);
  }

  async function saveQuota() {
    if (!quotaClient) return;
    setSavingQuota(true);
    try {
      const res = await fetch(`/api/clients/${quotaClient.id}/subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotaForm),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Quota updated");
      setQuotaDialogOpen(false);
      setQuotaConfirm(false);
    } catch {
      toast.error("Failed to update quota");
    } finally {
      setSavingQuota(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your client accounts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>+ Add Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Client</DialogTitle>
              <DialogDescription>
                Add a new client to your pipeline
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icp">Ideal Customer Profile</Label>
                <Textarea
                  id="icp"
                  value={form.idealCustomerProfile}
                  onChange={(e) =>
                    setForm({ ...form, idealCustomerProfile: e.target.value })
                  }
                  placeholder="e.g. Families with deceased loved ones in local cemeteries who need headstone cleaning. Age 45-65, 78% female. Local and out-of-town relatives. Veterans' families."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Describe who this client serves. Used for lead scoring and outreach personalization.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Dashboard Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.dashboardPassword}
                  onChange={(e) =>
                    setForm({ ...form, dashboardPassword: e.target.value })
                  }
                  placeholder="For client dashboard access"
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Creating..." : "Create Client"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No clients yet. Add your first client to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <Badge variant="secondary">{client.lead_count} leads</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {client.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(client.created_at).toLocaleDateString()}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openQuotaDialog(client);
                      }}
                    >
                      Manage Quota
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={quotaDialogOpen} onOpenChange={setQuotaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Quota — {quotaClient?.name}</DialogTitle>
            <DialogDescription>
              Set monthly lead quota and reset day for this client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Monthly Lead Quota</Label>
              <Input
                type="number"
                min={1}
                max={10000}
                value={quotaForm.monthly_lead_quota}
                onChange={(e) =>
                  setQuotaForm({ ...quotaForm, monthly_lead_quota: parseInt(e.target.value) || 100 })
                }
              />
              <p className="text-xs text-muted-foreground">Max leads delivered per month</p>
            </div>
            <div className="space-y-2">
              <Label>Reset Day (1-28)</Label>
              <Input
                type="number"
                min={1}
                max={28}
                value={quotaForm.reset_day}
                onChange={(e) =>
                  setQuotaForm({ ...quotaForm, reset_day: parseInt(e.target.value) || 1 })
                }
              />
              <p className="text-xs text-muted-foreground">Day of month when quota resets</p>
            </div>
            {!quotaConfirm ? (
              <Button className="w-full" onClick={() => setQuotaConfirm(true)}>
                Save Changes
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-amber-600 font-medium text-center">
                  Are you sure? This will change {quotaClient?.name}&apos;s monthly quota to {quotaForm.monthly_lead_quota} leads, resetting on the {quotaForm.reset_day}th.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setQuotaConfirm(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={saveQuota} disabled={savingQuota}>
                    {savingQuota ? "Saving..." : "Yes, Save"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
