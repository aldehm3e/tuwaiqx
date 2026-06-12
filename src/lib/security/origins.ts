import { prisma } from "@/src/lib/db/prisma";
import { getEnv } from "@/src/lib/config/env";

function normalizeHost(value: string) {
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return value.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
  }
}

export async function isOriginAllowed(origin: string | null, pageUrl?: string | null) {
  const allowedDomains = await prisma.allowedDomain.findMany();
  const appHost = normalizeHost(getEnv().APP_URL);
  const candidates = [origin, pageUrl].filter(Boolean).map((value) => normalizeHost(value as string));

  if (candidates.some((candidate) => candidate === appHost)) {
    return true;
  }

  if (allowedDomains.length === 0) {
    return true;
  }

  return allowedDomains.some((allowed) => {
    const allowedHost = normalizeHost(allowed.domain);
    return candidates.some((candidate) => candidate === allowedHost || candidate.endsWith(`.${allowedHost}`));
  });
}
