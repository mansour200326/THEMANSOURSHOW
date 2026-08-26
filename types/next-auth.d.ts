import type { Plan } from "@/lib/plan/limits";

/**
 * The plan is part of the session everywhere it's read, so it's part of the
 * type everywhere too — otherwise every call site casts, and a cast is just a
 * lie you've agreed to believe.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      plan: Plan;
      planExpiresAt: Date | null;
    };
  }
}
