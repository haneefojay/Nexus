import { correlationContext, type StructuredLogger } from "@nexus/observability";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
interface Policy {
  pattern: RegExp;
  methods?: ReadonlySet<string>;
  limit: number;
  windowMs: number;
}
const minute = 60000;
export const ratePolicies: readonly Policy[] = [
  {
    pattern: /^\/v1\/auth\/(?:sign-in|sign-up|forget-password|reset-password)/,
    limit: 10,
    windowMs: minute,
  },
  { pattern: /^\/v1\/invitations/, limit: 20, windowMs: minute },
  { pattern: /^\/v1\/uploads\/authorize/, limit: 30, windowMs: minute },
  { pattern: /^\/v1\/imports/, limit: 10, windowMs: minute },
  {
    pattern: /^\/v1\/(?:inspection-runs\/[^/]+\/reports|reports\/[^/]+\/retry)/,
    methods: new Set(["POST"]),
    limit: 10,
    windowMs: minute,
  },
  {
    pattern: /^\/v1\/exports(?:\/[^/]+\/retry)?$/,
    methods: new Set(["POST"]),
    limit: 10,
    windowMs: minute,
  },
  {
    pattern: /^\/v1\/sync\/field\/commands/,
    methods: new Set(["POST"]),
    limit: 120,
    windowMs: minute,
  },
];
export function policyFor(m: string, p: string) {
  return ratePolicies.find((x) => (!x.methods || x.methods.has(m)) && x.pattern.test(p));
}
export class FixedWindowLimiter {
  private b = new Map<string, { count: number; resetsAt: number }>();
  consume(k: string, l: number, w: number, n = Date.now()) {
    const c = this.b.get(k),
      b = !c || c.resetsAt <= n ? { count: 0, resetsAt: n + w } : c;
    b.count++;
    this.b.set(k, b);
    return { allowed: b.count <= l, retryAfter: Math.max(1, Math.ceil((b.resetsAt - n) / 1000)) };
  }
}
export function registerHardening(
  f: FastifyInstance,
  o: { trustedOrigin: string; production: boolean; logger: StructuredLogger },
) {
  const l = new FixedWindowLimiter(),
    started = new WeakMap<FastifyRequest, number>();
  f.addHook("onRequest", async (r, reply) => {
    started.set(r, performance.now());
    const h = r.headers.traceparent,
      c = correlationContext(r.id, Array.isArray(h) ? h[0] : h);
    reply.header("x-request-id", c.requestId).header("traceparent", c.traceparent);
    const origin = r.headers.origin;
    if (origin && origin !== o.trustedOrigin && !["GET", "HEAD", "OPTIONS"].includes(r.method))
      return reject(reply, 403, "ORIGIN_NOT_TRUSTED", r.id);
    const p = policyFor(r.method, r.url.split("?", 1)[0]!);
    if (p) {
      const x = l.consume(`${r.ip}:${r.method}:${p.pattern.source}`, p.limit, p.windowMs);
      if (!x.allowed) {
        reply.header("retry-after", x.retryAfter);
        return reject(reply, 429, "RATE_LIMITED", r.id);
      }
    }
  });
  f.addHook("onSend", async (r, reply, payload) => {
    reply
      .header("x-content-type-options", "nosniff")
      .header("x-frame-options", "DENY")
      .header("referrer-policy", "no-referrer")
      .header("permissions-policy", "camera=(), microphone=(), geolocation=()")
      .header(
        "content-security-policy",
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
      )
      .header("cache-control", r.url.includes("/download") ? "no-store" : "no-cache");
    if (o.production)
      reply.header("strict-transport-security", "max-age=31536000; includeSubDomains");
    return payload;
  });
  f.addHook("onResponse", async (r, reply) =>
    o.logger.log(
      reply.statusCode >= 500 ? "error" : reply.statusCode >= 400 ? "warn" : "info",
      "http.request",
      {
        requestId: r.id,
        method: r.method,
        route: r.routeOptions.url,
        status: reply.statusCode,
        durationMs:
          Math.round((performance.now() - (started.get(r) ?? performance.now())) * 100) / 100,
      },
    ),
  );
}
function reject(r: FastifyReply, s: number, c: string, id: string) {
  return r
    .status(s)
    .send({
      error: { code: c, message: "The request could not be completed", details: {}, requestId: id },
    });
}
