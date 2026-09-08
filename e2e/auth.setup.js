import { test as setup } from "@playwright/test";
import { devLogin, persistAuthState } from "./helpers/auth.js";

setup("authenticate with local dev account", async ({ page }) => {
  await devLogin(page);
  await persistAuthState(page, "e2e/.auth/user.json");
});
