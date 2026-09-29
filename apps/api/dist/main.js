import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
async function bootstrap() {
    const app = await NestFactory.create(AppModule, new FastifyAdapter({ logger: true, trustProxy: true }));
    app.enableShutdownHooks();
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const openApiConfig = new DocumentBuilder()
        .setTitle("NEXUS API")
        .setDescription("NEXUS operational API contract")
        .setVersion("0.1.0")
        .addCookieAuth("nexus_session")
        .build();
    SwaggerModule.setup("openapi", app, SwaggerModule.createDocument(app, openApiConfig), {
        jsonDocumentUrl: "openapi.json",
    });
    const port = Number.parseInt(process.env.API_PORT ?? "3001", 10);
    await app.listen(port, "0.0.0.0");
}
void bootstrap();
//# sourceMappingURL=main.js.map