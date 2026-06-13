import { prisma } from "@/src/lib/db/prisma";
import { getEnv } from "@/src/lib/config/env";

function normalizeHost(value: string) {
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(value)) {
    try {
      return new URL(value).host.toLowerCase();
    } catch {
      return "";
    }
  }

  return value.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
}

function hostParts(value: string) {
  const host = normalizeHost(value);
  const ipv6 = host.match(/^\[([^\]]+)\](?::(\d+))?$/);
  if (ipv6) {
    return { hostname: ipv6[1].toLowerCase(), port: ipv6[2] || "" };
  }

  const [hostname, port = ""] = host.split(":");
  return { hostname, port };
}

function isLoopback(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function isSameLoopback(candidate: string, appHost: string) {
  const candidateParts = hostParts(candidate);
  const appParts = hostParts(appHost);
  return (
    isLoopback(candidateParts.hostname) &&
    isLoopback(appParts.hostname) &&
    candidateParts.port === appParts.port
  );
}

export async function isOriginAllowed(origin: string | null, pageUrl?: string | null) {
  const allowedDomains = await prisma.allowedDomain.findMany();
  const appHost = normalizeHost(getEnv().APP_URL);
  const candidates = [origin, pageUrl].filter(Boolean).map((value) => normalizeHost(value as string));

  if (candidates.some((candidate) => candidate === appHost)) {
    return true;
  }

  if (candidates.some((candidate) => isSameLoopback(candidate, appHost))) {
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
