import { ReadinessService, type ReadinessResult } from "./readiness.service.js";
export declare class HealthController {
    private readonly readiness;
    constructor(readiness: ReadinessService);
    health(): {
        status: "ok";
        service: "api";
    };
    ready(): Promise<ReadinessResult>;
}
//# sourceMappingURL=health.controller.d.ts.map