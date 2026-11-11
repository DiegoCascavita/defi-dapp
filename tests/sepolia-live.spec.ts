import { test, expect } from "@playwright/test";

test("Sepolia live banner when NETWORK=sepolia", async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_NETWORK !== "sepolia", "Requires NEXT_PUBLIC_NETWORK=sepolia");
  await page.goto("/");
  await expect(page.locator(".brand-sub")).toContainText("Sepolia");
  await expect(page.locator(".brand-sub")).toContainText("11155111");
  await expect(page.getByRole("status")).toContainText("Sepolia live");
  await expect(page.getByRole("status")).toContainText("0x732D");
  await expect(page.getByRole("button", { name: /Mint 10 WETH/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Anvil account/i })).toHaveCount(0);
});
