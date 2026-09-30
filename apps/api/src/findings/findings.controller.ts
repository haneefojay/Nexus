import {
  correctiveActionCreateSchema,
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
  async findings(@Req() request: FastifyRequest) {
    return {
      data: await this.service.listFindings(
        await this.context.requireTenant(request, "findings:read"),
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
