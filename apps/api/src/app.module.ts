import type { NexusAuth } from "@nexus/auth";
import type { createDatabase } from "@nexus/database";
import { DynamicModule, Module } from "@nestjs/common";

import { HealthController } from "./health/health.controller.js";
import { ReadinessService } from "./health/readiness.service.js";
import { OrganizationsController } from "./organizations/organizations.controller.js";
import { OrganizationsService } from "./organizations/organizations.service.js";
import { AUTH_TOKEN, DATABASE_TOKEN } from "./tokens.js";

export interface AppDependencies {
  auth: NexusAuth;
  db: ReturnType<typeof createDatabase>["db"];
}

@Module({})
export class AppModule {
  static register(dependencies: AppDependencies): DynamicModule {
    return {
      module: AppModule,
      controllers: [HealthController, OrganizationsController],
      providers: [
        ReadinessService,
        { provide: AUTH_TOKEN, useValue: dependencies.auth },
        { provide: DATABASE_TOKEN, useValue: dependencies.db },
        {
          provide: OrganizationsService,
          inject: [DATABASE_TOKEN],
          useFactory: (db: AppDependencies["db"]) => new OrganizationsService(db),
        },
      ],
    };
  }
}
