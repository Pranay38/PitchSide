import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string({
    message: "MONGODB_URI is extremely required; build will fail loudly without it.",
  }).url("MONGODB_URI must be a valid connected string URL"),
  // Include Clerk keys if we verify them for build-time as well
  // VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
});

// Avoid executing this during client-side or during CI environments that might skip standard secrets
// But since the user wants it to fail loudly at build, we parse it immediately upon import here:
export function validateEnv(environment: Record<string, string | undefined>) {
  const _env = envSchema.safeParse(environment);

  if (!_env.success) {
    console.error("❌ Invalid environment variables:", _env.error.format());
    throw new Error("Invalid environment variables. See above for details.");
  }
  
  return _env.data;
}
