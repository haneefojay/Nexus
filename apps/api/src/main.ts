import "reflect-metadata";

import { createNexusAuth } from "@nexus/auth";
import { parseServerEnvironment } from "@nexus/config";
import { createDatabase } from "@nexus/database";
import cors from "@fastify/cors";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { importQueueName, inspectionQueueName } from "@nexus/contracts";
import { Queue } from "bullmq";
import { S3StorageProvider } from "@nexus/storage";
import { parseRedisConnection } from "./infrastructure/redis-connection.js";

import { AppModule } from "./app.module.js";
import { QueuedAuthEmailDispatcher } from "./auth/auth-email-dispatcher.js";
import { registerAuthRoutes } from "./auth/register-auth-routes.js";

async function bootstrap(): Promise<void> {
  const environment = parseServerEnvironment(process.env);
  const database = createDatabase(environment.DATABASE_URL);
  const emailDispatcher = new QueuedAuthEmailDispatcher(environment.REDIS_URL);
  const importQueue = new Queue(importQueueName, {
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

  const adapter = new FastifyAdapter({ logger: true, trustProxy: true });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register({
      auth,
      db: database.db,
      emailDispatcher,
      importQueue,
      inspectionQueue,
      storage,
      webUrl: environment.WEB_URL,
    }),
    adapter,
  );
  const fastify = adapter.getInstance();

  await fastify.register(cors, {
    origin: [environment.WEB_URL],
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  registerAuthRoutes(fastify, auth, environment.BETTER_AUTH_URL);

  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const openApiConfig = new DocumentBuilder()
    .setTitle("NEXUS API")
    .setDescription("NEXUS operational API contract")
    .setVersion("0.1.0")
    .addCookieAuth("nexus.session_token")
    .build();

  SwaggerModule.setup("openapi", app, SwaggerModule.createDocument(app, openApiConfig), {
    jsonDocumentUrl: "openapi.json",
  });

  let resourcesClosed = false;
  const closeResources = async (): Promise<void> => {
    if (resourcesClosed) return;
    resourcesClosed = true;
    await Promise.allSettled([
      emailDispatcher.close(),
      importQueue.close(),
      inspectionQueue.close(),
      database.close(),
    ]);
  };
  process.once("SIGINT", () => void closeResources());
  process.once("SIGTERM", () => void closeResources());

  try {
    await app.listen(environment.API_PORT, "0.0.0.0");
  } catch (error) {
    await closeResources();
    throw error;
  }
}

void bootstrap();
