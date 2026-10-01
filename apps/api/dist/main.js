import "reflect-metadata";
import { createNexusAuth } from "@nexus/auth";
import { parseServerEnvironment } from "@nexus/config";
import { createDatabase } from "@nexus/database";
import cors from "@fastify/cors";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import apiPackage from "../package.json" with { type: "json" };
import { exportQueueName, importQueueName, inspectionQueueName, reportQueueName, } from "@nexus/contracts";
import { Queue } from "bullmq";
import { StructuredLogger } from "@nexus/observability";
import { S3StorageProvider } from "@nexus/storage";
import { parseRedisConnection } from "./infrastructure/redis-connection.js";
import { registerHardening } from "./security/hardening.js";
import { AppModule } from "./app.module.js";
import { QueuedAuthEmailDispatcher } from "./auth/auth-email-dispatcher.js";
import { registerAuthRoutes } from "./auth/register-auth-routes.js";
async function bootstrap() {
    const environment = parseServerEnvironment(process.env);
    const database = createDatabase(environment.DATABASE_URL);
    const emailDispatcher = new QueuedAuthEmailDispatcher(environment.REDIS_URL);
    const importQueue = new Queue(importQueueName, {
        connection: parseRedisConnection(environment.REDIS_URL),
    });
    const exportQueue = new Queue(exportQueueName, {
        connection: parseRedisConnection(environment.REDIS_URL),
    });
    const reportQueue = new Queue(reportQueueName, {
        connection: parseRedisConnection(environment.REDIS_URL),
    });
    const inspectionQueue = new Queue(inspectionQueueName, {
        connection: parseRedisConnection(environment.REDIS_URL),
    });
    const storage = new S3StorageProvider({
        endpoint: environment.S3_ENDPOINT,
        region: environment.S3_REGION,
        bucket: environment.S3_BUCKET,
        accessKeyId: environment.S3_ACCESS_KEY,
        secretAccessKey: environment.S3_SECRET_KEY,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    });
    await storage.ensureBucket();
    const auth = createNexusAuth({
        db: database.db,
        secret: environment.BETTER_AUTH_SECRET,
        baseURL: environment.BETTER_AUTH_URL,
        trustedOrigins: [environment.WEB_URL],
        secureCookies: environment.NODE_ENV === "production",
        emailDispatcher,
    });
    const logger = new StructuredLogger("api");
    const adapter = new FastifyAdapter({
        bodyLimit: 6 * 1024 * 1024,
        logger: {
            level: environment.NODE_ENV === "production" ? "info" : "debug",
            redact: {
                paths: [
                    "req.headers.authorization",
                    "req.headers.cookie",
                    "res.headers.set-cookie",
                    "password",
                    "token",
                    "uploadUrl",
                    "downloadUrl",
                    "objectKey",
                ],
                censor: "[REDACTED]",
            },
        },
        trustProxy: true,
    });
    const app = await NestFactory.create(AppModule.register({
        auth,
        db: database.db,
        emailDispatcher,
        importQueue,
        inspectionQueue,
        reportQueue,
        exportQueue,
        storage,
        webUrl: environment.WEB_URL,
    }), adapter);
    const fastify = adapter.getInstance();
    registerHardening(fastify, {
        trustedOrigin: environment.WEB_URL,
        production: environment.NODE_ENV === "production",
        logger,
    });
    await fastify.register(cors, {
        origin: [environment.WEB_URL],
        credentials: true,
        methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    });
    registerAuthRoutes(fastify, auth, environment.BETTER_AUTH_URL);
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const openApiConfig = new DocumentBuilder()
        .setTitle("NEXUS API")
        .setDescription("NEXUS operational API contract")
        .setVersion(apiPackage.version)
        .addCookieAuth("nexus.session_token")
        .build();
    SwaggerModule.setup("openapi", app, SwaggerModule.createDocument(app, openApiConfig), {
        jsonDocumentUrl: "openapi.json",
    });
    let resourcesClosed = false;
    const closeResources = async () => {
        if (resourcesClosed)
            return;
        resourcesClosed = true;
        await Promise.allSettled([
            emailDispatcher.close(),
            importQueue.close(),
            inspectionQueue.close(),
            reportQueue.close(),
            exportQueue.close(),
            database.close(),
        ]);
    };
    let shutdownPromise;
    const shutdown = (signal) => {
        shutdownPromise ??= (async () => {
            logger.log("info", "api.shutdown", { signal });
            try {
                await app.close();
                await closeResources();
            }
            catch (error) {
                logger.log("error", "api.shutdown.failed", {
                    signal,
                    message: error instanceof Error ? error.message : "Unknown shutdown error",
                });
                process.exitCode = 1;
            }
        })();
        return shutdownPromise;
    };
    process.once("SIGINT", () => void shutdown("SIGINT"));
    process.once("SIGTERM", () => void shutdown("SIGTERM"));
    try {
        await app.listen(environment.API_PORT, "0.0.0.0");
    }
    catch (error) {
        await closeResources();
        throw error;
    }
}
void bootstrap();
//# sourceMappingURL=main.js.map