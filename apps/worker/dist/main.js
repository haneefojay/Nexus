import { Queue } from "bullmq";
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const parsedRedisUrl = new URL(redisUrl);
const connection = {
    host: parsedRedisUrl.hostname,
    port: parsedRedisUrl.port ? Number.parseInt(parsedRedisUrl.port, 10) : 6379,
    ...(parsedRedisUrl.username ? { username: parsedRedisUrl.username } : {}),
    ...(parsedRedisUrl.password ? { password: parsedRedisUrl.password } : {}),
};
const systemQueue = new Queue("nexus-system", { connection });
let shuttingDown = false;
async function shutdown(signal) {
    if (shuttingDown)
        return;
    shuttingDown = true;
    console.info(JSON.stringify({ level: "info", service: "worker", event: "shutdown", signal }));
    await systemQueue.close();
    process.exit(0);
}
async function bootstrap() {
    await systemQueue.waitUntilReady();
    console.info(JSON.stringify({ level: "info", service: "worker", event: "ready" }));
}
process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
void bootstrap().catch((error) => {
    console.error(JSON.stringify({
        level: "error",
        service: "worker",
        event: "startup_failed",
        message: error instanceof Error ? error.message : "Unknown startup error",
    }));
    process.exit(1);
});
//# sourceMappingURL=main.js.map