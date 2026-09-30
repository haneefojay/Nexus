import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index.js";

export * from "./schema/index.js";
export { and, asc, count, desc, eq, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";

export function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

  return {
    client,
    db: drizzle(client, { schema }),
    async close(): Promise<void> {
      await client.end({ timeout: 5 });
    },
  };
}
