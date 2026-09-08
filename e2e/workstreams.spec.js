import { test, expect } from "@playwright/test";
import { createWorkstream, openWorkstream } from "./helpers/workstreams.js";

test.describe("Workstreams workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/map");
    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
  });

  test("lists workstreams in the sidebar", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Add workstream" })).toBeVisible();
    await expect(page.locator("aside").getByRole("link").filter({ hasNotText: /Focus|Tasks|Roadmap|Brainstorm|Admin/ }).first()).toBeVisible();
  });

  test("creates a new workstream", async ({ page }) => {
    const name = `e2e-${Date.now()}`;
    const channel = await createWorkstream(page, name);
    expect(channel.name).toBe(name);
  });

  test("navigates into a workstream from the sidebar", async ({ page }) => {
    const name = `nav-${Date.now()}`;
    const channel = await createWorkstream(page, name);
    await openWorkstream(page, channel);
    await expect(page).toHaveURL(/channel=/);
  });
});
