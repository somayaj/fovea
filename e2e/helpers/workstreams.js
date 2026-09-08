import { expect } from "@playwright/test";

export async function createWorkstream(page, name) {
  await page.getByRole("button", { name: "Add workstream" }).click();
  await page.getByPlaceholder("e.g. ship, design, ops").fill(name);
  const responsePromise = page.waitForResponse(
    (resp) => resp.url().includes("/channels") && resp.request().method() === "POST" && resp.ok(),
  );
  await page.getByRole("button", { name: "Create" }).click();
  const response = await responsePromise;
  const { channel } = await response.json();
  return channel;
}

export async function openWorkstream(page, channel) {
  await page.goto(`/map?channel=${channel.id}`);
  await expect(page.getByRole("main").getByRole("heading", { name: channel.name })).toBeVisible();
}
