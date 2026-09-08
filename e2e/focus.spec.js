import { test, expect } from "@playwright/test";
import { goToSection } from "./helpers/nav.js";

test.describe("Focus workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads the weekly focus page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Your focus" })).toBeVisible();
    await expect(page.getByText("Your top task front and center")).toBeVisible();
  });

  test("shows weekly recap section", async ({ page }) => {
    await expect(page.getByRole("region", { name: "Weekly recap" })).toBeVisible();
  });

  test("links to all tasks from focus", async ({ page }) => {
    await page.getByRole("link", { name: "All tasks" }).first().click();
    await expect(page).toHaveURL(/\/map/);
    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
  });

  test("can browse another week and return", async ({ page }) => {
    const nextWeek = page.getByRole("button", { name: "Next week" });
    if (await nextWeek.isVisible()) {
      await nextWeek.click();
      await expect(page).toHaveURL(/week=/);
      await page.locator(".page-header-toolbar").getByRole("button", { name: "This week" }).click();
      await expect(page).not.toHaveURL(/week=/);
    }
  });
});
