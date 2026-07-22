import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyToken, generateToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { code, tempToken } = await req.json();

    if (!code || !tempToken) {
      return NextResponse.json(
        { error: "Code and token required" },
        { status: 400 }
      );
    }

    const payload = await verifyToken(tempToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Check OTP
    const result = await db.execute({
      sql: `SELECT id FROM otp_codes 
            WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
            ORDER BY id DESC LIMIT 1`,
      args: [payload.email, code],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 401 }
      );
    }

    // Mark OTP as used
    await db.execute({
      sql: "UPDATE otp_codes SET used = 1 WHERE id = ?",
      args: [result.rows[0].id],
    });

    // Generate final auth token
    const authToken = await generateToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        email: payload.email,
        role: payload.role,
      },
    });

    response.cookies.set("auth-token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
