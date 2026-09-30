import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
async function noBlockers(page: import("@playwright/test").Page) {
  const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze(),
    b = r.violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""));
  expect(b, b.map((v) => `${v.id}: ${v.help}`).join("\n")).toEqual([]);
}
async function mock(page: import("@playwright/test").Page) {
  await page.route(/\/v1\//, async (route) => {
    const p = new URL(route.request().url()).pathname,
      d: Record<string, unknown> = {
        "/v1/organizations": [
          { id: "o", name: "Fictional Accessible", role: "OWNER", slug: "a11y" },
        ],
        "/v1/sites": [],
        "/v1/assets": [],
        "/v1/asset-types": [],
        "/v1/members": [],
        "/v1/inspection-runs": [],
        "/v1/exports": [],
      };
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: d[p] ?? [] }),
    });
  });
}
test("public and auth WCAG blockers", async ({ page }) => {
  await page.goto("/");
  await noBlockers(page);
  await page.goto("/signin");
  await noBlockers(page);
});
test("authenticated and reporting WCAG blockers", async ({ page }) => {
  await mock(page);
  await page.goto("/app");
  await expect(page.getByRole("navigation", { name: "Operations" })).toBeAttached();
  await noBlockers(page);
  if (await page.getByRole("button", { name: "Open menu" }).isVisible())
    await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Reports & exports" }).click();
  await noBlockers(page);
});
