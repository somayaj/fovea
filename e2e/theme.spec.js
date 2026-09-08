import { test, expect } from "@playwright/test";

test.describe("Theme workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Your focus" })).toBeVisible();
  });

  test("changes the color theme", async ({ page }) => {
    await page.getByRole("button", { name: /Themes/ }).click();

    const sage = page.getByRole("button", { name: "Sage", exact: true });
    await expect(sage).toBeVisible();
    await sage.click();
    await expect(sage).toHaveAttribute("aria-pressed", "true");
  });
});
