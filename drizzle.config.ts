import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: ["./src/lib/auth-schema.ts", "./src/features/**/*.schema.ts"],
  out: "./migrations",
});
