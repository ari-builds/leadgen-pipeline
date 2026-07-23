import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyPassword, generateOTP, generateToken } from "@/lib/auth";
import { sendOTPEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const clientResult = await db.execute({
      sql: "SELECT id FROM clients WHERE slug = ?",
      args: [slug],
    });

    if (clientResult.rows.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const client = clientResult.rows[0];
    const clientId = client.id;

    const subResult = await db.execute({
      sql: `SELECT monthly_lead_quota, reset_day, current_period_start, last_export_at
            FROM client_subscriptions WHERE client_id = ? ORDER BY id DESC LIMIT 1`,
      args: [clientId],
    });

    if (subResult.rows.length === 0) {
      return NextResponse.json(
        { error: "No subscription found for this client" },
        { status: 404 }
      );
    }

    const sub = subResult.rows[0];

    const deliveryResult = await db.execute({
      sql: `SELECT exported FROM lead_deliveries
            WHERE client_id = ? AND exported = 1
            AND period_start >= ?
            ORDER BY id DESC LIMIT 1`,
      args: [clientId, sub.current_period_start],
    });

    const exportedThisPeriod = deliveryResult.rows.length > 0;

    return NextResponse.json({
      subscription: {
        monthly_lead_quota: sub.monthly_lead_quota,
        reset_day: sub.reset_day,
        current_period_start: sub.current_period_start,
        last_export_at: sub.last_export_at,
        exported_this_period: exportedThisPeriod,
      },
    });
  } catch (error) {
    console.error("Client subscription info error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, step } = body;

    if (step === "password") {
      const { password, email } = body;

      const clientResult = await db.execute({
        sql: "SELECT id, name, slug, description, dashboard_password_hash, contact_email FROM clients WHERE slug = ?",
        args: [slug],
      });

      if (clientResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }

      const client = clientResult.rows[0];

      if (!client.dashboard_password_hash) {
        return NextResponse.json(
          { error: "No password set for this dashboard" },
          { status: 400 }
        );
      }

      const valid = await verifyPassword(
        password,
        client.dashboard_password_hash as string
      );
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 }
        );
      }

      // Determine which email to send OTP to
      const adminEmail = process.env.ADMIN_EMAIL || "admin@localhost";
      const clientEmail = client.contact_email as string;
      
      // Accept either admin email or client email
      let otpEmail = adminEmail;
      if (email && clientEmail && email.toLowerCase() === clientEmail.toLowerCase()) {
        otpEmail = clientEmail;
      } else if (email && email.toLowerCase() !== adminEmail.toLowerCase()) {
        return NextResponse.json(
          { error: "Email not authorized. Use the admin email or client email." },
          { status: 401 }
        );
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await db.execute({
        sql: "INSERT INTO otp_codes (email, code, expires_at) VALUES (?, ?, ?)",
        args: [otpEmail, otp, expiresAt],
      });

      const emailSent = await sendOTPEmail(otpEmail, otp);

      const tempToken = await generateToken({
        userId: client.id as number,
        email: otpEmail,
        role: "client",
      });

      return NextResponse.json({
        needsOTP: true,
        email: otpEmail,
        tempToken,
        otpCode: otp,
        emailSent,
      });
    }

    if (step === "otp") {
      const { code } = body;

      const result = await db.execute({
        sql: `SELECT id FROM otp_codes
              WHERE code = ? AND used = 0 AND expires_at > datetime('now')
              ORDER BY id DESC LIMIT 1`,
        args: [code],
      });

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 401 }
        );
      }

      await db.execute({
        sql: "UPDATE otp_codes SET used = 1 WHERE id = ?",
        args: [result.rows[0].id],
      });

      const clientResult = await db.execute({
        sql: "SELECT id, name, slug, description FROM clients WHERE slug = ?",
        args: [slug],
      });

      if (clientResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }

      const client = clientResult.rows[0];
      const clientId = client.id;

      const leadsResult = await db.execute({
        sql: `SELECT l.id, l.company_name, l.contact_name, l.industry, l.location, l.score, l.status, l.notes, l.contact_email, l.contact_phone
              FROM leads l
              JOIN client_leads cl ON l.id = cl.lead_id
              WHERE cl.client_id = ?
              ORDER BY l.score DESC`,
        args: [clientId],
      });

      let subscription = null;
      let exportedThisPeriod = false;

      try {
        const subResult = await db.execute({
          sql: `SELECT monthly_lead_quota, reset_day, current_period_start, last_export_at
                FROM client_subscriptions WHERE client_id = ? ORDER BY id DESC LIMIT 1`,
          args: [clientId],
        });

        if (subResult.rows.length > 0) {
          const sub = subResult.rows[0];

          try {
            const deliveryResult = await db.execute({
              sql: `SELECT exported FROM lead_deliveries
                    WHERE client_id = ? AND exported = 1
                    AND period_start >= ?
                    ORDER BY id DESC LIMIT 1`,
              args: [clientId, sub.current_period_start],
            });
            exportedThisPeriod = deliveryResult.rows.length > 0;
          } catch {
            // lead_deliveries table might not exist
          }

          subscription = {
            monthly_lead_quota: sub.monthly_lead_quota,
            reset_day: sub.reset_day,
            current_period_start: sub.current_period_start,
            last_export_at: sub.last_export_at,
            exported_this_period: exportedThisPeriod,
          };
        }
      } catch {
        // client_subscriptions table might not exist
      }

      return NextResponse.json({
        client: {
          name: client.name,
          description: client.description,
        },
        leads: leadsResult.rows,
        subscription,
      });
    }

    if (step === "update_status") {
      const { lead_id, status } = body;

      if (!lead_id || !status) {
        return NextResponse.json(
          { error: "lead_id and status are required" },
          { status: 400 }
        );
      }

      const clientResult = await db.execute({
        sql: "SELECT id FROM clients WHERE slug = ?",
        args: [slug],
      });

      if (clientResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }

      const client = clientResult.rows[0];

      const ownershipCheck = await db.execute({
        sql: `SELECT cl.lead_id FROM client_leads cl
              WHERE cl.client_id = ? AND cl.lead_id = ?`,
        args: [client.id, lead_id],
      });

      if (ownershipCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "Lead not found or not assigned to this client" },
          { status: 404 }
        );
      }

      await db.execute({
        sql: "UPDATE leads SET status = ? WHERE id = ?",
        args: [status, lead_id],
      });

      return NextResponse.json({ success: true, lead_id, status });
    }

    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  } catch (error) {
    console.error("Client auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
