import type { NexusAuth } from "@nexus/auth";
import type { createDatabase } from "@nexus/database";
import { DynamicModule } from "@nestjs/common";
import type { AuthEmailDispatcher } from "@nexus/auth";
import type { GenerateInspectionReportJob, GenerateOperationalExportJob } from "@nexus/contracts";
import type { Queue } from "bullmq";
import type { StorageProvider } from "@nexus/storage";
export interface AppDependencies {
    auth: NexusAuth;
    db: ReturnType<typeof createDatabase>["db"];
    emailDispatcher: AuthEmailDispatcher;
    importQueue: Queue;
    inspectionQueue: Queue;
    reportQueue: Queue<GenerateInspectionReportJob>;
    exportQueue: Queue<GenerateOperationalExportJob>;
    storage: StorageProvider;
    webUrl: string;
}
export declare class AppModule {
    static register(dependencies: AppDependencies): DynamicModule;
}
//# sourceMappingURL=app.module.d.ts.map