"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const adminTools = [
  {
    href: "/admin/passwords",
    title: "Credentials",
    description: "View and manage all client dashboard credentials",
    icon: "🔐",
  },
  {
    href: "/clients",
    title: "Manage Clients",
    description: "Add, edit, and manage client accounts",
    icon: "👥",
  },
  {
    href: "/leads",
    title: "All Leads",
    description: "View and manage the full lead database",
    icon: "🎯",
  },
  {
    href: "/scrape",
    title: "Lead Scraper",
    description: "Run bulk ICP-driven lead scraping",
    icon: "🔍",
  },
  {
    href: "/outreach",
    title: "Outreach",
    description: "Manage email campaigns and DM scripts",
    icon: "✉️",
  },
  {
    href: "/analytics",
    title: "Analytics",
    description: "View pipeline performance and KPIs",
    icon: "📈",
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage your lead generation pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminTools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="text-3xl mb-2">{tool.icon}</div>
                <CardTitle className="text-lg">{tool.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{tool.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
