import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyPassword, generateOTP, generateToken } from "@/lib/auth";
import { sendOTPEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const result = await db.execute({
      sql: "SELECT id, email, password_hash, role FROM users WHERE email = ?",
      args: [email],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = result.rows[0];
    const valid = await verifyPassword(password, user.password_hash as string);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate and send OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.execute({
      sql: "INSERT INTO otp_codes (email, code, expires_at) VALUES (?, ?, ?)",
      args: [email, otp, expiresAt],
    });

    await sendOTPEmail(email, otp);

    // Generate a temporary token for the verify step
    const tempToken = await generateToken({
      userId: user.id as number,
      email: user.email as string,
      role: user.role as string,
    });

    return NextResponse.json({
      success: true,
      requiresOTP: true,
      tempToken,
      message: "Check your email for the verification code",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
