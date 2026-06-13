import { beforeEach, describe, expect, it, vi } from "vitest";

const allowedDomains = vi.hoisted(() => ({
  rows: [] as Array<{ domain: string }>
}));

vi.mock("@/src/lib/db/prisma", () => ({
  prisma: {
    allowedDomain: {
      findMany: vi.fn(async () => allowedDomains.rows)
    }
  }
}));

vi.mock("@/src/lib/config/env", () => ({
  getEnv: () => ({ APP_URL: "https://bot.example.org" })
}));

import { isOriginAllowed } from "../src/lib/security/origins";

describe("isOriginAllowed", () => {
  beforeEach(() => {
    allowedDomains.rows = [{ domain: "trusted.org" }];
  });

  it("does not let pageUrl override a disallowed Origin header", async () => {
    await expect(isOriginAllowed("https://evil.org", "https://trusted.org/page")).resolves.toBe(false);
  });

  it("allows a configured Origin header", async () => {
    await expect(isOriginAllowed("https://www.trusted.org", "https://evil.org/page")).resolves.toBe(true);
  });

  it("can use pageUrl when no Origin header exists", async () => {
    await expect(isOriginAllowed(null, "https://trusted.org/page")).resolves.toBe(true);
  });
});
