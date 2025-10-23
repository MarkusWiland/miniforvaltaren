export type PlanId = "FREE" | "BASIC" | "PRO";

export const PLAN_LIMITS: Record<PlanId, { meetings: number; agents: number }> = {
  FREE:  { meetings: 5,   agents: 1 },
  BASIC: { meetings: 50,  agents: 5 },
  PRO:   { meetings: 500, agents: 25 },
};
