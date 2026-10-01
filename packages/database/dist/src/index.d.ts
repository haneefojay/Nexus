import postgres from "postgres";
import * as schema from "./schema/index.js";
export * from "./schema/index.js";
export { and, asc, count, desc, eq, ilike, inArray, isNull, lte, ne, or, sql } from "drizzle-orm";
export declare function createDatabase(databaseUrl: string): {
    client: postgres.Sql<{}>;
    db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
        $client: postgres.Sql<{}>;
    };
    close(): Promise<void>;
};
//# sourceMappingURL=index.d.ts.map