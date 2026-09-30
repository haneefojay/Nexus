import { createHash } from "node:crypto";

import {
  activityEvents,
  and,
  assets,
  eq,
  fieldDevices,
  fieldRunDevices,
  fieldSyncCommands,
  inspectionRuns,
  isNull,
  or,
  sites,
  type createDatabase,
} from "@nexus/database";
import type {
  FieldAssignmentQueryInput,
  FieldSyncBatchInput,
  FieldSyncCommandInput,
} from "@nexus/validation";
import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { TenantContext } from "../context/request-context.service.js";
import { EvidenceService } from "../evidence/evidence.service.js";
import { InspectionsService } from "../inspections/inspections.service.js";

type SyncOutcome =
  "SUCCESS" | "RETRYABLE_FAILURE" | "PERMANENT_FAILURE" | "AUTHENTICATION_FAILURE" | "CONFLICT";

export interface CommandResult {
  commandId: string;
  idempotencyKey: string;
  outcome: SyncOutcome;
  code: string;
  authoritativeResult?: unknown;
  retryAfterMs?: number;
}

@Injectable()
export class FieldSyncService {
  constructor(
    private readonly db: ReturnType<typeof createDatabase>["db"],
    private readonly inspections: InspectionsService,
    private readonly evidence: EvidenceService,
  ) {}

  async assignments(context: TenantContext, input: FieldAssignmentQueryInput) {
    await this.ensureDevice(context, input.deviceId, input.deviceLabel);
    const summaries = await this.inspections.listRuns(context);
    const eligible = summaries.filter(
      (run) =>
        run.assignedTo === context.userId &&
        ["ASSIGNED", "READY", "IN_PROGRESS"].includes(run.status),
    );
    const assignments = await Promise.all(
      eligible.map(async (summary) => {
        const snapshot = await this.inspections.getRun(context, summary.id);
        const [site] = await this.db
          .select({
            id: sites.id,
            name: sites.name,
            reference: sites.reference,
            type: sites.type,
            status: sites.status,
            address: sites.address,
          })
          .from(sites)
          .where(
            and(eq(sites.id, snapshot.siteId), eq(sites.organizationId, context.organizationId)),
          );
        const [asset] = snapshot.assetId
          ? await this.db
              .select({
                id: assets.id,
                name: assets.name,
                identifier: assets.identifier,
                status: assets.status,
                condition: assets.condition,
              })
              .from(assets)
              .where(
                and(
                  eq(assets.id, snapshot.assetId),
                  eq(assets.organizationId, context.organizationId),
                ),
              )
          : [];
        return { snapshot, site, asset: asset ?? null };
      }),
    );

    return {
      protocolVersion: 1,
      localSchemaVersion: 1,
      synchronizedAt: new Date().toISOString(),
      context: {
        organizationId: context.organizationId,
        organizationName: context.organizationName,
        userId: context.userId,
        memberName: context.name,
        role: context.role,
        deviceId: input.deviceId,
      },
      assignments,
    };
  }

  async synchronize(context: TenantContext, input: FieldSyncBatchInput) {
    await this.ensureDevice(context, input.deviceId);
    const results: CommandResult[] = [];
    const commands = [...input.commands].sort(
      (left, right) =>
        left.sequence - right.sequence || left.commandId.localeCompare(right.commandId),
    );

    for (const command of commands) {
      if (
        command.deviceId !== input.deviceId ||
        command.organizationId !== context.organizationId ||
        command.userId !== context.userId
      ) {
        results.push(
          await this.persistResult(context, command, {
            outcome: "PERMANENT_FAILURE",
            code: "COMMAND_CONTEXT_MISMATCH",
          }),
        );
        continue;
      }

      const replay = await this.findReplay(context, command);
      if (replay) {
        results.push(replay);
        continue;
      }

      if (!(await this.dependenciesSucceeded(context, command))) {
        results.push(
          await this.persistResult(context, command, {
            outcome: "PERMANENT_FAILURE",
            code: "COMMAND_DEPENDENCY_UNAVAILABLE",
          }),
        );
        continue;
      }

      try {
        await this.assertEligibleTarget(context, command);
        await this.bindRun(context, command.inspectionRunId, command.deviceId);
        const authoritativeResult = await this.execute(context, command);
        results.push(
          await this.persistResult(context, command, {
            outcome: "SUCCESS",
            code: "COMMAND_APPLIED",
            authoritativeResult: {
              ...asRecord(authoritativeResult),
              acknowledgedAt: new Date().toISOString(),
            },
          }),
        );
      } catch (error) {
        results.push(await this.persistResult(context, command, classify(error)));
      }
    }

    return { protocolVersion: 1, results };
  }

  private async execute(context: TenantContext, command: FieldSyncCommandInput) {
    switch (command.type) {
      case "START_INSPECTION": {
        const current = await this.inspections.getRun(context, command.inspectionRunId);
        const result =
          current.status === "IN_PROGRESS"
            ? current
            : await this.inspections.startRun(context, command.inspectionRunId);
        await this.db
          .update(inspectionRuns)
          .set({
            startedOffline: true,
            clientDeviceId: command.deviceId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(inspectionRuns.id, command.inspectionRunId),
              eq(inspectionRuns.organizationId, context.organizationId),
            ),
          );
        return { inspectionRunId: command.inspectionRunId, status: result.status };
      }
      case "SAVE_RESPONSES": {
        const result = await this.inspections.saveResponses(
          context,
          command.inspectionRunId,
          command.payload,
        );
        return { inspectionRunId: command.inspectionRunId, status: result.status };
      }
      case "AUTHORIZE_EVIDENCE": {
        if (command.payload.targetId !== command.inspectionRunId)
          throw new ForbiddenException("Evidence target does not match the synchronized run");
        // The short-lived URL is returned to the active processor but is never logged by this service.
        return this.evidence.authorize(context, command.payload);
      }
      case "FINALIZE_EVIDENCE":
        return this.evidence.finalize(context, command.payload);
      case "SUBMIT_INSPECTION": {
        const current = await this.inspections.getRun(context, command.inspectionRunId);
        const result = ["SUBMITTED", "REVIEW_REQUIRED", "APPROVED", "CLOSED"].includes(
          current.status,
        )
          ? current
          : await this.inspections.submitRun(context, command.inspectionRunId);
        await this.db
          .update(inspectionRuns)
          .set({
            submittedOffline: true,
            clientDeviceId: command.deviceId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(inspectionRuns.id, command.inspectionRunId),
              eq(inspectionRuns.organizationId, context.organizationId),
            ),
          );
        return { inspectionRunId: command.inspectionRunId, status: result.status };
      }
    }
  }

  private async ensureDevice(context: TenantContext, deviceId: string, label?: string) {
    const [existing] = await this.db
      .select()
      .from(fieldDevices)
      .where(eq(fieldDevices.id, deviceId))
      .limit(1);
    if (existing) {
      if (existing.organizationId !== context.organizationId || existing.userId !== context.userId)
        throw new NotFoundException("Field device not found");
      if (existing.status !== "ACTIVE") throw new ForbiddenException("Field device is unavailable");
      await this.db
        .update(fieldDevices)
        .set({ lastSeenAt: new Date(), updatedAt: new Date(), ...(label ? { label } : {}) })
        .where(eq(fieldDevices.id, deviceId));
      return;
    }
    await this.db.insert(fieldDevices).values({
      id: deviceId,
      organizationId: context.organizationId,
      userId: context.userId,
      label,
    });
  }

  private async assertEligibleTarget(
    context: TenantContext,
    command: FieldSyncCommandInput,
  ): Promise<void> {
    const [run] = await this.db
      .select({
        assignedTo: inspectionRuns.assignedTo,
        status: inspectionRuns.status,
        siteStatus: sites.status,
        assetStatus: assets.status,
      })
      .from(inspectionRuns)
      .innerJoin(
        sites,
        and(
          eq(sites.id, inspectionRuns.siteId),
          eq(sites.organizationId, inspectionRuns.organizationId),
        ),
      )
      .leftJoin(
        assets,
        and(
          eq(assets.id, inspectionRuns.assetId),
          eq(assets.organizationId, inspectionRuns.organizationId),
        ),
      )
      .where(
        and(
          eq(inspectionRuns.id, command.inspectionRunId),
          eq(inspectionRuns.organizationId, context.organizationId),
        ),
      );
    if (!run) throw new NotFoundException("Inspection run not found");
    if (run.assignedTo !== context.userId)
      throw new ForbiddenException("Inspection assignment is unavailable");
    if (run.siteStatus === "ARCHIVED" || run.assetStatus === "ARCHIVED")
      throw new ConflictException("Inspection target is archived");
    if (
      ["CANCELLED", "APPROVED", "CLOSED"].includes(run.status) &&
      command.type !== "SUBMIT_INSPECTION"
    )
      throw new ConflictException("Inspection run state changed");
  }

  private async bindRun(context: TenantContext, inspectionRunId: string, deviceId: string) {
    const [binding] = await this.db
      .select()
      .from(fieldRunDevices)
      .where(
        and(
          eq(fieldRunDevices.organizationId, context.organizationId),
          eq(fieldRunDevices.inspectionRunId, inspectionRunId),
          isNull(fieldRunDevices.releasedAt),
        ),
      );
    if (binding) {
      if (binding.deviceId !== deviceId || binding.userId !== context.userId)
        throw new ConflictException("Inspection is active on another field device");
      return;
    }
    await this.db.insert(fieldRunDevices).values({
      organizationId: context.organizationId,
      inspectionRunId,
      deviceId,
      userId: context.userId,
    });
  }

  private async dependenciesSucceeded(context: TenantContext, command: FieldSyncCommandInput) {
    for (const dependency of command.dependsOn) {
      const [record] = await this.db
        .select({ outcome: fieldSyncCommands.outcome })
        .from(fieldSyncCommands)
        .where(
          and(
            eq(fieldSyncCommands.commandId, dependency),
            eq(fieldSyncCommands.organizationId, context.organizationId),
            eq(fieldSyncCommands.userId, context.userId),
            eq(fieldSyncCommands.deviceId, command.deviceId),
            eq(fieldSyncCommands.outcome, "SUCCESS"),
          ),
        );
      if (!record) return false;
    }
    return true;
  }

  private async findReplay(
    context: TenantContext,
    command: FieldSyncCommandInput,
  ): Promise<CommandResult | null> {
    const [record] = await this.db
      .select()
      .from(fieldSyncCommands)
      .where(
        and(
          eq(fieldSyncCommands.organizationId, context.organizationId),
          or(
            eq(fieldSyncCommands.commandId, command.commandId),
            and(
              eq(fieldSyncCommands.userId, context.userId),
              eq(fieldSyncCommands.deviceId, command.deviceId),
              eq(fieldSyncCommands.idempotencyKey, command.idempotencyKey),
            ),
          ),
        ),
      )
      .limit(1);
    if (!record) return null;
    if (
      record.payloadHash !== payloadHash(command) ||
      record.inspectionRunId !== command.inspectionRunId ||
      record.commandType !== command.type
    )
      return {
        commandId: command.commandId,
        idempotencyKey: command.idempotencyKey,
        outcome: "PERMANENT_FAILURE",
        code: "IDEMPOTENCY_KEY_REUSED",
      };
    if (command.type === "AUTHORIZE_EVIDENCE") {
      const refreshedAuthorization = await this.evidence.authorize(context, command.payload);
      return {
        commandId: command.commandId,
        idempotencyKey: command.idempotencyKey,
        outcome: "SUCCESS",
        code: "COMMAND_APPLIED",
        authoritativeResult: {
          ...refreshedAuthorization,
          acknowledgedAt: new Date().toISOString(),
        },
      };
    }
    return {
      commandId: command.commandId,
      idempotencyKey: command.idempotencyKey,
      outcome: record.outcome,
      code: record.code,
      authoritativeResult: record.authoritativeResult ?? undefined,
    };
  }

  private async persistResult(
    context: TenantContext,
    command: FieldSyncCommandInput,
    result: Omit<CommandResult, "commandId" | "idempotencyKey">,
  ): Promise<CommandResult> {
    const response = {
      commandId: command.commandId,
      idempotencyKey: command.idempotencyKey,
      ...result,
    };
    const inserted = await this.db
      .insert(fieldSyncCommands)
      .values({
        commandId: command.commandId,
        organizationId: context.organizationId,
        userId: context.userId,
        deviceId: command.deviceId,
        inspectionRunId: command.inspectionRunId,
        sequence: command.sequence,
        idempotencyKey: command.idempotencyKey,
        commandType: command.type,
        payloadHash: payloadHash(command),
        outcome: result.outcome,
        code: result.code,
        authoritativeResult: sanitizeResult(command.type, result.authoritativeResult),
        occurredAt: new Date(command.occurredAt),
      })
      .onConflictDoNothing()
      .returning({ commandId: fieldSyncCommands.commandId });
    if (inserted.length)
      await this.db.insert(activityEvents).values({
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: "field_sync.command_processed",
        resourceType: "inspection_run",
        resourceId: command.inspectionRunId,
        metadata: {
          commandId: command.commandId,
          deviceId: command.deviceId,
          commandType: command.type,
          outcome: result.outcome,
          code: result.code,
        },
      });
    return response;
  }
}

function payloadHash(command: FieldSyncCommandInput): string {
  return createHash("sha256")
    .update(JSON.stringify({ type: command.type, payload: command.payload }))
    .digest("hex");
}

function sanitizeResult(type: FieldSyncCommandInput["type"], result: unknown): unknown {
  if (type !== "AUTHORIZE_EVIDENCE") return result;
  const value = asRecord(result);
  return {
    uploadGrantId: value.uploadGrantId,
    expiresAt: value.expiresAt,
    acknowledgedAt: value.acknowledgedAt,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function classify(error: unknown): Omit<CommandResult, "commandId" | "idempotencyKey"> {
  if (!(error instanceof HttpException))
    return { outcome: "RETRYABLE_FAILURE", code: "TEMPORARY_SERVER_FAILURE", retryAfterMs: 2_000 };
  const status = error.getStatus();
  if (status === 401) return { outcome: "AUTHENTICATION_FAILURE", code: "SESSION_EXPIRED" };
  if (status === 403) return { outcome: "CONFLICT", code: "ASSIGNMENT_OR_MEMBERSHIP_REVOKED" };
  if (status === 404) return { outcome: "CONFLICT", code: "TARGET_UNAVAILABLE" };
  if (status === 409) return { outcome: "CONFLICT", code: "AUTHORITATIVE_STATE_CHANGED" };
  if (status === 429 || status >= 500)
    return { outcome: "RETRYABLE_FAILURE", code: "TEMPORARY_SERVER_FAILURE", retryAfterMs: 2_000 };
  return { outcome: "PERMANENT_FAILURE", code: "COMMAND_REJECTED" };
}
