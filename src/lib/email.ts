import nodemailer from "nodemailer";

// ============================================================
// Multi-Provider Email System
// Priority: Gmail SMTP > GoodSender > Resend > Dev log
// Gmail SMTP = automated sending from your Gmail, no domain needed
// ============================================================

const GMAIL_USER = process.env.GMAIL_USER || null;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD || null;
const GOODSENDER_KEY = process.env.GOODSENDER_API_KEY || null;
const RESEND_KEY = process.env.RESEND_API_KEY || null;

// Gmail SMTP transporter (created once, reused)
const gmailTransporter =
  GMAIL_USER && GMAIL_PASS
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: GMAIL_USER, pass: GMAIL_PASS },
      })
    : null;

interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  from?: string;
  type?: "transactional" | "marketing" | "outreach";
}

interface SendEmailResult {
  success: boolean;
  provider: string;
  id?: string;
  error?: string;
}

// ============================================================
// Gmail SMTP
// ============================================================

async function sendViaGmail(
  opts: SendEmailOptions
): Promise<SendEmailResult> {
  if (!gmailTransporter) {
    return { success: false, provider: "gmail", error: "Not configured" };
  }

  try {
    const info = await gmailTransporter.sendMail({
      from: opts.from || `"NetClicks by Ari" <${GMAIL_USER}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });

    return { success: true, provider: "gmail", id: info.messageId };
  } catch (error) {
    return {
      success: false,
      provider: "gmail",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================
// GoodSender (REST API)
// ============================================================

async function sendViaGoodSender(
  opts: SendEmailOptions
): Promise<SendEmailResult> {
  if (!GOODSENDER_KEY) {
    return { success: false, provider: "goodsender", error: "No API key" };
  }

  const content = opts.html?.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "") || "";

  try {
    const resp = await fetch("https://api.goodsender.com/v1/emails/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GOODSENDER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emails: [
          {
            from: { email: "netclicksbyari@gmail.com", name: "NetClicks by Ari" },
            to: [{ email: opts.to }],
            subject: opts.subject,
            markdown_content: content,
          },
        ],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return { success: false, provider: "goodsender", error: data.message || `HTTP ${resp.status}` };
    }
    return { success: true, provider: "goodsender", id: data.id || data.emails?.[0]?.id };
  } catch (error) {
    return { success: false, provider: "goodsender", error: error instanceof Error ? error.message : "Unknown" };
  }
}

// ============================================================
// Resend
// ============================================================

async function sendViaResend(
  opts: SendEmailOptions
): Promise<SendEmailResult> {
  if (!RESEND_KEY) {
    return { success: false, provider: "resend", error: "No API key" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_KEY);
    const { data, error } = await resend.emails.send({
      from: opts.from || "NetClicks <noreply@localhost>",
      to: opts.to,
      subject: opts.subject,
      html: opts.html || "",
    });

    if (error) return { success: false, provider: "resend", error: error.message };
    return { success: true, provider: "resend", id: data?.id };
  } catch (error) {
    return { success: false, provider: "resend", error: error instanceof Error ? error.message : "Unknown" };
  }
}

// ============================================================
// Smart Router — tries providers in order until one works
// ============================================================

export async function sendEmail(
  opts: SendEmailOptions
): Promise<SendEmailResult> {
  // Try providers in order: Gmail > GoodSender > Resend
  const providers = [sendViaGmail, sendViaGoodSender, sendViaResend];

  for (const provider of providers) {
    const result = await provider(opts);
    if (result.success) {
      console.log(`[EMAIL] ${result.provider} -> OK (${opts.to})`);
      return result;
    }
    // Only log if provider was configured but failed
    if (result.error !== "Not configured" && result.error !== "No API key") {
      console.log(`[EMAIL] ${result.provider} failed: ${result.error}, trying next...`);
    }
  }

  // All providers failed or unconfigured — dev mode
  console.log(`[EMAIL DEV] to=${opts.to} subject="${opts.subject}"`);
  return { success: true, provider: "dev", id: "dev-mode" };
}

// ============================================================
// Convenience functions
// ============================================================

export async function sendOTPEmail(
  email: string,
  code: string
): Promise<boolean> {
  const result = await sendEmail({
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
    type: "transactional",
  });

  return result.success;
}

export async function sendOutreachEmail(
  to: string,
  subject: string,
  htmlBody: string,
  from?: string
): Promise<SendEmailResult> {
  return sendEmail({ to, subject, html: htmlBody, from, type: "outreach" });
}

export async function sendMarketingEmail(
  to: string,
  subject: string,
  htmlBody: string,
  from?: string
): Promise<SendEmailResult> {
  return sendEmail({ to, subject, html: htmlBody, from, type: "marketing" });
}
