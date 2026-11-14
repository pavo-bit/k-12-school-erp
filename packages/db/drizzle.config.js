import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://erp:erp@localhost:5432/erp",
  },
  verbose: true,
  strict: true,
});
//# sourceMappingURL=drizzle.config.js.map
