import { test, expect } from "@playwright/test";
import { goToSection } from "./helpers/nav.js";

test.describe("Admin workflow", () => {
  test("shows the admin dashboard for the dev admin user", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Users & tasks" })).toBeVisible();
    await expect(page.getByText("Logged in")).toBeVisible();
  });

  test("reveals a user row in admin", async ({ page }) => {
    await page.goto("/admin");
    const reveal = page.getByRole("button", { name: "Reveal" }).first();
    await expect(reveal).toBeVisible();
    await reveal.click();
    await expect(page.locator(".admin-email.is-open")).toHaveText("you@localhost");
  });

  test("links to admin from the sidebar", async ({ page }) => {
    await page.goto("/");
    await goToSection(page, "Admin");
    await expect(page.getByRole("heading", { name: "Users & tasks" })).toBeVisible();
  });
});
