export type UseCase = "coding" | "writing" | "data" | "research" | "mixed";

export type ToolName =
  | "Cursor"
  | "GitHub Copilot"
  | "Claude"
  | "ChatGPT"
  | "OpenAI API"
  | "Anthropic API"
  | "Gemini"
  | "Windsurf";

export type ToolInput = {
  tool: ToolName;
  plan: string;
  spend: number;
  seats: number;
};

export type AuditToolResult = {
  tool: ToolName;
  currentPlan: string;
  currentSpend: number;
  seats: number;
  recommendedPlan: string;
  recommendedAction: string;
  savings: number;
  reason: string;
  creditsOpportunity: boolean;
  alternative?: string;
};

export type AuditOutput = {
  useCase: UseCase;
  teamSize: number;
  perTool: AuditToolResult[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  highSavings: boolean;
  alreadyOptimal: boolean;
  summary: string;
};

const planPriceByTool: Record<ToolName, Record<string, number>> = {
  Cursor: {
    hobby: 0,
    pro: 20,
    business: 40,
  },
  "GitHub Copilot": {
    individual: 20,
    business: 19,
  },
  Claude: {
    free: 0,
    pro: 20,
    max: 100,
    team: 30,
  },
  ChatGPT: {
    plus: 20,
    team: 30,
  },
  "OpenAI API": {},
  "Anthropic API": {},
  Gemini: {
    free: 0,
    pro: 20,
    ultra: 35,
  },
  Windsurf: {
    free: 0,
    pro: 15,
    business: 32,
  },
};

const normalizePlan = (plan: string) => plan.trim().toLowerCase();

const clamp = (value: number) => Math.max(0, Math.round(value * 100) / 100);

const getCurrentSpend = (tool: ToolName, plan: string, spend: number, seats: number) => {
  const normalized = normalizePlan(plan);
  const planPrice = planPriceByTool[tool][normalized];

  if (spend > 0) {
    return spend;
  }

  if (typeof planPrice === "number") {
    return planPrice * seats;
  }

  return 0;
};

const createRecommendation = (
  tool: ToolName,
  currentPlan: string,
  spend: number,
  seats: number,
  useCase: UseCase,
): AuditToolResult => {
  const normalized = normalizePlan(currentPlan);
  const currentSpend = getCurrentSpend(tool, currentPlan, spend, seats);
  const baseResult: AuditToolResult = {
    tool,
    currentPlan,
    currentSpend,
    seats,
    recommendedPlan: currentPlan,
    recommendedAction: "Keep current plan and monitor usage.",
    savings: 0,
    reason: "No immediate change is needed based on the current inputs.",
    creditsOpportunity: currentSpend > 0,
  };

  if (tool === "Cursor") {
    if (normalized === "business" && seats <= 1) {
      return {
        ...baseResult,
        recommendedPlan: "Cursor Pro",
        recommendedAction: "Downgrade to Cursor Pro.",
        savings: clamp(currentSpend - 20 * seats),
        reason: "A one-seat Business plan is usually an overpayment for solo builders.",
        creditsOpportunity: true,
      };
    }

    if (normalized === "hobby" && seats >= 2) {
      return {
        ...baseResult,
        recommendedPlan: "Cursor Pro",
        recommendedAction: "Upgrade to Cursor Pro.",
        savings: 0,
        reason: "Hobby is too limited once you need more than a single-seat workflow.",
        creditsOpportunity: true,
      };
    }

    if (normalized === "enterprise" && seats <= 4) {
      return {
        ...baseResult,
        recommendedPlan: "Cursor Business",
        recommendedAction: "Move to Cursor Business.",
        savings: clamp(currentSpend - 40 * seats),
        reason: "Enterprise is usually too expensive for a small team that only needs standard collaboration.",
        creditsOpportunity: true,
      };
    }
  }

  if (tool === "GitHub Copilot") {
    if (normalized === "business" && seats <= 2) {
      return {
        ...baseResult,
        recommendedPlan: "GitHub Copilot Individual",
        recommendedAction: "Switch to GitHub Copilot Individual.",
        savings: clamp(currentSpend - 20 * seats),
        reason: "For 2 seats or fewer, the individual plan is usually the cheaper fit.",
        creditsOpportunity: true,
      };
    }

    if (normalized === "enterprise" && seats <= 4) {
      return {
        ...baseResult,
        recommendedPlan: "GitHub Copilot Business",
        recommendedAction: "Downgrade to GitHub Copilot Business.",
        savings: clamp(currentSpend - 19 * seats),
        reason: "Enterprise seats are often materially above what small product teams need.",
        creditsOpportunity: true,
      };
    }

    if (normalized === "individual" && seats >= 5) {
      return {
        ...baseResult,
        recommendedPlan: "GitHub Copilot Business",
        recommendedAction: "Upgrade to GitHub Copilot Business.",
        savings: 0,
        reason: "A team of five or more usually benefits from the business tier for broader seat management.",
        creditsOpportunity: true,
      };
    }
  }

  if (tool === "Claude") {
    if (normalized === "max" && seats <= 2) {
      return {
        ...baseResult,
        recommendedPlan: "Claude Pro",
        recommendedAction: "Move to Claude Pro.",
        savings: clamp(currentSpend - 20 * seats),
        reason: "A Max subscription is often too expensive when you are not using high-volume shared seats.",
        creditsOpportunity: true,
      };
    }

    if ((normalized === "team" || normalized === "pro") && seats <= 2 && currentSpend > 20 * seats) {
      return {
        ...baseResult,
        recommendedPlan: "Claude Pro",
        recommendedAction: "Switch to Claude Pro.",
        savings: clamp(currentSpend - 20 * seats),
        reason: "For a small team, Pro is usually enough and keeps you off an overbuilt seat bundle.",
        creditsOpportunity: true,
      };
    }
  }

  if (tool === "ChatGPT") {
    if (normalized === "team" && seats <= 2) {
      return {
        ...baseResult,
        recommendedPlan: "ChatGPT Plus",
        recommendedAction: "Switch to ChatGPT Plus.",
        savings: clamp(currentSpend - 20 * seats),
        reason: "A Team subscription for two users or fewer is usually a premium layer you can remove.",
        creditsOpportunity: true,
      };
    }
  }

  if (tool === "OpenAI API") {
    if (currentSpend >= 100) {
      return {
        ...baseResult,
        recommendedPlan: "OpenAI API direct",
        recommendedAction: "Trim usage or shift research-heavy traffic to Gemini API.",
        savings: clamp(currentSpend * 0.35),
        reason: "For non-production research workloads, Gemini API is often a cheaper alternative than paying full retail OpenAI API rates.",
        creditsOpportunity: true,
        alternative: "Gemini API",
      };
    }
  }

  if (tool === "Anthropic API") {
    if (currentSpend >= 100) {
      return {
        ...baseResult,
        recommendedPlan: "Anthropic API direct",
        recommendedAction: "Reduce spend or move general-purpose traffic to Gemini API.",
        savings: clamp(currentSpend * 0.3),
        reason: "Gemini is often a better fit for high-volume, lower-cost coding and research traffic.",
        creditsOpportunity: true,
        alternative: "Gemini API",
      };
    }
  }

  if (tool === "Gemini") {
    if (normalized === "ultra" && seats <= 1) {
      return {
        ...baseResult,
        recommendedPlan: "Gemini Pro",
        recommendedAction: "Downgrade to Gemini Pro.",
        savings: clamp(currentSpend - 20 * seats),
        reason: "Ultra is often overkill for a one-seat workflow that is still primarily productivity-focused.",
        creditsOpportunity: true,
      };
    }

    if (normalized === "api" && currentSpend >= 80 && useCase === "writing") {
      return {
        ...baseResult,
        recommendedPlan: "Gemini API",
        recommendedAction: "Switch to Gemini Flash pricing for writing workloads.",
        savings: clamp(currentSpend * 0.2),
        reason: "Gemini Flash-style usage is a better cost target for text-heavy output than a higher-cost general tier.",
        creditsOpportunity: true,
        alternative: "Gemini Flash API",
      };
    }
  }

  if (tool === "Windsurf") {
    if (normalized === "business" && seats <= 2) {
      return {
        ...baseResult,
        recommendedPlan: "Windsurf Pro",
        recommendedAction: "Switch to Windsurf Pro.",
        savings: clamp(currentSpend - 15 * seats),
        reason: "For small teams, Pro usually covers the essential collaboration layer at a lower all-in cost.",
        creditsOpportunity: true,
      };
    }
  }

  return baseResult;
};

export const buildAudit = (
  inputs: ToolInput[],
  useCase: UseCase,
  teamSize: number,
): AuditOutput => {
  const perTool = inputs
    .filter((input) => input.tool)
    .map((input) => createRecommendation(input.tool, input.plan, input.spend, input.seats, useCase));

  const totalMonthlySavings = clamp(
    perTool.reduce((sum, entry) => sum + entry.savings, 0),
  );

  const totalAnnualSavings = clamp(totalMonthlySavings * 12);
  const highSavings = totalMonthlySavings >= 500;
  const alreadyOptimal = totalMonthlySavings < 100;

  const summary = alreadyOptimal
    ? "Your current stack looks broadly efficient. The best next move is to keep the plan as-is and revisit the audit when your team or spend changes."
    : `Your stack can save about $${totalMonthlySavings.toFixed(2)} per month, or $${totalAnnualSavings.toFixed(2)} per year. The biggest wins are in the plans and usage patterns that are over-provisioned for your current team size.`;

  return {
    useCase,
    teamSize,
    perTool,
    totalMonthlySavings,
    totalAnnualSavings,
    highSavings,
    alreadyOptimal,
    summary,
  };
};
