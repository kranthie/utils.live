/**
 * Next.js Instrumentation
 *
 * This file runs once when the Next.js server starts.
 * Used for environment validation and service initialization.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register(): Promise<void> {
  // Only validate on the server (not in Edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateServerEnv } = await import("@/lib/env");

    try {
      validateServerEnv();
    } catch (error) {
      console.error(
        "Failed to validate environment variables at startup:",
        error
      );
      // In production, fail hard — do not start with invalid env
      if (process.env.NODE_ENV === "production") {
        process.exit(1);
      }
    }
  }
}
