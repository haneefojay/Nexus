import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
export * from "./schema/index.js";
export function createDatabase(databaseUrl) {
    const client = postgres(databaseUrl, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false,
    });
    return {
        client,
        db: drizzle(client),
        async close() {
            await client.end({ timeout: 5 });
        },
    };
}
//# sourceMappingURL=index.js.map