import { NextRequest } from "next/server";

const fallbackSummary = (audit: Record<string, unknown>) => {
  const totalMonthlySavings = Number(audit.totalMonthlySavings ?? 0);

  if (totalMonthlySavings < 100) {
    return "Your current stack looks broadly efficient. The best next move is to keep the plan mix stable and revisit the audit when your usage or team size changes.";
  }

  return `Your stack is likely overpaying for a few seats and usage patterns. The audit points to lower-cost plan choices and a few usage shifts that can save you about $${totalMonthlySavings.toFixed(0)} a month. The strongest opportunities are in plans that are larger than your current team size or in retail API usage that can be routed more cheaply.`;
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return Response.json({ summary: fallbackSummary({ totalMonthlySavings: 0 }), source: "fallback" }, { status: 200 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json({ summary: fallbackSummary(body), source: "fallback" }, { status: 200 });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022",
        max_tokens: 180,
        messages: [
          {
            role: "user",
            content: `You are a startup finance-savvy AI spend auditor. Write a 100-word personalized summary of this audit. Include the biggest opportunities, the reason they matter, and one concrete next step. Do not use bullet points.\n\nAudit JSON:\n${JSON.stringify(body, null, 2)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return Response.json({ summary: fallbackSummary(body), source: "fallback" }, { status: 200 });
    }

    const data = await response.json();
    const summary = data?.content?.[0]?.text?.trim() || fallbackSummary(body);

    return Response.json({ summary, source: "anthropic" }, { status: 200 });
  } catch {
    return Response.json({ summary: fallbackSummary(body), source: "fallback" }, { status: 200 });
  }
}
