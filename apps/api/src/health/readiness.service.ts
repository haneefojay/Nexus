import { sql, type createDatabase } from "@nexus/database";
import type { StorageProvider } from "@nexus/storage";
import { Injectable } from "@nestjs/common";
import type { Queue } from "bullmq";
export type DependencyStatus = "up" | "down" | "not_configured";
export interface ReadinessResult {
  status: "ready" | "not_ready";
  dependencies: Record<
    "postgres" | "redis" | "objectStorage" | "migrations" | "workers",
    DependencyStatus
  >;
}
export interface ReadinessDependencies {
  db?: ReturnType<typeof createDatabase>["db"];
  queues?: Queue[];
  storage?: StorageProvider;
}
async function bounded<T>(p: Promise<T>, ms = 1500) {
  let t: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<T>((_, r) => {
        t = setTimeout(() => r(new Error("TIMEOUT")), ms);
      }),
    ]);
  } finally {
    if (t) clearTimeout(t);
  }
}
@Injectable()
export class ReadinessService {
  constructor(private d: ReadinessDependencies = {}) {}
  async check(): Promise<ReadinessResult> {
    const { db, queues = [], storage } = this.d;
    let postgres: DependencyStatus = db ? "down" : "not_configured",
      migrations: DependencyStatus = db ? "down" : "not_configured",
      redis: DependencyStatus = queues.length ? "down" : "not_configured",
      workers: DependencyStatus = queues.length ? "down" : "not_configured",
      objectStorage: DependencyStatus = storage ? "down" : "not_configured";
    if (db)
      try {
        const x = await bounded(
            db.execute(
              sql`select to_regclass('public.report_requests') reports,to_regclass('public.export_requests') exports`,
            ),
          ),
          r = x[0] as { reports?: string | null; exports?: string | null } | undefined;
        postgres = "up";
        migrations = r?.reports && r.exports ? "up" : "down";
      } catch {
        postgres = migrations = "down";
      }
    if (queues.length)
      try {
        const x = await bounded(
          Promise.all(queues.map(async (q) => (await q.getWorkers()).length)),
        );
        redis = "up";
        workers = x.some((n) => n > 0) ? "up" : "down";
      } catch {
        redis = workers = "down";
      }
    if (storage)
      try {
        objectStorage = (await bounded(storage.checkHealth())) ? "up" : "down";
      } catch {
        objectStorage = "down";
      }
    const dependencies = { postgres, redis, objectStorage, migrations, workers };
    return {
      status: Object.values(dependencies).every((v) => v === "up") ? "ready" : "not_ready",
      dependencies,
    };
  }
}
