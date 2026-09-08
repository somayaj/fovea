import { test, expect } from "@playwright/test";
import { devLogin } from "./helpers/auth.js";
import { goToMobileSection } from "./helpers/nav.js";

test.describe("Mobile shell workflow (public)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("shows mobile login layout", async ({ page }) => {
    await page.goto("/?mobile=1");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByText("Focus on the")).toBeVisible();
  });

  test("signs in and navigates with the tab bar", async ({ page }) => {
    await page.goto("/?mobile=1");
    await devLogin(page, "/?mobile=1");

    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();

    await goToMobileSection(page, "Tasks");
    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();

    await goToMobileSection(page, "Brainstorm");
    await expect(page.getByRole("heading", { name: "Ideas" })).toBeVisible();

    await goToMobileSection(page, "Focus");
    await expect(page.getByRole("heading", { name: "Your focus" })).toBeVisible();
  });
});

test.describe("Mobile shell workflow (authenticated)", () => {
  test("opens and closes the mobile menu", async ({ page }) => {
    await page.goto("/?mobile=1");
    await expect(page.getByRole("heading", { name: "Your focus" })).toBeVisible();

    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.locator("aside").getByRole("button", { name: "Close menu" })).toBeVisible();
    await expect(page.locator("aside").getByRole("link").first()).toBeVisible();

    await page.locator("aside").getByRole("button", { name: "Close menu" }).click();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  });
});
