import postgres from "postgres";
export * from "./schema/index.js";
export declare function createDatabase(databaseUrl: string): {
    client: postgres.Sql<{}>;
    db: import("drizzle-orm/postgres-js").PostgresJsDatabase<Record<string, never>> & {
        $client: postgres.Sql<{}>;
    };
    close(): Promise<void>;
};
//# sourceMappingURL=index.d.ts.map