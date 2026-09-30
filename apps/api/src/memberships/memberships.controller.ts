import { invitationCreateSchema, membershipUpdateSchema } from "@nexus/validation";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";

import { RequestContextService } from "../context/request-context.service.js";
import { MembershipsService } from "./memberships.service.js";

@ApiTags("memberships")
@ApiCookieAuth("nexus.session_token")
@Controller("v1")
export class MembershipsController {
  constructor(
    @Inject(RequestContextService) private readonly context: RequestContextService,
    @Inject(MembershipsService) private readonly service: MembershipsService,
  ) {}

  @Get("members")
  async list(@Req() request: FastifyRequest) {
    const context = await this.context.requireTenant(request, "members:manage");
    return { data: await this.service.list(context) };
  }

  @Post("invitations")
  async invite(@Req() request: FastifyRequest, @Body() body: unknown) {
    const context = await this.context.requireTenant(request, "members:manage");
    const parsed = invitationCreateSchema.safeParse(body);
    if (!parsed.success) throw invalid(parsed.error.issues);
    return { data: await this.service.invite(context, parsed.data) };
  }

  @Post("invitations/accept")
  async accept(@Req() request: FastifyRequest, @Body() body: unknown) {
    const actor = await this.context.requireActor(request);
    const token =
      typeof (body as { token?: unknown })?.token === "string"
        ? (body as { token: string }).token
        : "";
    if (!token) throw new BadRequestException("Invitation token is required");
    return { data: await this.service.accept(actor.userId, actor.email, token) };
  }

  @Patch("members/:id/role")
  async role(@Req() request: FastifyRequest, @Param("id") id: string, @Body() body: unknown) {
    const context = await this.context.requireTenant(request, "members:manage");
    const parsed = membershipUpdateSchema.safeParse(body);
    if (!parsed.success) throw invalid(parsed.error.issues);
    return { data: await this.service.updateRole(context, id, parsed.data.role) };
  }

  @Post("members/:id/deactivate")
  async deactivate(@Req() request: FastifyRequest, @Param("id") id: string) {
    const context = await this.context.requireTenant(request, "members:manage");
    return { data: await this.service.deactivate(context, id) };
  }
}

function invalid(issues: readonly { path: PropertyKey[]; message: string }[]) {
  return new BadRequestException({
    code: "INVALID_REQUEST",
    details: issues.map((issue) => ({ field: issue.path.join("."), reason: issue.message })),
  });
}
