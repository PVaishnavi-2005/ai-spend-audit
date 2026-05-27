import { describe, expect, it } from "vitest";
import { buildAudit } from "../lib/audit-engine";

describe("buildAudit", () => {
  it("recommends Cursor Pro for a one-seat Business plan", () => {
    const result = buildAudit(
      [{ tool: "Cursor", plan: "Business", spend: 40, seats: 1 }],
      "coding",
      1,
    );

    expect(result.perTool[0].recommendedPlan).toBe("Cursor Pro");
    expect(result.perTool[0].savings).toBeGreaterThan(0);
  });

  it("flags ChatGPT Team as overbuilt for two seats", () => {
    const result = buildAudit(
      [{ tool: "ChatGPT", plan: "Team", spend: 60, seats: 2 }],
      "coding",
      2,
    );

    expect(result.perTool[0].recommendedPlan).toBe("ChatGPT Plus");
    expect(result.perTool[0].savings).toBe(20);
  });

  it("finds cheaper alternatives for high API spend", () => {
    const result = buildAudit(
      [{ tool: "OpenAI API", plan: "API direct", spend: 300, seats: 1 }],
      "coding",
      3,
    );

    expect(result.perTool[0].savings).toBeGreaterThan(0);
    expect(result.perTool[0].alternative).toBe("Gemini API");
  });

  it("computes total monthly and annual savings", () => {
    const result = buildAudit(
      [
        { tool: "Cursor", plan: "Business", spend: 40, seats: 1 },
        { tool: "ChatGPT", plan: "Team", spend: 60, seats: 2 },
      ],
      "mixed",
      3,
    );

    expect(result.totalMonthlySavings).toBeGreaterThan(0);
    expect(result.totalAnnualSavings).toBe(result.totalMonthlySavings * 12);
  });

  it("marks small savings as already optimal", () => {
    const result = buildAudit(
      [{ tool: "Cursor", plan: "Pro", spend: 20, seats: 1 }],
      "writing",
      1,
    );

    expect(result.alreadyOptimal).toBe(true);
  });
});
