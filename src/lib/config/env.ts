import { z } from "zod";

const envSchema = z.object({
  APP_NAME: z.string().default("TuwaiqX"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_PATH: z.string().default("./uploads"),
  S3_ENDPOINT: z.string().optional().default(""),
  S3_ACCESS_KEY: z.string().optional().default(""),
  S3_SECRET_KEY: z.string().optional().default(""),
  S3_BUCKET: z.string().optional().default(""),
  AUTH_SECRET: z.string().optional().default(""),
  DEFAULT_MODEL_PROVIDER: z.enum(["ollama", "openai-compatible", "mock"]).default("ollama"),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_CHAT_MODEL: z.string().default("llama3.1"),
  OLLAMA_EMBEDDING_MODEL: z.string().default("nomic-embed-text"),
  OPENAI_COMPATIBLE_BASE_URL: z.string().optional().default(""),
  OPENAI_COMPATIBLE_API_KEY: z.string().optional().default(""),
  OPENAI_COMPATIBLE_CHAT_MODEL: z.string().optional().default(""),
  OPENAI_COMPATIBLE_EMBEDDING_MODEL: z.string().optional().default(""),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.string().optional().default(""),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  SMTP_FROM: z.string().optional().default(""),
  RATE_LIMIT_ENABLED: z
    .string()
    .optional()
    .default("true")
    .transform((value) => value !== "false"),
  SOURCE_CODE_URL: z.string().url().default("https://github.com/YOUR_ORG/tuwaiqx")
});

export type TuwaiqXEnv = z.infer<typeof envSchema>;

let cachedEnv: TuwaiqXEnv | undefined;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}

export function getAuthSecret() {
  const env = getEnv();
  if (env.AUTH_SECRET) {
    return env.AUTH_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return "tuwaiqx-development-auth-secret-change-me";
}
