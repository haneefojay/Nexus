import { expect, test } from "@playwright/test";

async function mockReportingApi(page: import("@playwright/test").Page) {
  let reportRequested = false;
  let exportRequested = false;
  let reportPosts = 0;
  await page.route(/\/v1\//, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === "POST" && path === "/v1/inspection-runs/run-1/reports") {
      reportRequested = true;
      reportPosts += 1;
    }
    if (request.method() === "POST" && path === "/v1/exports") exportRequested = true;
    const data: Record<string, unknown> = {
      "/v1/organizations": [
        { id: "org-1", name: "Fictional Operations", role: "OWNER", slug: "fictional" },
      ],
      "/v1/sites": [],
      "/v1/assets": [],
      "/v1/asset-types": [],
      "/v1/members": [],
      "/v1/inspection-runs": [
        { id: "run-1", status: "SUBMITTED", scheduledFor: "2026-09-30T12:00:00.000Z" },
      ],
      "/v1/inspection-runs/run-1/reports": reportRequested
        ? [
            {
              id: "report-1",
              status: "COMPLETED",
              errorCode: null,
              createdAt: "2026-09-30T12:05:00.000Z",
              completedAt: "2026-09-30T12:06:00.000Z",
              expiresAt: "2026-10-30T12:06:00.000Z",
            },
          ]
        : [],
      "/v1/exports": exportRequested
        ? [
            {
              id: "export-1",
              exportType: "ASSETS",
              status: "COMPLETED",
              rowCount: 10,
              createdAt: "2026-09-30T12:05:00.000Z",
            },
          ]
        : [],
    };
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: data[path] ?? [] }),
    });
  });
  return { reportPostCount: () => reportPosts };
}

test("report and export controls expose authoritative state without duplicate report effects", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop action workflow");
  const state = await mockReportingApi(page);
  await page.goto("/app");
  await page.getByRole("button", { name: "Reports & exports" }).click();
  await expect(page.getByRole("heading", { name: "Inspection reports" })).toBeVisible();
  const reportButton = page.getByRole("button", { name: "Request PDF" });
  await reportButton.click();
  await expect(page.getByRole("button", { name: "Download PDF" })).toBeVisible();
  expect(state.reportPostCount()).toBe(1);
  await page.getByRole("button", { name: "Request CSV" }).click();
  await expect(page.getByRole("button", { name: "Download CSV" })).toBeVisible();
  await expect(page.getByRole("table").first()).toBeVisible();
});

test("reporting experience reflows on mobile", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile-specific assertion");
  await mockReportingApi(page);
  await page.goto("/app");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Reports & exports" }).click();
  await expect(page.getByRole("heading", { name: "Operational CSV exports" })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
});
