import {
  correctiveActionCreateSchema,
  correctiveActionAssignSchema,
  correctiveActionTransitionSchema,
  findingDismissSchema,
} from "@nexus/validation";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";

import { RequestContextService } from "../context/request-context.service.js";
import { FindingsService } from "./findings.service.js";

@ApiTags("findings")
@ApiCookieAuth("nexus.session_token")
@Controller("v1")
export class FindingsController {
  constructor(
    @Inject(RequestContextService) private readonly context: RequestContextService,
    @Inject(FindingsService) private readonly service: FindingsService,
  ) {}

  @Get("findings")
  async findings(
    @Req() request: FastifyRequest,
    @Query("status") status?: string,
    @Query("severity") severity?: string,
    @Query("siteId") siteId?: string,
    @Query("assetId") assetId?: string,
    @Query("assigneeId") assigneeId?: string,
    @Query("overdue") overdue?: string,
  ) {
    const statuses = [
      "OPEN",
      "ACKNOWLEDGED",
      "ACTION_REQUIRED",
      "IN_PROGRESS",
      "READY_FOR_VERIFICATION",
      "VERIFIED",
      "CLOSED",
      "DISMISSED",
    ] as const;
    const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
    if (status && !statuses.includes(status as (typeof statuses)[number]))
      throw new BadRequestException("Invalid finding status filter");
    if (severity && !severities.includes(severity as (typeof severities)[number]))
      throw new BadRequestException("Invalid finding severity filter");
    return {
      data: await this.service.listFindings(
        await this.context.requireTenant(request, "findings:read"),
        {
          ...(status ? { status: status as (typeof statuses)[number] } : {}),
          ...(severity ? { severity: severity as (typeof severities)[number] } : {}),
          ...(siteId ? { siteId } : {}),
          ...(assetId ? { assetId } : {}),
          ...(assigneeId ? { assigneeId } : {}),
          ...(overdue === "true" ? { overdue: true } : {}),
        },
      ),
    };
  }

  @Get("findings/:id")
  async finding(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.getFinding(
        await this.context.requireTenant(request, "findings:read"),
        id,
      ),
    };
  }

  @Get("actions")
  async actions(@Req() request: FastifyRequest) {
    return {
      data: await this.service.listActions(
        await this.context.requireTenant(request, "actions:read"),
      ),
    };
  }

  @Get("actions/eligible-assignees")
  async eligibleAssignees(@Req() request: FastifyRequest) {
    return {
      data: await this.service.listEligibleAssignees(
        await this.context.requireTenant(request, "actions:manage"),
      ),
    };
  }

  @Get("findings-dashboard")
  async dashboard(@Req() request: FastifyRequest) {
    return {
      data: await this.service.dashboard(
        await this.context.requireTenant(request, "inspection-dashboard:read"),
      ),
    };
  }

  @Post("findings/:id/acknowledge")
  async acknowledge(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.acknowledge(
        await this.context.requireTenant(request, "findings:manage"),
        id,
      ),
    };
  }

  @Post("findings/:id/dismiss")
  async dismiss(@Req() request: FastifyRequest, @Param("id") id: string, @Body() body: unknown) {
    const input = parse(findingDismissSchema, body);
    return {
      data: await this.service.dismiss(
        await this.context.requireTenant(request, "findings:dismiss"),
        id,
        input.reason,
      ),
    };
  }

  @Post("findings/:id/actions")
  async action(@Req() request: FastifyRequest, @Param("id") id: string, @Body() body: unknown) {
    return {
      data: await this.service.createAction(
        await this.context.requireTenant(request, "actions:manage"),
        id,
        parse(correctiveActionCreateSchema, body),
      ),
    };
  }

  @Post("actions/:id/start")
  async start(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.startAction(
        await this.context.requireTenant(request, "actions:execute"),
        id,
      ),
    };
  }

  @Post("actions/:id/assign")
  async assign(@Req() request: FastifyRequest, @Param("id") id: string, @Body() body: unknown) {
    const input = parse(correctiveActionAssignSchema, body);
    return {
      data: await this.service.reassignAction(
        await this.context.requireTenant(request, "actions:manage"),
        id,
        input.assignedTo,
        input.reason,
      ),
    };
  }

  @Post("actions/:id/block")
  async block(@Req() request: FastifyRequest, @Param("id") id: string, @Body() body: unknown) {
    const input = parse(correctiveActionTransitionSchema, body);
    if (!input.note) throw new BadRequestException("A blocking reason is required");
    return {
      data: await this.service.blockAction(
        await this.context.requireTenant(request, "actions:execute"),
        id,
        input.note,
      ),
    };
  }

  @Post("actions/:id/return")
  async returnToWork(
    @Req() request: FastifyRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const input = parse(correctiveActionTransitionSchema, body);
    if (!input.note) throw new BadRequestException("A return note is required");
    return {
      data: await this.service.returnAction(
        await this.context.requireTenant(request, "actions:execute"),
        id,
        input.note,
      ),
    };
  }

  @Post("actions/:id/complete")
  async complete(@Req() request: FastifyRequest, @Param("id") id: string, @Body() body: unknown) {
    const input = parse(correctiveActionTransitionSchema, body);
    if (!input.completionNotes) throw new BadRequestException("Completion notes are required");
    return {
      data: await this.service.completeAction(
        await this.context.requireTenant(request, "actions:execute"),
        id,
        input.completionNotes,
      ),
    };
  }

  @Post("actions/:id/verify")
  async verify(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.verifyAction(
        await this.context.requireTenant(request, "actions:verify"),
        id,
      ),
    };
  }

  @Post("findings/:id/close")
  async close(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.closeFinding(
        await this.context.requireTenant(request, "findings:manage"),
        id,
      ),
    };
  }
}

function parse<T>(
  schema: {
    safeParse(
      value: unknown,
    ): { success: true; data: T } | { success: false; error: { issues: unknown[] } };
  },
  value: unknown,
): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new BadRequestException({ code: "INVALID_REQUEST", details: result.error.issues });
  return result.data;
}
