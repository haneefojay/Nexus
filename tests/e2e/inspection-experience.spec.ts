import { expect, test } from "@playwright/test";

async function mockInspectionApi(page: import("@playwright/test").Page) {
  await page.route(/\/v1\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data: Record<string, unknown> = {
      "/v1/organizations": [
        { id: "org-1", name: "Field Operations", role: "OWNER", slug: "field-operations" },
      ],
      "/v1/sites": [
        {
          id: "site-1",
          name: "Lagos West",
          reference: "LG-WEST",
          type: "SOLAR",
          status: "ACTIVE",
          address: "Lagos",
        },
      ],
      "/v1/assets": [
        {
          id: "asset-1",
          identifier: "INV-001",
          name: "Inverter 1",
          siteId: "site-1",
          assetTypeId: "type-1",
          status: "ACTIVE",
          condition: "GOOD",
        },
      ],
      "/v1/asset-types": [],
      "/v1/members": [{ id: "user-1", name: "Field Lead", role: "TECHNICIAN", status: "ACTIVE" }],
      "/v1/inspection-templates": [],
      "/v1/inspection-plans": [],
      "/v1/inspection-runs": [],
      "/v1/inspection-dashboard": {
        summary: { due: 2, overdue: 1, completed_recently: 6 },
        coverage: [
          {
            site_id: "site-1",
            site_name: "Lagos West",
            required: 8,
            completed: 6,
            overdue: 1,
          },
        ],
      },
    };
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: data[path] ?? [] }),
    });
  });
}

async function enterAuthenticatedShell(page: import("@playwright/test").Page) {
  await page.goto("/app");
  await expect(page.getByRole("navigation", { name: "Operations" })).toBeAttached();
}

test("authenticated inspection authoring and dashboard are keyboard accessible", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop keyboard workflow");
  await mockInspectionApi(page);
  await enterAuthenticatedShell(page);
  await page.getByRole("button", { name: "Inspection dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Coverage and attention" })).toBeVisible();
  await expect(page.getByText("75%")).toBeVisible();
  const templates = page.getByRole("button", { name: "Templates" });
  await templates.focus();
  await expect(templates).toBeFocused();
  await templates.click();
  await expect(page.getByRole("heading", { name: "Inspection templates" })).toBeVisible();
  await expect(page.getByLabel("Question 1 label")).toBeVisible();
  await expect(page.getByRole("button", { name: /Publish template/ })).toBeVisible();
});

test("mobile inspection views avoid overflow and expose semantic navigation", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile-specific layout assertion");
  await mockInspectionApi(page);
  await enterAuthenticatedShell(page);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Inspection runs" }).click();
  await expect(page.getByRole("heading", { name: "Inspection runs" })).toBeVisible();
  await expect(page.getByText(/No runs yet/)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
