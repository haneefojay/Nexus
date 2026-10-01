import { randomUUID } from "node:crypto";

import type { AuthEmail, AuthEmailDispatcher } from "@nexus/auth";
import { authEmailJobName, emailQueueName, type AuthEmailJob } from "@nexus/contracts";
import { Queue } from "bullmq";

import { parseRedisConnection } from "../infrastructure/redis-connection.js";

export class QueuedAuthEmailDispatcher implements AuthEmailDispatcher {
  readonly queue: Queue<AuthEmailJob>;

  constructor(redisUrl: string) {
    this.queue = new Queue<AuthEmailJob>(emailQueueName, {
      connection: parseRedisConnection(redisUrl),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 1_000 },
        removeOnComplete: { age: 86_400, count: 1_000 },
        removeOnFail: { age: 604_800, count: 5_000 },
      },
    });
  }

  async enqueue(message: AuthEmail): Promise<void> {
    await this.queue.add(authEmailJobName, { ...message, correlationId: randomUUID() });
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
