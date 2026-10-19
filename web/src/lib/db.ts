// web/src/lib/db.ts
import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

export const sql =
  globalThis.__sql ??
  postgres(process.env.DATABASE_URL!, {
    ssl: process.env.DATABASE_SSL === "disable" ? false : "require",
    max: 5,
    idle_timeout: 20,
    prepare: false,
    transform: { undefined: null },
  });

if (process.env.NODE_ENV !== "production") globalThis.__sql = sql;