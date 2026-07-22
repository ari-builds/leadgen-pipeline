import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendOTPEmail(
  email: string,
  code: string
): Promise<boolean> {
  if (!resend) {
    console.log(`[DEV] OTP for ${email}: ${code}`);
    return true;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "LeadGen <noreply@localhost>",
      to: email,
      subject: "Your verification code",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a;">Verification Code</h2>
          <p style="color: #666;">Use this code to sign in:</p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
          </div>
          <p style="color: #999; font-size: 12px;">This code expires in 10 minutes.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
}
