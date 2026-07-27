import { NextResponse } from "next/server";
import db from "@/lib/db";

function parseAudit(notes: string | null) {
  if (!notes) return null;
  const issues: Record<string, { status: string; detail: string }> = {};
  
  // Parse CRITICAL ISSUES
  const criticalMatch = notes.match(/CRITICAL ISSUES:\n([\s\S]*?)(?=\nWARNINGS:)/);
  if (criticalMatch) {
    const lines = criticalMatch[1].split("\n").filter(l => l.trim());
    for (const line of lines) {
      const clean = line.replace(/^\s*❌\s*/, "").trim();
      if (!clean) continue;
      const key = clean.split("—")[0].split(":")[0].trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
      issues[key] = { status: "fail", detail: clean };
    }
  }
  
  // Parse WARNINGS
  const warnMatch = notes.match(/WARNINGS:\n([\s\S]*?)(?=\nPASSES:)/);
  if (warnMatch) {
    const lines = warnMatch[1].split("\n").filter(l => l.trim());
    for (const line of lines) {
      const clean = line.replace(/^\s*⚠️\s*/, "").trim();
      if (!clean) continue;
      const key = clean.split("—")[0].split(":")[0].trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
      issues[key] = { status: "warn", detail: clean };
    }
  }
  
  // Parse PASSES
  const passMatch = notes.match(/PASSES:\n([\s\S]*?)(?=\nData Completeness:)/);
  if (passMatch) {
    const lines = passMatch[1].split("\n").filter(l => l.trim());
    for (const line of lines) {
      const clean = line.replace(/^\s*✅\s*/, "").trim();
      if (!clean) continue;
      const key = clean.split("—")[0].split(":")[0].trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
      if (!issues[key]) issues[key] = { status: "pass", detail: clean };
    }
  }
  
  // Parse platform
  const platformMatch = notes.match(/Platform:\s*(.+)/);
  const platform = platformMatch ? platformMatch[1].split("—")[0].trim() : "Unknown";
  
  // Parse health score
  const healthMatch = notes.match(/\((\d+)\/100 health score\)/);
  const healthScore = healthMatch ? parseInt(healthMatch[1]) : null;
  
  // Parse pass/warn/fail counts
  const countsMatch = notes.match(/(\d+) pass, (\d+) warnings, (\d+) critical/);
  const passCount = countsMatch ? parseInt(countsMatch[1]) : 0;
  const warnCount = countsMatch ? parseInt(countsMatch[2]) : 0;
  const failCount = countsMatch ? parseInt(countsMatch[3]) : 0;
  
  // Parse opportunity
  const oppMatch = notes.match(/Opportunity:\s*(.+?)(?:\n|$)/);
  const opportunity = oppMatch ? oppMatch[1].trim() : "";
  
  // Parse recommended services
  const recMatch = notes.match(/Recommended Services:\s*(.+?)(?:\n|$)/);
  const recommendations = recMatch ? recMatch[1].split(",").map(s => s.trim()) : [];
  
  return { issues, platform, healthScore, passCount, warnCount, failCount, opportunity, recommendations };
}

export async function GET(
  _request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const clientId = parseInt(params.clientId);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }
    
    // Get client info
    const clientResult = await db.execute({
      sql: "SELECT id, name, description, slug FROM clients WHERE id = ?",
      args: [clientId],
    });
    
    if (clientResult.rows.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    
    const client = clientResult.rows[0];
    
    // Get all leads for this client
    const leadsResult = await db.execute({
      sql: `SELECT l.id, l.company_name, l.website_url, l.industry, l.contact_name,
                   l.contact_email, l.contact_phone, l.contact_facebook, l.contact_instagram,
                   l.contact_linkedin, l.contact_twitter, l.location, l.notes, l.score, l.status
            FROM leads l
            JOIN client_leads cl ON l.id = cl.lead_id
            WHERE cl.client_id = ?
            ORDER BY l.score DESC, l.company_name ASC`,
      args: [clientId],
    });
    
    const leads = leadsResult.rows;
    
    // Process each lead
    const processedLeads = leads.map(lead => {
      const audit = parseAudit(lead.notes as string || "");
      const hasWebsite = !!lead.website_url;
      const hasEmail = !!(lead.contact_email && String(lead.contact_email).length > 3);
      const hasPhone = !!(lead.contact_phone && String(lead.contact_phone).replace(/\D/g, "").length >= 7);
      const hasSocial = !!(lead.contact_facebook || lead.contact_instagram || lead.contact_linkedin || lead.contact_twitter);
      
      let completeness = 20;
      if (hasEmail) completeness += 30;
      if (hasPhone) completeness += 20;
      if (hasSocial) completeness += 15;
      if (lead.location) completeness += 15;
      
      let quality = "Weak";
      if (hasEmail && hasPhone && hasWebsite) quality = "Strong";
      else if (hasEmail || hasPhone) quality = "Good";
      
      return {
        id: Number(lead.id),
        companyName: String(lead.company_name || ""),
        websiteUrl: String(lead.website_url || ""),
        industry: String(lead.industry || ""),
        contactName: String(lead.contact_name || ""),
        contactEmail: String(lead.contact_email || ""),
        contactPhone: String(lead.contact_phone || ""),
        contactFacebook: String(lead.contact_facebook || ""),
        contactInstagram: String(lead.contact_instagram || ""),
        contactLinkedin: String(lead.contact_linkedin || ""),
        contactTwitter: String(lead.contact_twitter || ""),
        location: String(lead.location || ""),
        score: Number(lead.score || 0),
        status: String(lead.status || ""),
        hasWebsite,
        hasEmail,
        hasPhone,
        hasSocial,
        dataCompleteness: Math.min(completeness, 100),
        quality,
        audit: audit ? {
          issues: audit.issues,
          platform: audit.platform,
          healthScore: audit.healthScore,
          passCount: audit.passCount,
          warnCount: audit.warnCount,
          failCount: audit.failCount,
          opportunity: audit.opportunity,
          recommendations: audit.recommendations,
        } : null,
      };
    });
    
    // Compute aggregates
    const totalLeads = processedLeads.length;
    const strongCount = processedLeads.filter(l => l.quality === "Strong").length;
    const goodCount = processedLeads.filter(l => l.quality === "Good").length;
    const weakCount = processedLeads.filter(l => l.quality === "Weak").length;
    const withWebsite = processedLeads.filter(l => l.hasWebsite).length;
    const withoutWebsite = processedLeads.filter(l => !l.hasWebsite).length;
    const withEmail = processedLeads.filter(l => l.hasEmail).length;
    const withPhone = processedLeads.filter(l => l.hasPhone).length;
    const withSocial = processedLeads.filter(l => l.hasSocial).length;
    
    const auditedLeads = processedLeads.filter(l => l.audit);
    const avgHealthScore = auditedLeads.length > 0
      ? Math.round(auditedLeads.reduce((a, l) => a + (l.audit!.healthScore || 0), 0) / auditedLeads.length)
      : 0;
    const avgIssues = auditedLeads.length > 0
      ? Math.round(auditedLeads.reduce((a, l) => a + (l.audit!.failCount || 0) + (l.audit!.warnCount || 0), 0) / auditedLeads.length)
      : 0;
    
    // Industry breakdown
    const industryCounts: Record<string, number> = {};
    processedLeads.forEach(l => {
      const ind = l.industry || "Other";
      industryCounts[ind] = (industryCounts[ind] || 0) + 1;
    });
    const industryBreakdown = Object.entries(industryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    // Issue frequency (what issues appear most across all sites)
    const issueFrequency: Record<string, number> = {};
    auditedLeads.forEach(l => {
      if (!l.audit) return;
      for (const [, val] of Object.entries(l.audit.issues)) {
        const issue = val as { status: string; detail: string };
        const shortName = issue.detail.split("—")[0].split(":")[0].trim();
        if (issue.status === "fail") {
          issueFrequency[shortName] = (issueFrequency[shortName] || 0) + 1;
        }
      }
    });
    const topIssues = Object.entries(issueFrequency)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Platform distribution
    const platformCounts: Record<string, number> = {};
    auditedLeads.forEach(l => {
      if (!l.audit) return;
      const p = l.audit.platform || "Unknown";
      platformCounts[p] = (platformCounts[p] || 0) + 1;
    });
    const platformDistribution = Object.entries(platformCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    // City breakdown
    const cityCounts: Record<string, number> = {};
    processedLeads.forEach(l => {
      if (l.location && l.location !== "United States and Canada") {
        const city = l.location.split(",")[0].trim();
        cityCounts[city] = (cityCounts[city] || 0) + 1;
      }
    });
    const cityBreakdown = Object.entries(cityCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    return NextResponse.json({
      client: {
        id: Number(client.id),
        name: String(client.name || ""),
        description: String(client.description || ""),
        slug: String(client.slug || ""),
      },
      summary: {
        totalLeads,
        strongCount,
        goodCount,
        weakCount,
        withWebsite,
        withoutWebsite,
        withEmail,
        withPhone,
        withSocial,
        avgHealthScore,
        avgIssues,
      },
      breakdowns: {
        industry: industryBreakdown,
        topIssues,
        platforms: platformDistribution,
        cities: cityBreakdown,
      },
      leads: processedLeads,
    });
  } catch (error) {
    console.error("Report API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
