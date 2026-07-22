import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyToken, generateOTP } from "@/lib/auth";
import { sendOTPEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { tempToken } = await req.json();

    if (!tempToken) {
      return NextResponse.json(
        { error: "Session expired. Please sign in again." },
        { status: 400 }
      );
    }

    const payload = await verifyToken(tempToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Session expired. Please sign in again." },
        { status: 401 }
      );
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.execute({
      sql: "INSERT INTO otp_codes (email, code, expires_at) VALUES (?, ?, ?)",
      args: [payload.email, otp, expiresAt],
    });

    await sendOTPEmail(payload.email, otp);

    return NextResponse.json({
      success: true,
      message: "Verification code sent",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
