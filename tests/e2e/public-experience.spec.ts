import { expect, test } from "@playwright/test";

test("marketing and authentication entry points remain keyboard-accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /See the infrastructure/i })).toBeVisible();
  const menu = page.getByRole("button", { name: "Open menu" });
  if (await menu.isVisible()) {
    await menu.focus();
    await expect(menu).toBeFocused();
    await page.goto("/signin");
  } else {
    const signIn = page.getByRole("link", { name: /Sign in/i });
    await signIn.focus();
    await expect(signIn).toBeFocused();
    await signIn.click();
  }
  await expect(page.getByRole("heading", { name: "Enter the network." })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});

test("mobile sign-in composition avoids horizontal overflow", async ({ page }) => {
  await page.goto("/signin");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
