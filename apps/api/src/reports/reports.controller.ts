import { Controller, Get, Inject, Param, Post, Req } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";

import { RequestContextService } from "../context/request-context.service.js";
import { ReportsService } from "./reports.service.js";

@ApiTags("reports")
@ApiCookieAuth("nexus.session_token")
@Controller("v1")
export class ReportsController {
  constructor(
    @Inject(RequestContextService) private readonly context: RequestContextService,
    @Inject(ReportsService) private readonly reports: ReportsService,
  ) {}

  @Post("inspection-runs/:id/reports")
  async request(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.reports.request(
        await this.context.requireTenant(request, "reports:manage"),
        id,
        request.id,
      ),
    };
  }

  @Get("inspection-runs/:id/reports")
  async list(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.reports.list(await this.context.requireTenant(request, "reports:read"), id),
    };
  }

  @Post("reports/:id/retry")
  async retry(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.reports.retry(
        await this.context.requireTenant(request, "reports:manage"),
        id,
        request.id,
      ),
    };
  }

  @Get("reports/:id/download")
  async download(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.reports.download(
        await this.context.requireTenant(request, "reports:read"),
        id,
      ),
    };
  }
}
