import { expect, test } from "@playwright/test";

test("map failures are presented in the UI instead of becoming unhandled rejections", async ({
  page,
}, testInfo) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.route(/\/v1\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data: Record<string, unknown> = {
      "/v1/organizations": [
        { id: "org-1", name: "Fictional Operations", role: "OWNER", slug: "fictional" },
      ],
      "/v1/sites": [],
      "/v1/assets": [],
      "/v1/asset-types": [],
      "/v1/members": [],
    };
    if (path === "/v1/map/assets") {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "MAP_UNAVAILABLE",
            message: "Map service temporarily unavailable",
          },
        }),
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: data[path] ?? [] }),
    });
  });

  await page.goto("/app");
  if (testInfo.project.name.includes("mobile"))
    await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Network map" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Map service temporarily unavailable (503 · MAP_UNAVAILABLE)",
  );
  expect(pageErrors).toEqual([]);
});
