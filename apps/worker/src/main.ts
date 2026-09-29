import { parseServerEnvironment } from "@nexus/config";
import { authEmailJobName, emailQueueName, type AuthEmailJob } from "@nexus/contracts";
import { Queue, Worker } from "bullmq";
import nodemailer from "nodemailer";

import { renderAuthEmail } from "./auth-email.js";

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

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(JSON.stringify({ level: "info", service: "worker", event: "shutdown", signal }));
  await Promise.allSettled([emailWorker.close(), systemQueue.close()]);
  transporter.close();
  process.exit(0);
}

async function bootstrap(): Promise<void> {
  await Promise.all([
    systemQueue.waitUntilReady(),
    emailWorker.waitUntilReady(),
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
