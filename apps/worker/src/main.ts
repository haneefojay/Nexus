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
} from "@nexus/contracts";
import { createDatabase } from "@nexus/database";
import { Queue, Worker } from "bullmq";
import nodemailer from "nodemailer";

import { renderAuthEmail } from "./auth-email.js";
import { processImport } from "./process-import.js";
import { generateInspectionRuns } from "./generate-inspection-runs.js";

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
const connection = parseRedisConnection(environment.REDIS_URL);
const database = createDatabase(environment.DATABASE_URL);
const systemQueue = new Queue("nexus-system", { connection });
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
const inspectionQueue = new Queue<GenerateInspectionRunsJob>(inspectionQueueName, { connection });
const inspectionWorker = new Worker<GenerateInspectionRunsJob>(
  inspectionQueueName,
  async (job) => {
    if (job.name !== generateInspectionRunsJobName)
      throw new Error(`Unsupported inspection job: ${job.name}`);
    await generateInspectionRuns(database.db, job.data);
  },
  { connection, concurrency: 2 },
);

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(JSON.stringify({ level: "info", service: "worker", event: "shutdown", signal }));
  await Promise.allSettled([
    emailWorker.close(),
    importWorker.close(),
    inspectionWorker.close(),
    inspectionQueue.close(),
    systemQueue.close(),
    database.close(),
  ]);
  transporter.close();
  process.exit(0);
}

async function bootstrap(): Promise<void> {
  await inspectionQueue.add(
    generateInspectionRunsJobName,
    { horizonDays: 35, requestedAt: new Date().toISOString() },
    {
      jobId: "bounded-upcoming-generation",
      repeat: { every: 60 * 60 * 1_000 },
      attempts: 5,
      backoff: { type: "exponential", delay: 1_000 },
    },
  );
  await Promise.all([
    systemQueue.waitUntilReady(),
    emailWorker.waitUntilReady(),
    importWorker.waitUntilReady(),
    inspectionWorker.waitUntilReady(),
    transporter.verify(),
  ]);
  console.info(JSON.stringify({ level: "info", service: "worker", event: "ready" }));
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

void bootstrap().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      level: "error",
      service: "worker",
      event: "startup_failed",
      message: error instanceof Error ? error.message : "Unknown startup error",
    }),
  );
  process.exit(1);
});
