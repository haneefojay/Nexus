import { z } from "zod";
export declare const serverEnvironmentSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        test: "test";
        production: "production";
    }>>;
    API_PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    WEB_URL: z.ZodURL;
    API_URL: z.ZodURL;
    DATABASE_URL: z.ZodURL;
    REDIS_URL: z.ZodURL;
    S3_ENDPOINT: z.ZodURL;
    S3_REGION: z.ZodString;
    S3_BUCKET: z.ZodString;
    S3_ACCESS_KEY: z.ZodString;
    S3_SECRET_KEY: z.ZodString;
    BETTER_AUTH_SECRET: z.ZodString;
    BETTER_AUTH_URL: z.ZodURL;
    EMAIL_FROM: z.ZodString;
    SMTP_HOST: z.ZodString;
    SMTP_PORT: z.ZodCoercedNumber<unknown>;
    SMTP_USER: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    ARTIFACT_RETENTION_DAYS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    SMTP_PASSWORD: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;
export declare function parseServerEnvironment(input: Record<string, string | undefined>): ServerEnvironment;
//# sourceMappingURL=index.d.ts.map