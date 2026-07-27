"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/scrape", label: "Lead Scraper", icon: "🔍" },
  { href: "/clients", label: "Clients", icon: "👥" },
  { href: "/leads", label: "Leads", icon: "🎯" },
  { href: "/outreach", label: "Outreach", icon: "✉️" },
  { href: "/admin/passwords", label: "Credentials", icon: "🔐", adminOnly: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 transform transition-transform duration-200 md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">LeadGen Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-Powered Leads</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex items-center gap-3 bg-white border-b border-gray-200 px-4 py-3 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Open menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">LeadGen Pipeline</h1>
        </div>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
