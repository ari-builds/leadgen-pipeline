import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    await requireAdmin();

    const result = await db.execute({
      sql: `SELECT cc.*, c.name as client_name
            FROM client_credentials cc
            JOIN clients c ON cc.client_id = c.id
            ORDER BY cc.created_at DESC`,
      args: [],
    });

    return NextResponse.json(result.rows);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { clientId, siteUrl, password, label } = await req.json();

    if (!clientId || !siteUrl || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // In production, encrypt the password before storing
    const passwordEncrypted = Buffer.from(password).toString("base64");

    await db.execute({
      sql: `INSERT INTO client_credentials (client_id, site_url, password_encrypted, label) 
            VALUES (?, ?, ?, ?)`,
      args: [clientId, siteUrl, passwordEncrypted, label || null],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
