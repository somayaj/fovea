import { test, expect } from "@playwright/test";

test.describe("Legal pages", () => {
  test("privacy policy is public", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
    await expect(page.getByText("We do not sell your information")).toBeVisible();
  });

  test("license page is public", async ({ page }) => {
    await page.goto("/license");
    await expect(page.getByRole("heading", { name: "MIT License" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Provided as is" })).toBeVisible();
  });
});
