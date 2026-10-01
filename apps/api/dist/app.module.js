var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AppModule_1;
import { Module } from "@nestjs/common";
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
import { ExportsController } from "./exports/exports.controller.js";
import { ExportsService } from "./exports/exports.service.js";
import { ReportsController } from "./reports/reports.controller.js";
import { ReportsService } from "./reports/reports.service.js";
import { SearchController } from "./search/search.controller.js";
import { SearchService } from "./search/search.service.js";
import { FieldSyncController } from "./sync/field-sync.controller.js";
import { FieldSyncService } from "./sync/field-sync.service.js";
import { AUTH_TOKEN, DATABASE_TOKEN, EMAIL_DISPATCHER_TOKEN, EXPORT_QUEUE_TOKEN, IMPORT_QUEUE_TOKEN, INSPECTION_QUEUE_TOKEN, REPORT_QUEUE_TOKEN, STORAGE_TOKEN, WEB_URL_TOKEN, } from "./tokens.js";
let AppModule = AppModule_1 = class AppModule {
    static register(dependencies) {
        return {
            module: AppModule_1,
            controllers: [
                HealthController,
                OrganizationsController,
                MembershipsController,
                OperationsController,
                InspectionsController,
                FindingsController,
                EvidenceController,
                ReportsController,
                ExportsController,
                SearchController,
                FieldSyncController,
            ],
            providers: [
                {
                    provide: ReadinessService,
                    inject: [
                        DATABASE_TOKEN,
                        IMPORT_QUEUE_TOKEN,
                        INSPECTION_QUEUE_TOKEN,
                        REPORT_QUEUE_TOKEN,
                        EXPORT_QUEUE_TOKEN,
                        STORAGE_TOKEN,
                    ],
                    useFactory: (db, importQueue, inspectionQueue, reportQueue, exportQueue, storage) => new ReadinessService({
                        db,
                        queues: [importQueue, inspectionQueue, reportQueue, exportQueue],
                        storage,
                    }),
                },
                { provide: AUTH_TOKEN, useValue: dependencies.auth },
                { provide: DATABASE_TOKEN, useValue: dependencies.db },
                { provide: EMAIL_DISPATCHER_TOKEN, useValue: dependencies.emailDispatcher },
                { provide: IMPORT_QUEUE_TOKEN, useValue: dependencies.importQueue },
                { provide: INSPECTION_QUEUE_TOKEN, useValue: dependencies.inspectionQueue },
                { provide: REPORT_QUEUE_TOKEN, useValue: dependencies.reportQueue },
                { provide: EXPORT_QUEUE_TOKEN, useValue: dependencies.exportQueue },
                { provide: STORAGE_TOKEN, useValue: dependencies.storage },
                { provide: WEB_URL_TOKEN, useValue: dependencies.webUrl },
                {
                    provide: RequestContextService,
                    inject: [AUTH_TOKEN, DATABASE_TOKEN],
                    useFactory: (auth, db) => new RequestContextService(auth, db),
                },
                {
                    provide: OrganizationsService,
                    inject: [DATABASE_TOKEN],
                    useFactory: (db) => new OrganizationsService(db),
                },
                {
                    provide: MembershipsService,
                    inject: [DATABASE_TOKEN, EMAIL_DISPATCHER_TOKEN, WEB_URL_TOKEN],
                    useFactory: (db, email, webUrl) => new MembershipsService(db, email, webUrl),
                },
                {
                    provide: OperationsService,
                    inject: [DATABASE_TOKEN, IMPORT_QUEUE_TOKEN],
                    useFactory: (db, queue) => new OperationsService(db, queue),
                },
                {
                    provide: InspectionsService,
                    inject: [DATABASE_TOKEN, INSPECTION_QUEUE_TOKEN],
                    useFactory: (db, queue) => new InspectionsService(db, queue),
                },
                {
                    provide: FindingsService,
                    inject: [DATABASE_TOKEN],
                    useFactory: (db) => new FindingsService(db),
                },
                {
                    provide: EvidenceService,
                    inject: [DATABASE_TOKEN, STORAGE_TOKEN],
                    useFactory: (db, storage) => new EvidenceService(db, storage),
                },
                {
                    provide: ExportsService,
                    inject: [DATABASE_TOKEN, EXPORT_QUEUE_TOKEN, STORAGE_TOKEN],
                    useFactory: (db, queue, storage) => new ExportsService(db, queue, storage),
                },
                {
                    provide: ReportsService,
                    inject: [DATABASE_TOKEN, REPORT_QUEUE_TOKEN, STORAGE_TOKEN],
                    useFactory: (db, queue, storage) => new ReportsService(db, queue, storage),
                },
                {
                    provide: SearchService,
                    inject: [DATABASE_TOKEN],
                    useFactory: (db) => new SearchService(db),
                },
                {
                    provide: FieldSyncService,
                    inject: [DATABASE_TOKEN, InspectionsService, EvidenceService],
                    useFactory: (db, inspections, evidence) => new FieldSyncService(db, inspections, evidence),
                },
            ],
        };
    }
};
AppModule = AppModule_1 = __decorate([
    Module({})
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map