import { test, expect } from "@playwright/test";
import { devLogin } from "./helpers/auth.js";

test.describe("Authentication", () => {
  test("shows the login page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with local account" })).toBeVisible();
  });

  test("signs in with the local dev account", async ({ page }) => {
    await devLogin(page);
    await expect(page.getByRole("heading", { name: "Your focus" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Focus", exact: true }).first()).toBeVisible();
  });

  test("signs out and returns to login", async ({ page }) => {
    await devLogin(page);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});
