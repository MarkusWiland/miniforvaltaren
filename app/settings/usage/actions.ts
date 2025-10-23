"use server";

import prisma from "@/lib/prisma";
import { requireUser, getSessionLandlordId } from "@/lib/get-session";
import { PLAN_LIMITS, PlanId } from "@/lib/billing/plan-limit";

/**
 * Hämta nuvarande plan för användaren.
 * Byt implementation enligt hur du sparar plan (t.ex. landlord.plan).
 */
export async function getCurrentPlanForUser(userId: string): Promise<PlanId> {
  // Exempel: hämta landlord kopplat till user och läs plan (fallback till FREE)
  const landlord = await prisma.landlord.findFirst({
    where: { userId },
    select: { plan: true }, // kolumnen "plan" bör vara "FREE" | "BASIC" | "PRO"
  });
  const plan = (landlord?.plan as PlanId) ?? "FREE";
  return plan;
}

export type UsageResult = {
  plan: PlanId;
  meetings: { used: number; limit: number; remaining: number };
  agents: { used: number; limit: number; remaining: number };
};

export async function getFreeUsageAction(): Promise<UsageResult> {
  const user = await requireUser(); // kräver inloggning
  await getSessionLandlordId({ ensure: true }); // säkerställ landlord
  const plan = await getCurrentPlanForUser(user.id);
  const limits = PLAN_LIMITS[plan];



  return {
    plan,
    meetings: {
      used: 0,
      limit: limits.meetings,
      remaining: Math.max(0, limits.meetings - 0),
    },
    agents: {
      used: 0,
      limit: limits.agents,
      remaining: Math.max(0, limits.agents - 0),
    },
  };
}
