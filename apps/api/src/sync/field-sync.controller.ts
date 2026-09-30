import {
  fieldAssignmentQuerySchema,
  fieldSyncBatchSchema,
  type FieldAssignmentQueryInput,
  type FieldSyncBatchInput,
} from "@nexus/validation";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";

import { RequestContextService } from "../context/request-context.service.js";
import { FieldSyncService } from "./field-sync.service.js";

@ApiTags("field-sync")
@ApiCookieAuth("nexus.session_token")
@Controller("v1/sync/field")
export class FieldSyncController {
  constructor(
    @Inject(RequestContextService) private readonly context: RequestContextService,
    @Inject(FieldSyncService) private readonly service: FieldSyncService,
  ) {}

  @Get("assignments")
  async assignments(@Req() request: FastifyRequest, @Query() query: unknown) {
    return {
      data: await this.service.assignments(
        await this.context.requireTenant(request, "inspection-runs:execute"),
        parse(fieldAssignmentQuerySchema, query),
      ),
    };
  }

  @Post("commands")
  async commands(@Req() request: FastifyRequest, @Body() body: unknown) {
    return {
      data: await this.service.synchronize(
        await this.context.requireTenant(request, "inspection-runs:execute"),
        parse(fieldSyncBatchSchema, body),
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

export type { FieldAssignmentQueryInput, FieldSyncBatchInput };
