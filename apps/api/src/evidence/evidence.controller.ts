import { evidenceFinalizeSchema, evidenceUploadAuthorizeSchema } from "@nexus/validation";
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
import { EvidenceService } from "./evidence.service.js";

@ApiTags("evidence")
@ApiCookieAuth("nexus.session_token")
@Controller("v1")
export class EvidenceController {
  constructor(
    @Inject(RequestContextService) private readonly context: RequestContextService,
    @Inject(EvidenceService) private readonly service: EvidenceService,
  ) {}

  @Post("uploads/authorize")
  async authorize(@Req() request: FastifyRequest, @Body() body: unknown) {
    return {
      data: await this.service.authorize(
        await this.context.requireTenant(request, "evidence:manage"),
        parse(evidenceUploadAuthorizeSchema, body),
      ),
    };
  }

  @Post("evidence")
  async finalize(@Req() request: FastifyRequest, @Body() body: unknown) {
    return {
      data: await this.service.finalize(
        await this.context.requireTenant(request, "evidence:manage"),
        parse(evidenceFinalizeSchema, body),
      ),
    };
  }

  @Get("evidence/:id/download")
  async download(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.authorizeDownload(
        await this.context.requireTenant(request, "evidence:read"),
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
