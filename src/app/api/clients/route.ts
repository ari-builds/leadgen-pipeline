import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { slugify, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();

    const result = await db.execute({
      sql: `SELECT c.*, 
            COUNT(cl.lead_id) as lead_count
            FROM clients c
            LEFT JOIN client_leads cl ON c.id = cl.client_id
            GROUP BY c.id
            ORDER BY c.created_at DESC`,
      args: [],
    });

    return NextResponse.json(result.rows);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const { name, description, idealCustomerProfile, dashboardPassword } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const slug = slugify(name);

    // Check slug uniqueness
    const existing = await db.execute({
      sql: "SELECT id FROM clients WHERE slug = ?",
      args: [slug],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Client with similar name already exists" }, { status: 409 });
    }

    const passwordHash = dashboardPassword
      ? await hashPassword(dashboardPassword)
      : null;

    await db.execute({
      sql: `INSERT INTO clients (name, slug, description, ideal_customer_profile, dashboard_password_hash) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        name,
        slug,
        description || null,
        idealCustomerProfile ? JSON.stringify(idealCustomerProfile) : null,
        passwordHash,
      ],
    });

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error("POST /api/clients error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
