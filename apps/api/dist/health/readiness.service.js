var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { expectedMigrationCount, latestExpectedMigrationTimestamp, sql, } from "@nexus/database";
import { Injectable } from "@nestjs/common";
async function bounded(p, ms = 1500) {
    let t;
    try {
        return await Promise.race([
            p,
            new Promise((_, r) => {
                t = setTimeout(() => r(new Error("TIMEOUT")), ms);
            }),
        ]);
    }
    finally {
        if (t)
            clearTimeout(t);
    }
}
let ReadinessService = class ReadinessService {
    constructor(d = {}) {
        this.d = d;
    }
    async check() {
        const { db, queues = [], storage } = this.d;
        let postgres = db ? "down" : "not_configured", migrations = db ? "down" : "not_configured", redis = queues.length ? "down" : "not_configured", workers = queues.length ? "down" : "not_configured", objectStorage = storage ? "down" : "not_configured";
        if (db)
            try {
                const x = await bounded(db.execute(sql `select count(*)::int migration_count, max(created_at)::bigint latest_migration from drizzle.__drizzle_migrations`)), r = x[0];
                postgres = "up";
                migrations =
                    r?.migration_count === expectedMigrationCount &&
                        Number(r.latest_migration) === latestExpectedMigrationTimestamp
                        ? "up"
                        : "down";
            }
            catch {
                postgres = migrations = "down";
            }
        if (queues.length)
            try {
                const x = await bounded(Promise.all(queues.map(async (q) => (await q.getWorkers()).length)));
                redis = "up";
                workers = x.some((n) => n > 0) ? "up" : "down";
            }
            catch {
                redis = workers = "down";
            }
        if (storage)
            try {
                objectStorage = (await bounded(storage.checkHealth())) ? "up" : "down";
            }
            catch {
                objectStorage = "down";
            }
        const dependencies = { postgres, redis, objectStorage, migrations, workers };
        return {
            status: Object.values(dependencies).every((v) => v === "up") ? "ready" : "not_ready",
            dependencies,
        };
    }
};
ReadinessService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Object])
], ReadinessService);
export { ReadinessService };
//# sourceMappingURL=readiness.service.js.map