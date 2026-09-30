import type { NexusAuth } from "@nexus/auth";
import type { createDatabase } from "@nexus/database";
import { DynamicModule, Module } from "@nestjs/common";
import type { AuthEmailDispatcher } from "@nexus/auth";
import type { Queue } from "bullmq";

import { RequestContextService } from "./context/request-context.service.js";
import { HealthController } from "./health/health.controller.js";
import { ReadinessService } from "./health/readiness.service.js";
import { OrganizationsController } from "./organizations/organizations.controller.js";
import { OrganizationsService } from "./organizations/organizations.service.js";
import { MembershipsController } from "./memberships/memberships.controller.js";
import { MembershipsService } from "./memberships/memberships.service.js";
import { OperationsController } from "./operations/operations.controller.js";
import { OperationsService } from "./operations/operations.service.js";
import {
  AUTH_TOKEN,
  DATABASE_TOKEN,
  EMAIL_DISPATCHER_TOKEN,
  IMPORT_QUEUE_TOKEN,
  WEB_URL_TOKEN,
} from "./tokens.js";

export interface AppDependencies {
  auth: NexusAuth;
  db: ReturnType<typeof createDatabase>["db"];
  emailDispatcher: AuthEmailDispatcher;
  importQueue: Queue;
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
      ],
      providers: [
        ReadinessService,
        { provide: AUTH_TOKEN, useValue: dependencies.auth },
        { provide: DATABASE_TOKEN, useValue: dependencies.db },
        { provide: EMAIL_DISPATCHER_TOKEN, useValue: dependencies.emailDispatcher },
        { provide: IMPORT_QUEUE_TOKEN, useValue: dependencies.importQueue },
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
      ],
    };
  }
}
