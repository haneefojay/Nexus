export type DependencyStatus = "up" | "down" | "not_configured";
export interface ReadinessResult {
    status: "ready" | "not_ready";
    dependencies: Record<"postgres" | "redis" | "objectStorage", DependencyStatus>;
}
export declare class ReadinessService {
    check(): Promise<ReadinessResult>;
}
//# sourceMappingURL=readiness.service.d.ts.map