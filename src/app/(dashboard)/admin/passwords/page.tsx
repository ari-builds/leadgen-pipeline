"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface ClientCred {
  id: number;
  name: string;
  slug: string;
  contact_email: string;
  dashboard_password: string;
  lead_count: number;
}

export default function AdminPasswordsPage() {
  const [clients, setClients] = useState<ClientCred[]>([]);
  const [loading, setLoading] = useState(true);
  const [visiblePwds, setVisiblePwds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch("/api/admin/client-credentials")
      .then((r) => r.json())
      .then(setClients)
      .catch(() => toast.error("Failed to load credentials"))
      .finally(() => setLoading(false));
  }, []);

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}`);
  }

  function toggleVisible(id: number) {
    setVisiblePwds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Client Credentials</h1>
        <p className="text-muted-foreground mt-1">
          Dashboard logins for all clients — emails, passwords, and URLs
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No clients found</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Slug / URL</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {c.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                          {c.slug}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs md:h-10 md:px-3 md:text-sm"
                          onClick={() =>
                            copyToClipboard(
                              `https://leadgen-pipeline-mauve.vercel.app/client/${c.slug}`,
                              "URL"
                            )
                          }
                        >
                          📋
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{c.contact_email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs md:h-10 md:px-3 md:text-sm"
                          onClick={() => copyToClipboard(c.contact_email, "email")}
                        >
                          📋
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">
                          {visiblePwds[c.id] ? c.dashboard_password : "••••••••"}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs md:h-10 md:px-3 md:text-sm"
                          onClick={() => toggleVisible(c.id)}
                        >
                          {visiblePwds[c.id] ? "🙈" : "👁️"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs md:h-10 md:px-3 md:text-sm"
                          onClick={() => copyToClipboard(c.dashboard_password, "password")}
                        >
                          📋
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.lead_count}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 md:h-10 text-xs"
                        onClick={() =>
                          window.open(
                            `/client/${c.slug}`,
                            "_blank"
                          )
                        }
                      >
                        Open Dashboard →
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
