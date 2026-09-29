import { defineConfig } from "drizzle-kit";
export default defineConfig({
    dialect: "postgresql",
    schema: "./src/schema/index.ts",
    out: "./migrations",
    dbCredentials: {
        url: process.env.DATABASE_URL ?? "postgresql://nexus:nexus_local_only@localhost:5432/nexus",
    },
    strict: true,
    verbose: true,
});
//# sourceMappingURL=drizzle.config.js.map