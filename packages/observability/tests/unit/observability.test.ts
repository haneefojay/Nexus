import { describe, expect, it } from "vitest";
import {
  correlationContext,
  parseTraceparent,
  redactValue,
  SafeErrorMonitor,
  StructuredLogger,
} from "../../src/index.js";
describe("safe observability", () => {
  it("redacts recursively", () =>
    expect(
      redactValue({ cookie: "x", nested: { password: "p", safe: "ok" }, payload: { x: 1 } }),
    ).toEqual({
      cookie: "[REDACTED]",
      nested: { password: "[REDACTED]", safe: "ok" },
      payload: "[REDACTED]",
    }));
  it("validates trace context", () => {
    const t = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
    expect(correlationContext("r", t).traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
    expect(parseTraceparent("bad")).toBeNull();
  });
  it("captures safe errors", () => {
    const l: string[] = [];
    new SafeErrorMonitor(new StructuredLogger("t", (x) => l.push(x))).capture(
      new Error("private"),
      { requestId: "r" },
    );
    expect(l[0]).not.toContain("private");
  });
});
