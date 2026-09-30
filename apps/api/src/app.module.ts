import type { NexusAuth } from "@nexus/auth";
import type { createDatabase } from "@nexus/database";
import { DynamicModule, Module } from "@nestjs/common";
import type { AuthEmailDispatcher } from "@nexus/auth";
import type { GenerateInspectionReportJob } from "@nexus/contracts";
import type { Queue } from "bullmq";
import type { StorageProvider } from "@nexus/storage";

import { RequestContextService } from "./context/request-context.service.js";
import { HealthController } from "./health/health.controller.js";
import { ReadinessService } from "./health/readiness.service.js";
import { OrganizationsController } from "./organizations/organizations.controller.js";
import { OrganizationsService } from "./organizations/organizations.service.js";
import { MembershipsController } from "./memberships/memberships.controller.js";
import { MembershipsService } from "./memberships/memberships.service.js";
import { OperationsController } from "./operations/operations.controller.js";
import { OperationsService } from "./operations/operations.service.js";
import { InspectionsController } from "./inspections/inspections.controller.js";
import { InspectionsService } from "./inspections/inspections.service.js";
import { FindingsController } from "./findings/findings.controller.js";
import { FindingsService } from "./findings/findings.service.js";
import { EvidenceController } from "./evidence/evidence.controller.js";
import { EvidenceService } from "./evidence/evidence.service.js";
import { ReportsController } from "./reports/reports.controller.js";
import { ReportsService } from "./reports/reports.service.js";
import { SearchController } from "./search/search.controller.js";
import { SearchService } from "./search/search.service.js";
import { FieldSyncController } from "./sync/field-sync.controller.js";
import { FieldSyncService } from "./sync/field-sync.service.js";
import {
  AUTH_TOKEN,
  DATABASE_TOKEN,
  EMAIL_DISPATCHER_TOKEN,
  IMPORT_QUEUE_TOKEN,
  INSPECTION_QUEUE_TOKEN,
  REPORT_QUEUE_TOKEN,
  STORAGE_TOKEN,
  WEB_URL_TOKEN,
} from "./tokens.js";

export interface AppDependencies {
  auth: NexusAuth;
  db: ReturnType<typeof createDatabase>["db"];
  emailDispatcher: AuthEmailDispatcher;
  importQueue: Queue;
  inspectionQueue: Queue;
  reportQueue: Queue<GenerateInspectionReportJob>;
  storage: StorageProvider;
  webUrl: string;
}

@Module({})
export class AppModule {
  static register(dependencies: AppDependencies): DynamicModule {
    return {
      module: AppModule,
      controllers: [
        HealthController,
        OrganizationsController,
        MembershipsController,
        OperationsController,
        InspectionsController,
        FindingsController,
        EvidenceController,
        ReportsController,
        SearchController,
        FieldSyncController,
      ],
      providers: [
        ReadinessService,
        { provide: AUTH_TOKEN, useValue: dependencies.auth },
        { provide: DATABASE_TOKEN, useValue: dependencies.db },
        { provide: EMAIL_DISPATCHER_TOKEN, useValue: dependencies.emailDispatcher },
        { provide: IMPORT_QUEUE_TOKEN, useValue: dependencies.importQueue },
        { provide: INSPECTION_QUEUE_TOKEN, useValue: dependencies.inspectionQueue },
        { provide: REPORT_QUEUE_TOKEN, useValue: dependencies.reportQueue },
        { provide: STORAGE_TOKEN, useValue: dependencies.storage },
        { provide: WEB_URL_TOKEN, useValue: dependencies.webUrl },
        {
          provide: RequestContextService,
          inject: [AUTH_TOKEN, DATABASE_TOKEN],
          useFactory: (auth: AppDependencies["auth"], db: AppDependencies["db"]) =>
            new RequestContextService(auth, db),
        },
        {
          provide: OrganizationsService,
          inject: [DATABASE_TOKEN],
          useFactory: (db: AppDependencies["db"]) => new OrganizationsService(db),
        },
        {
          provide: MembershipsService,
          inject: [DATABASE_TOKEN, EMAIL_DISPATCHER_TOKEN, WEB_URL_TOKEN],
          useFactory: (db: AppDependencies["db"], email: AuthEmailDispatcher, webUrl: string) =>
            new MembershipsService(db, email, webUrl),
        },
        {
          provide: OperationsService,
          inject: [DATABASE_TOKEN, IMPORT_QUEUE_TOKEN],
          useFactory: (db: AppDependencies["db"], queue: Queue) => new OperationsService(db, queue),
        },
        {
          provide: InspectionsService,
          inject: [DATABASE_TOKEN, INSPECTION_QUEUE_TOKEN],
          useFactory: (db: AppDependencies["db"], queue: Queue) =>
            new InspectionsService(db, queue),
        },
        {
          provide: FindingsService,
          inject: [DATABASE_TOKEN],
          useFactory: (db: AppDependencies["db"]) => new FindingsService(db),
        },
        {
          provide: EvidenceService,
          inject: [DATABASE_TOKEN, STORAGE_TOKEN],
          useFactory: (db: AppDependencies["db"], storage: StorageProvider) =>
            new EvidenceService(db, storage),
        },
        {
          provide: ReportsService,
          inject: [DATABASE_TOKEN, REPORT_QUEUE_TOKEN, STORAGE_TOKEN],
          useFactory: (
            db: AppDependencies["db"],
            queue: Queue<GenerateInspectionReportJob>,
            storage: StorageProvider,
          ) => new ReportsService(db, queue, storage),
        },
        {
          provide: SearchService,
          inject: [DATABASE_TOKEN],
          useFactory: (db: AppDependencies["db"]) => new SearchService(db),
        },
        {
          provide: FieldSyncService,
          inject: [DATABASE_TOKEN, InspectionsService, EvidenceService],
          useFactory: (
            db: AppDependencies["db"],
            inspections: InspectionsService,
            evidence: EvidenceService,
          ) => new FieldSyncService(db, inspections, evidence),
        },
      ],
    };
  }
}
