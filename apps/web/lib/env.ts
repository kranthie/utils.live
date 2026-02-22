import { z } from "zod";

/**
 * Server-side environment variables schema.
 * These are validated at build time and runtime.
 */
const serverEnvSchema = z.object({
  // Optional: App URL for sitemap/robots
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Node environment
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

/**
 * Client-side environment variables schema.
 * Only NEXT_PUBLIC_* variables are available client-side.
 */
const clientEnvSchema = z.object({
  // Add NEXT_PUBLIC_* variables here as needed
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validate and parse server environment variables.
 * Call this at application startup to fail fast on missing config.
 */
export function validateServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.format();
    console.error("Invalid environment variables:");
    console.error(JSON.stringify(errors, null, 2));
    throw new Error("Invalid environment variables. Check server logs.");
  }

  return parsed.data;
}

/**
 * Validate and parse client environment variables.
 */
export function validateClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    // Add NEXT_PUBLIC_* variables from process.env here
  });

  if (!parsed.success) {
    const errors = parsed.error.format();
    console.error("Invalid client environment variables:");
    console.error(JSON.stringify(errors, null, 2));
    throw new Error("Invalid client environment variables.");
  }

  return parsed.data;
}

/**
 * Get validated server environment.
 * Caches the result after first validation.
 */
let cachedServerEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) {
    return cachedServerEnv;
  }

  cachedServerEnv = validateServerEnv();
  return cachedServerEnv;
}
