import { expect, test } from "@playwright/test";

async function mockApi(page: import("@playwright/test").Page) {
  await page.route(/\/v1\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data: Record<string, unknown> = {
      "/v1/organizations": [
        { id: "org-1", name: "Field Operations", role: "OWNER", slug: "field-operations" },
      ],
      "/v1/sites": [],
      "/v1/assets": [],
      "/v1/asset-types": [],
      "/v1/members": [{ id: "user-1", name: "Field Lead", role: "TECHNICIAN", status: "ACTIVE" }],
      "/v1/findings": [
        {
          id: "finding-1",
          title: "Inverter isolator failed",
          severity: "CRITICAL",
          status: "OPEN",
          siteId: "site-1",
          assetId: "asset-1",
          detectedAt: "2026-09-30T12:00:00.000Z",
        },
      ],
      "/v1/actions": [],
      "/v1/actions/eligible-assignees": [{ id: "user-1", name: "Field Lead", role: "TECHNICIAN" }],
    };
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: data[path] ?? [] }),
    });
  });
}

test("finding triage exposes semantic filters and action controls", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop lifecycle assertion");
  await mockApi(page);
  await page.goto("/app");
  await page.getByRole("button", { name: "Findings & actions" }).click();
  await expect(page.getByRole("heading", { name: "Finding queue" })).toBeVisible();
  await expect(page.getByLabel("Filter finding status")).toBeVisible();
  await page.getByRole("button", { name: /Inverter isolator failed/ }).click();
  await expect(page.getByRole("button", { name: "Acknowledge" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create corrective action" })).toBeVisible();
});

test("mobile finding queue remains bounded and keyboard controls remain visible", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile lifecycle assertion");
  await mockApi(page);
  await page.goto("/app");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Findings & actions" }).click();
  await expect(page.getByRole("heading", { name: "Finding queue" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
