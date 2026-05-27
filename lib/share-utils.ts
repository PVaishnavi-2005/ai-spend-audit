export type PublicAuditPayload = {
  generatedAt: string;
  teamSize: number;
  useCase: string;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  summary: string;
  perTool: Array<{
    tool: string;
    currentPlan: string;
    recommendedPlan: string;
    currentSpend: number;
    savings: number;
    reason: string;
    recommendedAction: string;
    alternative?: string;
  }>;
};

export const encodePayload = (payload: PublicAuditPayload) => {
  const serialized = JSON.stringify(payload);

  if (typeof window === "undefined") {
    return Buffer.from(serialized, "utf8").toString("base64");
  }

  return btoa(serialized);
};

export const decodePayload = (payload: string): PublicAuditPayload => {
  const serialized = typeof window === "undefined"
    ? Buffer.from(payload, "base64").toString("utf8")
    : atob(payload);

  return JSON.parse(serialized) as PublicAuditPayload;
};
