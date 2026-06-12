import { expect, test } from "@playwright/test";

test("admin setup page renders", async ({ page }) => {
  await page.goto("/admin/setup");
  await expect(page.getByRole("heading", { name: "Set up TuwaiqX" })).toBeVisible();
});

test("health endpoint responds", async ({ request }) => {
  const response = await request.get("/api/version");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ name: "TuwaiqX" });
});

