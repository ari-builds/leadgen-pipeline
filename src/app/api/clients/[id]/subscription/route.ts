import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const clientId = parseInt(id);

    const result = await db.execute({
      sql: "SELECT * FROM client_subscriptions WHERE client_id = ?",
      args: [clientId],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({
        monthly_lead_quota: 100,
        reset_day: 1,
        current_period_start: null,
        last_export_at: null,
        exported_this_period: false,
      });
    }

    const sub = result.rows[0];
    const currentPeriodStart = sub.current_period_start as string;
    const resetDay = sub.reset_day as number;

    const deliveries = await db.execute({
      sql: "SELECT * FROM lead_deliveries WHERE client_id = ? AND period_start = ?",
      args: [clientId, currentPeriodStart],
    });

    const exported = deliveries.rows.length > 0 && deliveries.rows[0].exported === 1;

    return NextResponse.json({
      monthly_lead_quota: sub.monthly_lead_quota,
      reset_day: resetDay,
      current_period_start: currentPeriodStart,
      last_export_at: sub.last_export_at,
      exported_this_period: exported,
      export_formats: exported ? deliveries.rows[0].export_formats : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const clientId = parseInt(id);
    const data = await req.json();
    const { monthly_lead_quota, reset_day } = data;

    const existing = await db.execute({
      sql: "SELECT id FROM client_subscriptions WHERE client_id = ?",
      args: [clientId],
    });

    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO client_subscriptions (client_id, monthly_lead_quota, reset_day, current_period_start)
              VALUES (?, ?, ?, date('now'))`,
        args: [clientId, monthly_lead_quota || 100, reset_day || 1],
      });
    } else {
      const updates: string[] = [];
      const args: (string | number)[] = [];
      if (monthly_lead_quota !== undefined) {
        updates.push("monthly_lead_quota = ?");
        args.push(monthly_lead_quota);
      }
      if (reset_day !== undefined) {
        updates.push("reset_day = ?");
        args.push(reset_day);
      }
      if (updates.length > 0) {
        args.push(clientId);
        await db.execute({
          sql: `UPDATE client_subscriptions SET ${updates.join(", ")} WHERE client_id = ?`,
          args,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
