import { expect, test, type Page } from "@playwright/test";

const organizationId = "0199a000-0000-7000-8000-000000000001";
const userId = "0199a000-0000-7000-8000-000000000002";
const runId = "0199a000-0000-7000-8000-000000000003";

async function mockFieldApi(page: Page) {
  const domainEffects = new Set<string>();
  let loseFirstStartResponse = true;
  let interruptFirstUpload = true;

  await page.route("**/mock-field-upload", async (route) => {
    if (interruptFirstUpload) {
      interruptFirstUpload = false;
      await route.abort("connectionreset");
      return;
    }
    await route.fulfill({ status: 200, body: "" });
  });

  await page.route(/\/v1\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/v1/organizations") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: [{ id: organizationId, name: "Lagos Field Network", role: "TECHNICIAN" }],
        }),
      });
      return;
    }
    if (url.pathname === "/v1/sync/field/assignments") {
      const deviceId = url.searchParams.get("deviceId");
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            protocolVersion: 1,
            localSchemaVersion: 1,
            synchronizedAt: "2026-09-30T18:00:00.000Z",
            context: {
              organizationId,
              organizationName: "Lagos Field Network",
              userId,
              memberName: "Field Technician",
              role: "TECHNICIAN",
              deviceId,
            },
            assignments: [
              {
                site: {
                  id: "0199a000-0000-7000-8000-000000000004",
                  name: "Lagos West Solar",
                  address: "Lagos",
                  status: "ACTIVE",
                },
                asset: null,
                snapshot: {
                  id: runId,
                  status: "ASSIGNED",
                  siteId: "0199a000-0000-7000-8000-000000000004",
                  assetId: null,
                  assignedTo: userId,
                  scheduledFor: "2026-09-30T17:00:00.000Z",
                  dueAt: "2026-10-01T17:00:00.000Z",
                  notes: null,
                  responses: [],
                  template: {
                    sections: [
                      {
                        id: "safety",
                        title: "Safety and condition",
                        items: [
                          {
                            id: "isolation",
                            label: "Isolation is secure",
                            responseType: "PASS_FAIL",
                            required: true,
                          },
                          {
                            id: "meter",
                            label: "Meter reading",
                            responseType: "NUMERIC",
                            required: true,
                            minimum: 0,
                            maximum: 1000,
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
        }),
      });
      return;
    }
    if (url.pathname === "/v1/sync/field/commands") {
      const body = request.postDataJSON() as {
        commands: Array<{
          commandId: string;
          idempotencyKey: string;
          type: string;
          inspectionRunId: string;
        }>;
      };
      const command = body.commands[0]!;
      domainEffects.add(`${command.inspectionRunId}:${command.type}`);
      if (command.type === "START_INSPECTION" && loseFirstStartResponse) {
        loseFirstStartResponse = false;
        await route.abort("connectionreset");
        return;
      }
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            protocolVersion: 1,
            results: [
              {
                commandId: command.commandId,
                idempotencyKey: command.idempotencyKey,
                outcome: "SUCCESS",
                code: "COMMAND_APPLIED",
                authoritativeResult: {
                  inspectionRunId: runId,
                  status: command.type === "SUBMIT_INSPECTION" ? "CLOSED" : "IN_PROGRESS",
                  ...(command.type === "AUTHORIZE_EVIDENCE"
                    ? {
                        uploadGrantId: "0199a000-0000-7000-8000-000000000009",
                        uploadUrl: "http://127.0.0.1:3000/mock-field-upload",
                        requiredHeaders: { "content-type": "image/jpeg" },
                        expiresAt: "2026-09-30T18:10:00.000Z",
                      }
                    : {}),
                  acknowledgedAt: "2026-09-30T18:05:00.000Z",
                },
              },
            ],
          },
        }),
      });
      return;
    }
    await route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
  });

  return domainEffects;
}

test("technician reloads offline work and synchronizes authoritative state exactly once", async ({
  page,
}) => {
  const effects = await mockFieldApi(page);
  await page.goto("/field");
  await page.getByRole("button", { name: "Prepare offline" }).click();
  await expect(page.getByText("Assignments are available offline on this device.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lagos West Solar" })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Lagos West Solar" })).toBeVisible();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

  await page.context().setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(page.getByText("Offline", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "PASS" }).click();
  await page.getByLabel("Meter reading *").fill("248");
  await page.getByLabel("Capture or choose inspection photo").setInputFiles({
    name: "isolator.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00]),
  });
  await expect(page.getByText("isolator.jpg")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Confirm local submission" }).click();
  await expect(page.getByText("LOCALLY SUBMITTED").first()).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Lagos West Solar" })).toBeVisible();
  await expect(page.getByText("LOCALLY SUBMITTED").first()).toBeVisible();

  await page.context().setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.getByText("Online", { exact: true })).toBeVisible();
  await page.waitForTimeout(1_200);
  await page.getByRole("button", { name: "Synchronize" }).click();
  await page.waitForTimeout(1_200);
  await page.getByRole("button", { name: "Synchronize" }).click();
  await expect(page.getByText("SYNCHRONIZED", { exact: true }).first()).toBeVisible({
    timeout: 15_000,
  });

  expect([...effects].sort()).toEqual(
    [
      `${runId}:AUTHORIZE_EVIDENCE`,
      `${runId}:FINALIZE_EVIDENCE`,
      `${runId}:SAVE_RESPONSES`,
      `${runId}:START_INSPECTION`,
      `${runId}:SUBMIT_INSPECTION`,
    ].sort(),
  );
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
