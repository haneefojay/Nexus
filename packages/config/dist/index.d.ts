import { z } from "zod";
export declare const serverEnvironmentSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        test: "test";
        production: "production";
    }>>;
    API_PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DATABASE_URL: z.ZodURL;
    REDIS_URL: z.ZodURL;
    S3_ENDPOINT: z.ZodURL;
    S3_REGION: z.ZodString;
    S3_BUCKET: z.ZodString;
    S3_ACCESS_KEY: z.ZodString;
    S3_SECRET_KEY: z.ZodString;
    BETTER_AUTH_SECRET: z.ZodString;
    BETTER_AUTH_URL: z.ZodURL;
    SMTP_HOST: z.ZodString;
    SMTP_PORT: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;
export declare function parseServerEnvironment(input?: NodeJS.ProcessEnv): ServerEnvironment;
//# sourceMappingURL=index.d.ts.map