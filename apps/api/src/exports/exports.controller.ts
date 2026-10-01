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
import { ExportsService, type ExportType } from "./exports.service.js";

@ApiTags("exports")
@ApiCookieAuth("nexus.session_token")
@Controller("v1/exports")
export class ExportsController {
  constructor(
    @Inject(RequestContextService) private readonly context: RequestContextService,
    @Inject(ExportsService) private readonly exports: ExportsService,
  ) {}
  @Post()
  async request(@Req() request: FastifyRequest, @Body() body: unknown) {
    const exportType = parseType(body);
    return {
      data: await this.exports.request(
        await this.context.requireTenant(request, "exports:manage"),
        exportType,
        request.id,
      ),
    };
  }
  @Get()
  async list(@Req() request: FastifyRequest) {
    return {
      data: await this.exports.list(await this.context.requireTenant(request, "exports:read")),
    };
  }
  @Post(":id/retry")
  async retry(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.exports.retry(
        await this.context.requireTenant(request, "exports:manage"),
        id,
        request.id,
      ),
    };
  }
  @Get(":id/download")
  async download(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.exports.download(
        await this.context.requireTenant(request, "exports:read"),
        id,
      ),
    };
  }
}
function parseType(value: unknown): ExportType {
  if (
    typeof value !== "object" ||
    value === null ||
    !("exportType" in value) ||
    !["ASSETS", "FINDINGS", "INSPECTIONS"].includes(String(value.exportType))
  )
    throw new BadRequestException({ code: "INVALID_EXPORT_TYPE", details: [] });
  return value.exportType as ExportType;
}
