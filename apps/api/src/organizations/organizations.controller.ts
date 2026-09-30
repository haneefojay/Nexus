import type { NexusAuth } from "@nexus/auth";
import { organizationCreateSchema } from "@nexus/validation";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";

import { AUTH_TOKEN } from "../tokens.js";
import { RequestContextService } from "../context/request-context.service.js";
import { OrganizationsService } from "./organizations.service.js";

function toHeaders(request: FastifyRequest): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
    else if (value !== undefined) headers.set(name, String(value));
  }
  return headers;
}

@ApiTags("organizations")
@ApiCookieAuth("nexus.session_token")
@Controller("v1/organizations")
export class OrganizationsController {
  constructor(
    @Inject(AUTH_TOKEN) private readonly auth: NexusAuth,
    private readonly context: RequestContextService,
    private readonly organizationsService: OrganizationsService,
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
    const session = await this.auth.api.getSession({ headers: toHeaders(request) });
    if (!session?.user.emailVerified) {
      throw new UnauthorizedException("A verified session is required");
    }

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

    return { data: await this.organizationsService.create(parsed.data, session.user.id) };
  }
}
