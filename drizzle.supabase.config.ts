import { defineConfig } from "drizzle-kit";

// Used only for generating the supabase/schema.sql file
// Does not require a live DATABASE_URL connection
export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./supabase/migrations_tmp",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
