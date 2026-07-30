import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { renderSite, type BusinessConfig } from "@/lib/builder/renderer";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const config: BusinessConfig = await req.json();
    if (!config.businessName) {
      return NextResponse.json({ error: "businessName is required" }, { status: 400 });
    }

    const html = renderSite(config);

    const result = await db.execute({
      sql: `INSERT INTO built_sites (business_name, business_category, business_phone, business_email, business_address, business_hours, tagline, description, industry, status, preview_html)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
      args: [
        config.businessName,
        config.category || null,
        config.phone || null,
        config.email || null,
        config.address || null,
        config.hours || null,
        config.tagline || null,
        config.description || null,
        detectIndustry(config.category || config.tagline || ''),
        html,
      ],
    });

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      html,
      preview: html.substring(0, 500) + '...',
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function detectIndustry(category: string): string {
  const cat = category.toLowerCase();
  if (/restaurant|cafe|bakery|food|dining|pizza|bar|grill|kitchen|catering/i.test(cat)) return 'restaurant';
  if (/health|wellness|fitness|yoga|spa|medical|dental|doctor|therapy|massage|nutrition/i.test(cat)) return 'health';
  if (/tech|software|saas|it |computer|developer|digital|app|startup|web/i.test(cat)) return 'tech';
  if (/creative|design|photo|video|studio|artist|agency|marketing|brand/i.test(cat)) return 'creative';
  if (/plumber|electrician|hvac|contractor|roofing|landscap|cleaning|handyman|pest|home|repair|construction|painter|remodel/i.test(cat)) return 'home_services';
  return 'professional';
}
