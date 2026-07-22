import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyPassword, generateOTP, generateToken } from "@/lib/auth";
import { sendOTPEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, step } = body;

    if (step === "password") {
      const { password } = body;

      // Get client by slug
      const clientResult = await db.execute({
        sql: "SELECT id, name, slug, description, dashboard_password_hash FROM clients WHERE slug = ?",
        args: [slug],
      });

      if (clientResult.rows.length === 0) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }

      const client = clientResult.rows[0];

      if (!client.dashboard_password_hash) {
        return NextResponse.json({ error: "No password set for this dashboard" }, { status: 400 });
      }

      const valid = await verifyPassword(password, client.dashboard_password_hash as string);
      if (!valid) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
      }

      // Generate OTP and send to admin email
      const otp = generateOTP();
      const adminEmail = process.env.ADMIN_EMAIL || "admin@localhost";
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await db.execute({
        sql: "INSERT INTO otp_codes (email, code, expires_at) VALUES (?, ?, ?)",
        args: [adminEmail, otp, expiresAt],
      });

      await sendOTPEmail(adminEmail, otp);

      // Create a temp token for this client session
      const tempToken = await generateToken({
        userId: client.id as number,
        email: adminEmail,
        role: "client",
      });

      return NextResponse.json({
        needsOTP: true,
        email: adminEmail,
        tempToken,
      });
    }

    if (step === "otp") {
      const { code } = body;

      // Verify OTP - for now, accept the admin's OTP
      const result = await db.execute({
        sql: `SELECT id FROM otp_codes 
              WHERE code = ? AND used = 0 AND expires_at > datetime('now')
              ORDER BY id DESC LIMIT 1`,
        args: [code],
      });

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
      }

      await db.execute({
        sql: "UPDATE otp_codes SET used = 1 WHERE id = ?",
        args: [result.rows[0].id],
      });

      // Get client data
      const clientResult = await db.execute({
        sql: "SELECT id, name, slug, description FROM clients WHERE slug = ?",
        args: [slug],
      });

      if (clientResult.rows.length === 0) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }

      const client = clientResult.rows[0];

      // Get leads for this client
      const leadsResult = await db.execute({
        sql: `SELECT l.id, l.company_name, l.contact_name, l.industry, l.location, l.score, l.status
              FROM leads l
              JOIN client_leads cl ON l.id = cl.lead_id
              WHERE cl.client_id = ?
              ORDER BY l.score DESC`,
        args: [client.id],
      });

      return NextResponse.json({
        client: {
          name: client.name,
          description: client.description,
        },
        leads: leadsResult.rows,
      });
    }

    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  } catch (error) {
    console.error("Client auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
