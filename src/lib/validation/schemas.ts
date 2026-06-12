import { z } from "zod";

export const setupSchema = z.object({
  adminEmail: z.string().email(),
  adminName: z.string().min(1).max(120).optional().or(z.literal("")),
  adminPassword: z.string().min(10),
  organizationName: z.string().min(2).max(180),
  websiteUrl: z.string().url(),
  defaultLanguage: z.string().min(2).max(12).default("en"),
  defaultDirection: z.enum(["ltr", "rtl"]).default("ltr"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0f7b55"),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#2563eb"),
  allowedDomains: z.string().optional().default(""),
  ollamaBaseUrl: z.string().url().default("http://ollama:11434"),
  ollamaChatModel: z.string().min(1).default("llama3.1"),
  ollamaEmbeddingModel: z.string().min(1).default("nomic-embed-text")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const settingsSchema = z.object({
  organizationName: z.string().min(2).max(180),
  websiteUrl: z.string().url(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  faviconUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  defaultLanguage: z.string().min(2).max(12),
  defaultDirection: z.enum(["ltr", "rtl"]),
  supportEmail: z.string().email().optional().or(z.literal("")),
  sourceCodeUrl: z.string().url(),
  privacyPolicyUrl: z.string().url().optional().or(z.literal("")),
  termsUrl: z.string().url().optional().or(z.literal("")),
  allowedDomains: z.string().optional().default(""),
  dataRetentionDays: z.coerce.number().int().min(1).max(3650).default(365)
});

export const providerSchema = z.object({
  name: z.string().min(2).max(120),
  type: z.enum(["OLLAMA", "OPENAI_COMPATIBLE", "MOCK"]),
  baseUrl: z.string().url().optional().or(z.literal("")),
  apiKey: z.string().optional().or(z.literal("")),
  chatModel: z.string().optional().or(z.literal("")),
  embeddingModel: z.string().optional().or(z.literal("")),
  isDefaultChat: z.coerce.boolean().default(false),
  isDefaultEmbedding: z.coerce.boolean().default(false),
  isEnabled: z.coerce.boolean().default(true)
});

export const botSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(160),
  description: z.string().optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  welcomeMessage: z.string().min(1).max(500),
  fallbackMessage: z.string().min(1).max(500),
  systemPrompt: z.string().min(1).max(4000),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  language: z.string().min(2).max(12),
  direction: z.enum(["ltr", "rtl"]),
  strictMode: z.coerce.boolean().default(true),
  showSources: z.coerce.boolean().default(true),
  allowGeneralAnswer: z.coerce.boolean().default(false),
  maxAnswerLength: z.coerce.number().int().min(100).max(4000).default(800),
  temperature: z.coerce.number().min(0).max(2).default(0.2),
  modelProviderId: z.string().optional().or(z.literal("")),
  embeddingProviderId: z.string().optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
  position: z.enum(["bottom-right", "bottom-left"]).default("bottom-right"),
  quickActions: z.string().optional().default("")
});

export const manualKnowledgeSchema = z.object({
  botId: z.string().optional().or(z.literal("")),
  title: z.string().min(2).max(200),
  content: z.string().min(2),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  tags: z.string().optional().default(""),
  approved: z.coerce.boolean().default(true),
  sourceType: z.enum(["manual", "faq"]).default("manual"),
  question: z.string().optional().or(z.literal(""))
});

export const crawlerSchema = z.object({
  botId: z.string().optional().or(z.literal("")),
  url: z.string().url(),
  depth: z.coerce.number().int().min(0).max(3).default(1),
  sameDomain: z.coerce.boolean().default(true),
  approved: z.coerce.boolean().default(true)
});

export const chatSchema = z.object({
  botId: z.string().min(1),
  conversationId: z.string().optional(),
  visitorId: z.string().optional(),
  message: z.string().min(1).max(4000),
  pageUrl: z.string().url().optional()
});

export const ticketSchema = z.object({
  conversationId: z.string().optional().or(z.literal("")),
  botId: z.string().optional().or(z.literal("")),
  requesterName: z.string().optional().or(z.literal("")),
  requesterEmail: z.string().email().optional().or(z.literal("")),
  requesterPhone: z.string().optional().or(z.literal("")),
  subject: z.string().min(2).max(200),
  message: z.string().min(2).max(4000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal")
});

export const formSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(160),
  description: z.string().optional().or(z.literal("")),
  submitLabel: z.string().min(1).max(80).default("Submit"),
  botId: z.string().optional().or(z.literal("")),
  webhookUrl: z.string().url().optional().or(z.literal("")),
  emailNotification: z.string().email().optional().or(z.literal(""))
});

