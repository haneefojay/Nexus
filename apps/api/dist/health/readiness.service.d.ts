import { type createDatabase } from "@nexus/database";
import type { StorageProvider } from "@nexus/storage";
import type { Queue } from "bullmq";
export type DependencyStatus = "up" | "down" | "not_configured";
export interface ReadinessResult {
    status: "ready" | "not_ready";
    dependencies: Record<"postgres" | "redis" | "objectStorage" | "migrations" | "workers", DependencyStatus>;
}
export interface ReadinessDependencies {
    db?: ReturnType<typeof createDatabase>["db"];
    queues?: Queue[];
    storage?: StorageProvider;
}
export declare class ReadinessService {
    private d;
    constructor(d?: ReadinessDependencies);
    check(): Promise<ReadinessResult>;
}
//# sourceMappingURL=readiness.service.d.ts.map