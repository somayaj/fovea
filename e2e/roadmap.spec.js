import { test, expect } from "@playwright/test";
import { goToSection } from "./helpers/nav.js";

test.describe("Roadmap workflow", () => {
  test.beforeEach(async ({ page }) => {
    await goToSection(page, "Roadmap");
    await expect(page.getByRole("main").getByText("Roadmap")).toBeVisible();
  });

  test("loads the year calendar view", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Year", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous year" })).toBeVisible();
  });

  test("switches to month view", async ({ page }) => {
    await page.getByRole("button", { name: "Month", exact: true }).click();
    await expect(page.getByRole("button", { name: "Previous month" })).toBeVisible();
  });

  test("switches to timeline view", async ({ page }) => {
    await page.getByRole("button", { name: "Timeline", exact: true }).click();
    await expect(page.getByText(/No scheduled tasks for|ship|design/i)).toBeVisible();
  });
});
