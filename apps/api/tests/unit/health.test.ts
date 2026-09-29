import { describe, expect, it } from "vitest";

import { HealthController } from "../../src/health/health.controller.js";
import type { ReadinessService } from "../../src/health/readiness.service.js";

describe("HealthController", () => {
  it("reports the process as alive without probing dependencies", () => {
    const readiness = { check: async () => ({ status: "ready", dependencies: {} }) };
    const controller = new HealthController(readiness as unknown as ReadinessService);
    expect(controller.health()).toEqual({ status: "ok", service: "api" });
  });
});
