import { test, expect } from "@playwright/test";
import { goToSection } from "./helpers/nav.js";
import { createWorkstream, openWorkstream } from "./helpers/workstreams.js";

test.describe("Tasks workflow", () => {
  test.beforeEach(async ({ page }) => {
    await goToSection(page, "Tasks");
    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
  });

  test("loads the task map view", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Map" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Board" })).toBeVisible();
  });

  test("opens a task panel from board view", async ({ page }) => {
    await page.getByRole("button", { name: "Board" }).click();
    await page.locator(".priority-board-row").first().click();
    await expect(page.getByRole("button", { name: /Mark complete|Mark incomplete/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Close panel" })).toBeVisible();
  });

  test("marks a task complete from board view", async ({ page }) => {
    await page.getByRole("button", { name: "Board" }).click();
    await page.locator(".priority-board-row").first().click();

    const completeButton = page.getByRole("button", { name: "Mark complete" });
    if (await completeButton.isVisible()) {
      await completeButton.click();
      await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();
    }
  });

  test("switches between map, week, and board views", async ({ page }) => {
    await page.getByRole("button", { name: "Board" }).click();
    await expect(page.getByText("Sorted by priority", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Week" }).click();
    await expect(page.getByText(/highlighted for this week|No week focus yet/)).toBeVisible();

    await page.getByRole("button", { name: "Map" }).click();
    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
  });

  test("creates a new task", async ({ page }) => {
    const title = `E2E task ${Date.now()}`;

    await page.getByRole("button", { name: "Task" }).click();
    await page.getByRole("textbox", { name: "Task title" }).fill(title);
    await page.getByRole("button", { name: "Add task" }).click();

    await page.getByRole("button", { name: "Board" }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  });

  test("filters tasks by workstream", async ({ page }) => {
    const name = `filter-${Date.now()}`;
    const channel = await createWorkstream(page, name);
    await openWorkstream(page, channel);
    await expect(page).toHaveURL(/channel=/);
  });
});
