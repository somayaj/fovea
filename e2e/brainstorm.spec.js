import { test, expect } from "@playwright/test";
import { goToSection } from "./helpers/nav.js";

test.describe("Brainstorm workflow", () => {
  test.beforeEach(async ({ page }) => {
    await goToSection(page, "Brainstorm");
    await expect(page.getByRole("heading", { name: "Ideas" })).toBeVisible();
  });

  test("loads ideas on the canvas", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Idea" })).toBeVisible();
    await expect(page.getByText(/idea/i).first()).toBeVisible();
  });

  test("selects an idea without clearing it on pane click", async ({ page }) => {
    const idea = page.locator(".brainstorm-idea-polaroid").first();
    await idea.click();
    await expect(page.getByRole("button", { name: "Promote to task" })).toBeVisible();
  });

  test("adds a new idea", async ({ page }) => {
    await page.getByRole("button", { name: "Idea" }).click();
    await expect(page.getByRole("button", { name: "Promote to task" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "New idea" })).toBeVisible();
  });

  test("resets the brainstorm view", async ({ page }) => {
    await page.locator(".brainstorm-idea-polaroid").first().click();
    await expect(page.getByRole("button", { name: "Promote to task" })).toBeVisible();
    await page.getByRole("button", { name: "Reset view" }).click();
    await expect(page.getByRole("button", { name: "Promote to task" })).not.toBeVisible();
  });
});
