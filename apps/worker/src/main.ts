import { randomUUID } from "node:crypto";

import { parseServerEnvironment } from "@nexus/config";
import {
  authEmailJobName,
  emailQueueName,
  importQueueName,
  inspectionQueueName,
  generateInspectionRunsJobName,
  processImportJobName,
  type AuthEmailJob,
  type ProcessImportJob,
  type GenerateInspectionRunsJob,
  cleanupArtifactsJobName,
  type CleanupArtifactsJob,
  cleanupEvidenceUploadsJobName,
  systemQueueName,
  type CleanupEvidenceUploadsJob,
  exportQueueName,
  generateOperationalExportJobName,
  type GenerateOperationalExportJob,
  reportQueueName,
  generateInspectionReportJobName,
  type GenerateInspectionReportJob,
} from "@nexus/contracts";
import { createDatabase } from "@nexus/database";
import { Queue, Worker } from "bullmq";
import nodemailer from "nodemailer";
import { SafeErrorMonitor, StructuredLogger } from "@nexus/observability";
import { S3StorageProvider } from "@nexus/storage";

import { renderAuthEmail } from "./auth-email.js";
import { processImport } from "./process-import.js";
import { generateInspectionRuns } from "./generate-inspection-runs.js";
import { dispatchInspectionNotifications } from "./inspection-notifications.js";
import { cleanupExpiredArtifacts } from "./artifact-cleanup.js";
import { cleanupExpiredEvidenceUploads } from "./evidence-cleanup.js";
import { generateOperationalExport } from "./exports.js";
import { generateInspectionReport } from "./reporting.js";

function parseRedisConnection(redisUrl: string) {
  const parsed = new URL(redisUrl);
  return {
    host: parsed.hostname,
    port: parsed.port ? Number.parseInt(parsed.port, 10) : 6379,
    ...(parsed.username ? { username: decodeURIComponent(parsed.username) } : {}),
    ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
    ...(parsed.protocol === "rediss:" ? { tls: {} } : {}),
  };
}

const environment = parseServerEnvironment(process.env);
const logger = new StructuredLogger("worker");
const errorMonitor = new SafeErrorMonitor(logger);
const connection = parseRedisConnection(environment.REDIS_URL);
const database = createDatabase(environment.DATABASE_URL);
const systemQueue = new Queue<CleanupEvidenceUploadsJob | CleanupArtifactsJob>(systemQueueName, {
  connection,
});
const storage = new S3StorageProvider({
  endpoint: environment.S3_ENDPOINT,
  region: environment.S3_REGION,
  bucket: environment.S3_BUCKET,
  accessKeyId: environment.S3_ACCESS_KEY,
  secretAccessKey: environment.S3_SECRET_KEY,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
});
const transporter = nodemailer.createTransport({
  host: environment.SMTP_HOST,
  port: environment.SMTP_PORT,
  secure: environment.SMTP_PORT === 465,
  ...(environment.SMTP_USER && environment.SMTP_PASSWORD
    ? { auth: { user: environment.SMTP_USER, pass: environment.SMTP_PASSWORD } }
    : {}),
});
const emailWorker = new Worker<AuthEmailJob>(
  emailQueueName,
  async (job) => {
    if (job.name !== authEmailJobName) throw new Error(`Unsupported email job: ${job.name}`);
    const message = renderAuthEmail(job.data);
    await transporter.sendMail({
      from: environment.EMAIL_FROM,
      to: job.data.recipient,
      ...message,
    });
  },
  { connection, concurrency: 5 },
);
const importWorker = new Worker<ProcessImportJob>(
  importQueueName,
  async (job) => {
    if (job.name !== processImportJobName) throw new Error(`Unsupported import job: ${job.name}`);
    await processImport(database.db, job.data.importJobId, job.data.organizationId);
  },
  { connection, concurrency: 2 },
);
const exportWorker = new Worker<GenerateOperationalExportJob>(
  exportQueueName,
  async (job) => {
    if (job.name !== generateOperationalExportJobName)
      throw new Error(`Unsupported export job: ${job.name}`);
    await generateOperationalExport(
      database.db,
      storage,
      job.data.exportRequestId,
      job.data.organizationId,
      new Date(),
      environment.ARTIFACT_RETENTION_DAYS,
    );
  },
  { connection, concurrency: 2 },
);
const reportWorker = new Worker<GenerateInspectionReportJob>(
  reportQueueName,
  async (job) => {
    if (job.name !== generateInspectionReportJobName)
      throw new Error(`Unsupported report job: ${job.name}`);
    await generateInspectionReport(
      database.db,
      storage,
      job.data.reportRequestId,
      job.data.organizationId,
      new Date(),
      environment.ARTIFACT_RETENTION_DAYS,
    );
  },
  { connection, concurrency: 2 },
);
const inspectionQueue = new Queue<GenerateInspectionRunsJob>(inspectionQueueName, { connection });
const inspectionWorker = new Worker<GenerateInspectionRunsJob>(
  inspectionQueueName,
  async (job) => {
    if (job.name !== generateInspectionRunsJobName)
      throw new Error(`Unsupported inspection job: ${job.name}`);
    await generateInspectionRuns(database.db, job.data);
    await dispatchInspectionNotifications(
      database.db,
      transporter,
      environment.EMAIL_FROM,
      new Date(job.data.requestedAt),
    );
  },
  { connection, concurrency: 2 },
);
const systemWorker = new Worker<CleanupEvidenceUploadsJob | CleanupArtifactsJob>(
  systemQueueName,
  async (job) => {
    if (job.name === cleanupEvidenceUploadsJobName) {
      await cleanupExpiredEvidenceUploads(database.db, storage, new Date(job.data.requestedAt));
      return;
    }
    if (job.name === cleanupArtifactsJobName) {
      await cleanupExpiredArtifacts(database.db, storage, new Date(job.data.requestedAt));
      return;
    }
    throw new Error(`Unsupported system job: ${job.name}`);
  },
  { connection, concurrency: 1 },
);
function observeFailures<T>(worker: Worker<T>, operation: string): void {
  worker.on("failed", (job, error) => {
    const data: unknown = job?.data;
    const fields =
      typeof data === "object" && data !== null
        ? (data as { correlationId?: unknown; organizationId?: unknown })
        : {};
    errorMonitor.capture(error, {
      operation,
      jobId: job?.id,
      requestId: typeof fields.correlationId === "string" ? fields.correlationId : undefined,
      organizationId: typeof fields.organizationId === "string" ? fields.organizationId : undefined,
      status: "failed",
    });
  });
}

observeFailures(emailWorker, "email.deliver");
observeFailures(importWorker, "import.process");
observeFailures(exportWorker, "export.generate");
observeFailures(reportWorker, "report.generate");
observeFailures(inspectionWorker, "inspection.generate");
observeFailures(systemWorker, "system.cleanup");

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.log("info", "worker.shutdown", { signal });
  await Promise.allSettled([
    emailWorker.close(),
    importWorker.close(),
    inspectionWorker.close(),
    reportWorker.close(),
    exportWorker.close(),
    inspectionQueue.close(),
    systemQueue.close(),
    systemWorker.close(),
    database.close(),
  ]);
  transporter.close();
  process.exit(0);
}

async function bootstrap(): Promise<void> {
  await storage.ensureBucket();
  await inspectionQueue.add(
    generateInspectionRunsJobName,
    { correlationId: randomUUID(), horizonDays: 35, requestedAt: new Date().toISOString() },
    {
      jobId: "bounded-upcoming-generation",
      repeat: { every: 60 * 60 * 1_000 },
      attempts: 5,
      backoff: { type: "exponential", delay: 1_000 },
    },
  );
  await systemQueue.add(
    cleanupEvidenceUploadsJobName,
    { correlationId: randomUUID(), requestedAt: new Date().toISOString() },
    {
      jobId: "evidence-orphan-cleanup",
      repeat: { every: 15 * 60 * 1_000 },
      attempts: 8,
      backoff: { type: "exponential", delay: 2_000 },
    },
  );
  await systemQueue.add(
    cleanupArtifactsJobName,
    { correlationId: randomUUID(), requestedAt: new Date().toISOString() },
    {
      jobId: "report-export-expiry-cleanup",
      repeat: { every: 60 * 60 * 1_000 },
      attempts: 8,
      backoff: { type: "exponential", delay: 2_000 },
    },
  );
  await Promise.all([
    systemQueue.waitUntilReady(),
    emailWorker.waitUntilReady(),
    importWorker.waitUntilReady(),
    reportWorker.waitUntilReady(),
    exportWorker.waitUntilReady(),
    inspectionWorker.waitUntilReady(),
    systemWorker.waitUntilReady(),
    transporter.verify(),
  ]);
  logger.log("info", "worker.ready", { status: "ready" });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

void bootstrap().catch((error: unknown) => {
  errorMonitor.capture(error, { operation: "worker.startup", status: "failed" });
  process.exit(1);
});
