import { randomBytes, randomUUID } from "node:crypto";
const sensitive =
    /authorization|cookie|password|secret|token|signed.?url|upload.?url|download.?url|object.?key|evidence|payload|content/i,
  bearer = /\b(?:bearer|basic)\s+[a-z0-9._~+/=-]+/gi,
  signed = /([?&](?:x-amz-[^=]+|signature|token)=[^&\s]+)/gi;
export type SafeScalar = string | number | boolean | null;
export type SafeLogFields = Record<string, SafeScalar | undefined>;
export function redactValue(v: unknown, k = ""): unknown {
  if (sensitive.test(k)) return "[REDACTED]";
  if (typeof v === "string") return v.replace(bearer, "[REDACTED]").replace(signed, "[REDACTED]");
  if (Array.isArray(v)) return v.map((x) => redactValue(x));
  if (v && typeof v === "object")
    return Object.fromEntries(Object.entries(v).map(([a, b]) => [a, redactValue(b, a)]));
  return v;
}
export function safeError(e: unknown) {
  if (!(e instanceof Error))
    return {
      errorClass: "UnknownError",
      errorCode: "UNEXPECTED_ERROR",
      message: "Unexpected error",
    };
  const code = "code" in e && typeof e.code === "string" ? e.code : "UNEXPECTED_ERROR";
  return {
    errorClass: e.name || "Error",
    errorCode: code,
    message: code === "UNEXPECTED_ERROR" ? "Unexpected error" : e.message.slice(0, 180),
  };
}
export function parseTraceparent(v?: string) {
  if (!v) return null;
  const m = /^00-([0-9a-f]{32})-([0-9a-f]{16})-[0-9a-f]{2}$/i.exec(v.trim());
  return !m || /^0+$/.test(m[1]!) || /^0+$/.test(m[2]!)
    ? null
    : { traceId: m[1]!.toLowerCase(), parentSpanId: m[2]!.toLowerCase() };
}
export function correlationContext(requestId: string = randomUUID(), incoming?: string) {
  const traceId = parseTraceparent(incoming)?.traceId ?? randomBytes(16).toString("hex"),
    spanId = randomBytes(8).toString("hex");
  return { requestId, traceId, spanId, traceparent: `00-${traceId}-${spanId}-01` };
}
export class StructuredLogger {
  constructor(
    private service: string,
    private sink: (line: string) => void = console.log,
  ) {}
  log(level: "info" | "warn" | "error", operation: string, fields: SafeLogFields = {}) {
    this.sink(
      JSON.stringify(
        redactValue({
          timestamp: new Date().toISOString(),
          level,
          service: this.service,
          operation,
          ...fields,
        }),
      ),
    );
  }
}
export class SafeErrorMonitor {
  constructor(private logger: StructuredLogger) {}
  capture(error: unknown, fields: SafeLogFields) {
    this.logger.log("error", "error.captured", { ...fields, ...safeError(error) });
  }
}
