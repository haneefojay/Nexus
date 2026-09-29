import { Injectable } from "@nestjs/common";
import { createConnection } from "node:net";

export type DependencyStatus = "up" | "down" | "not_configured";

export interface ReadinessResult {
  status: "ready" | "not_ready";
  dependencies: Record<"postgres" | "redis" | "objectStorage", DependencyStatus>;
}

interface Endpoint {
  host: string;
  port: number;
}

function endpointFromUrl(value: string | undefined, fallbackPort: number): Endpoint | null {
  if (!value) return null;
  const url = new URL(value);
  return {
    host: url.hostname,
    port: url.port ? Number.parseInt(url.port, 10) : fallbackPort,
  };
}

async function canConnect(endpoint: Endpoint | null, timeoutMs = 1_500): Promise<DependencyStatus> {
  if (!endpoint) return "not_configured";

  return new Promise((resolve) => {
    const socket = createConnection(endpoint);
    const finish = (status: DependencyStatus): void => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(status);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish("up"));
    socket.once("timeout", () => finish("down"));
    socket.once("error", () => finish("down"));
  });
}

@Injectable()
export class ReadinessService {
  async check(): Promise<ReadinessResult> {
    const [postgres, redis, objectStorage] = await Promise.all([
      canConnect(endpointFromUrl(process.env.DATABASE_URL, 5432)),
      canConnect(endpointFromUrl(process.env.REDIS_URL, 6379)),
      canConnect(endpointFromUrl(process.env.S3_ENDPOINT, 443)),
    ]);

    const dependencies = { postgres, redis, objectStorage };
    const status = Object.values(dependencies).every((value) => value === "up")
      ? "ready"
      : "not_ready";

    return { status, dependencies };
  }
}
