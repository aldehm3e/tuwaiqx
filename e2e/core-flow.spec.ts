import { expect, test } from "@playwright/test";

test("admin entry renders", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveTitle(/TuwaiqX Admin/);
  await expect(page.locator("body")).toContainText(/Set up TuwaiqX|Admin login|Dashboard/);
});

test("health endpoint responds", async ({ request }) => {
  const response = await request.get("/api/version");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ name: "TuwaiqX" });
});
