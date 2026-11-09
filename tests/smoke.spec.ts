import { test, expect } from "@playwright/test";

test("landing desk renders core panels", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Cascade Lend", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pool pulse" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Health factor" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Market actions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Liquidate" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Connect wallet|MetaMask|Injected/i })).toBeVisible();
});
