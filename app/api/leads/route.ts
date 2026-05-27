import { NextRequest } from "next/server";

const rateLimitWindowMs = 10 * 60 * 1000;
const maxAttempts = 5;
const rateLimit = new Map<string, { count: number; windowStart: number }>();

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
};

const isRateLimited = (key: string) => {
  const current = rateLimit.get(key);
  const now = Date.now();

  if (!current) {
    rateLimit.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (now - current.windowStart > rateLimitWindowMs) {
    rateLimit.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (current.count >= maxAttempts) {
    return true;
  }

  current.count += 1;
  rateLimit.set(key, current);
  return false;
};

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return Response.json({ ok: false, message: "Rate limit exceeded. Please try again later." }, { status: 429 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload.email !== "string" || payload.email.trim() === "") {
    return Response.json({ ok: false, message: "Valid email is required." }, { status: 400 });
  }

  if (payload.honeypot) {
    return Response.json({ ok: true }, { status: 200 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM || "onboarding@credex.rocks";

  if (resendKey) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [payload.email],
        subject: "Your AI Spend Audit is ready",
        html: `<p>Thanks for checking your AI spend.</p><p>Your audit is ready and we’ll note any high-savings opportunities for a Credex consultation.</p>`,
      }),
    }).catch(() => null);
  }

  return Response.json({ ok: true, emailSent: Boolean(resendKey) }, { status: 200 });
}
