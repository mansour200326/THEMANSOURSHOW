import "server-only";

/**
 * A ceiling on how often one address can make us call the model.
 *
 * Every writing endpoint is a POST with no account behind it, on a public URL,
 * that spends real money on an Anthropic key. Anyone who finds the address can
 * sit in a loop on /api/board and run the bill up; nothing here was stopping
 * them, and nothing would have told us it was happening.
 *
 * This is deliberately crude — a fixed window in memory, per process. It is
 * not a defence against somebody determined, and it isn't trying to be: it's
 * the difference between a stranger's script costing a few pounds before it
 * gives up and costing whatever it likes overnight. A real party needs a
 * handful of these an hour, so the ceiling is nowhere near a real host.
 */

type Window = { count: number; resetAt: number };

const g = globalThis as unknown as { __bnLimits?: Map<string, Window> };
const windows = (g.__bnLimits ??= new Map<string, Window>());

export type Limit = { ok: boolean; retryAfter: number };

export function rateLimit(
  key: string,
  allowed: number,
  windowMs: number,
): Limit {
  const now = Date.now();
  const found = windows.get(key);

  if (!found || found.resetAt <= now) {
    // Sweep on write, so an idle process doesn't hold every address it saw.
    if (windows.size > 5000) {
      for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
    }
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  found.count += 1;
  return found.count <= allowed
    ? { ok: true, retryAfter: 0 }
    : { ok: false, retryAfter: Math.ceil((found.resetAt - now) / 1000) };
}

/**
 * Who's asking. Behind Railway or Vercel the socket address is the proxy's, so
 * the forwarded header is the only thing that distinguishes callers — it's
 * spoofable, which is another reason this is a ceiling and not a lock.
 */
export function callerKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
