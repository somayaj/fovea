import { expect } from "@playwright/test";

export async function devLogin(page, path = "/") {
  await page.goto(path);
  const loginButton = page.getByRole("button", { name: "Continue with local account" });
  await expect(loginButton).toBeVisible();
  await loginButton.click();
  await expect(page.getByRole("heading", { name: "Your focus" })).toBeVisible();
}

export async function persistAuthState(page, path) {
  await page.evaluate(() => {
    localStorage.setItem("fovea.mapGuide.dismissed", "1");
    localStorage.setItem("fovea.sidebar.collapsed", "0");
  });
  await page.context().storageState({ path });
}
