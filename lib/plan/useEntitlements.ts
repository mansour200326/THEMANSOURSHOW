"use client";

import { useEffect, useState } from "react";
import {
  type Entitlements,
  type Plan,
  ENTITLEMENTS,
  FREE_GAME_IDS,
} from "@/lib/plan/limits";

export type Me = {
  plan: Plan;
  /** No database attached, so nothing is enforced. */
  open: boolean;
  signedIn: boolean;
  freeGameIds: string[];
  entitlements: Entitlements;
  generationsTonight: number;
};

/**
 * The plan, for screens that render before the server has been asked.
 *
 * Starts optimistic — everything unlocked — because the alternative is every
 * lobby flashing "Pro" over three-quarters of the games for a moment on every
 * load. Being briefly too generous costs nothing: the server refuses anyway,
 * and refusing shows the upgrade screen, which is where the host was going.
 */
export function useEntitlements(): Me {
  const [me, setMe] = useState<Me>({
    plan: "pro",
    open: true,
    signedIn: false,
    freeGameIds: FREE_GAME_IDS,
    entitlements: ENTITLEMENTS.pro,
    generationsTonight: 0,
  });

  useEffect(() => {
    let alive = true;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data) setMe(data as Me);
      })
      .catch(() => {
        /* Optimistic default stands; the server is the one that decides. */
      });
    return () => {
      alive = false;
    };
  }, []);

  return me;
}
