import AxeBuilder from "@axe-core/playwright";
import { devices, expect, test, type Page } from "@playwright/test";

const enabled = process.env.RELEASE_FULL_STACK === "1";
const apiUrl = "http://localhost:3001";
const organizationId = "0199abcd-0000-7000-8000-000000000002";
const runId = "0199abcd-0000-7000-8000-000000000009";

test.skip(!enabled, "Runs only against the release-candidate stack.");

async function api<T>(page: Page, path: string, init: RequestInit = {}): Promise<T> {
  return page.evaluate(
    async ({ apiUrl, path, init, organizationId }) => {
      const headers = new Headers(init.headers);
      headers.set("x-organization-id", organizationId);
      if (init.body) headers.set("content-type", "application/json");
      const response = await fetch(`${apiUrl}${path}`, {
        ...init,
        headers,
        credentials: "include",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`);
      return body;
    },
    { apiUrl, path, init, organizationId },
  ) as Promise<T>;
}

async function waitForCompleted<T extends { id: string; status: string }>(
  page: Page,
  path: string,
  id: string,
): Promise<T> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const response = await api<{ data: T[] }>(page, path);
    const item = response.data.find((candidate) => candidate.id === id);
    if (item?.status === "COMPLETED") return item;
    if (item?.status === "FAILED") throw new Error(`${path} ${id} failed`);
    await page.waitForTimeout(250);
  }
  throw new Error(`${path} ${id} did not complete`);
}

async function assertNoSeriousViolations(page: Page): Promise<void> {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    result.violations.filter((violation) =>
      ["critical", "serious"].includes(violation.impact ?? ""),
    ),
  ).toEqual([]);
}

test("real RC signs in, produces truthful artifacts, works offline, and passes axe", async ({
  browser,
  page,
}) => {
  await page.goto("/signin");
  await page.getByLabel("Email").fill("demo.owner@nexus.invalid");
  await page.getByLabel("Password").fill("fictional-local-password");
  await page.getByRole("button", { name: "Open NEXUS" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("navigation", { name: "Operations" })).toBeVisible();
  await assertNoSeriousViolations(page);

  const report = await api<{ data: { id: string } }>(page, `/v1/inspection-runs/${runId}/reports`, {
    method: "POST",
  });
  await waitForCompleted(page, `/v1/inspection-runs/${runId}/reports`, report.data.id);
  const reportDownload = await api<{ data: { downloadUrl: string } }>(
    page,
    `/v1/reports/${report.data.id}/download`,
  );
  const pdf = await page.context().request.get(reportDownload.data.downloadUrl);
  expect(pdf.ok()).toBeTruthy();
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");

  const createdExport = await api<{ data: { id: string } }>(page, "/v1/exports", {
    method: "POST",
    body: JSON.stringify({ exportType: "ASSETS" }),
  });
  await waitForCompleted(page, "/v1/exports", createdExport.data.id);
  const exportDownload = await api<{ data: { downloadUrl: string } }>(
    page,
    `/v1/exports/${createdExport.data.id}/download`,
  );
  const csv = await page.context().request.get(exportDownload.data.downloadUrl);
  expect(csv.ok()).toBeTruthy();
  expect(await csv.text()).toContain("identifier");

  await page.goto("/field");
  await page.getByRole("button", { name: "Prepare offline" }).click();
  await expect(page.getByText("Assignments are available offline on this device.")).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.context().setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(page.getByText("Offline", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Inspection field kit" })).toBeVisible();
  await page.context().setOffline(false);

  const mobileContext = await browser.newContext({
    ...devices["Pixel 7"],
    storageState: await page.context().storageState(),
  });
  const mobile = await mobileContext.newPage();
  await mobile.goto("/app");
  await expect(mobile.getByRole("navigation", { name: "Operations" })).toBeAttached();
  await assertNoSeriousViolations(mobile);
  expect(
    await mobile.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
  await mobileContext.close();
});
