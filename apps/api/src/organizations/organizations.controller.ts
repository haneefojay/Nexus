import { organizationCreateSchema } from "@nexus/validation";
import { BadRequestException, Body, Controller, Get, Inject, Post, Req } from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";

import { RequestContextService } from "../context/request-context.service.js";
import { OrganizationsService } from "./organizations.service.js";

@ApiTags("organizations")
@ApiCookieAuth("nexus.session_token")
@Controller("v1/organizations")
export class OrganizationsController {
  constructor(
    @Inject(RequestContextService) private readonly context: RequestContextService,
    @Inject(OrganizationsService) private readonly organizationsService: OrganizationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List organizations for the current user" })
  async list(@Req() request: FastifyRequest) {
    const actor = await this.context.requireActor(request);
    return { data: await this.organizationsService.list(actor.userId) };
  }

  @Post()
  @ApiOperation({ summary: "Create an organization and owner membership" })
  @ApiResponse({ status: 201, description: "Organization created" })
  @ApiResponse({ status: 400, description: "Invalid organization details" })
  @ApiResponse({ status: 401, description: "Verified session required" })
  async create(@Req() request: FastifyRequest, @Body() body: unknown) {
    const actor = await this.context.requireActor(request);
    const parsed = organizationCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "INVALID_ORGANIZATION",
        message: "Organization details are invalid",
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          reason: issue.message,
        })),
      });
    }

    return { data: await this.organizationsService.create(parsed.data, actor.userId) };
  }
}
