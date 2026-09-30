import {
  inspectionFindingCreateSchema,
  inspectionPlanCreateSchema,
  inspectionPlanUpdateSchema,
  inspectionResponsesSchema,
  inspectionTemplateCreateSchema,
  inspectionTemplateUpdateSchema,
} from "@nexus/validation";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";

import { RequestContextService } from "../context/request-context.service.js";
import { InspectionsService } from "./inspections.service.js";

@ApiTags("inspections")
@ApiCookieAuth("nexus.session_token")
@Controller("v1")
export class InspectionsController {
  constructor(
    @Inject(RequestContextService) private readonly context: RequestContextService,
    @Inject(InspectionsService) private readonly service: InspectionsService,
  ) {}

  @Get("inspection-templates")
  async templates(@Req() request: FastifyRequest) {
    return {
      data: await this.service.listTemplates(
        await this.context.requireTenant(request, "inspection-templates:read"),
      ),
    };
  }

  @Post("inspection-templates")
  async createTemplate(@Req() request: FastifyRequest, @Body() body: unknown) {
    return {
      data: await this.service.createTemplate(
        await this.context.requireTenant(request, "inspection-templates:manage"),
        parse(inspectionTemplateCreateSchema, body),
      ),
    };
  }

  @Get("inspection-templates/:id")
  async template(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.getTemplate(
        await this.context.requireTenant(request, "inspection-templates:read"),
        id,
      ),
    };
  }

  @Patch("inspection-templates/:id")
  async updateTemplate(
    @Req() request: FastifyRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return {
      data: await this.service.updateTemplate(
        await this.context.requireTenant(request, "inspection-templates:manage"),
        id,
        parse(inspectionTemplateUpdateSchema, body),
      ),
    };
  }

  @Post("inspection-templates/:id/versions")
  async publishTemplate(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.publishTemplate(
        await this.context.requireTenant(request, "inspection-templates:manage"),
        id,
      ),
    };
  }

  @Get("inspection-plans")
  async plans(@Req() request: FastifyRequest) {
    return {
      data: await this.service.listPlans(
        await this.context.requireTenant(request, "inspection-plans:read"),
      ),
    };
  }

  @Post("inspection-plans")
  async createPlan(@Req() request: FastifyRequest, @Body() body: unknown) {
    return {
      data: await this.service.createPlan(
        await this.context.requireTenant(request, "inspection-plans:manage"),
        parse(inspectionPlanCreateSchema, body),
      ),
    };
  }

  @Patch("inspection-plans/:id")
  async updatePlan(@Req() request: FastifyRequest, @Param("id") id: string, @Body() body: unknown) {
    return {
      data: await this.service.updatePlan(
        await this.context.requireTenant(request, "inspection-plans:manage"),
        id,
        parse(inspectionPlanUpdateSchema, body),
      ),
    };
  }

  @Post("inspection-plans/:id/pause")
  async pausePlan(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.setPlanActive(
        await this.context.requireTenant(request, "inspection-plans:manage"),
        id,
        false,
      ),
    };
  }

  @Post("inspection-plans/:id/resume")
  async resumePlan(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.setPlanActive(
        await this.context.requireTenant(request, "inspection-plans:manage"),
        id,
        true,
      ),
    };
  }

  @Get("inspection-runs")
  async runs(
    @Req() request: FastifyRequest,
    @Query("scope") scope?: "upcoming" | "due" | "overdue",
  ) {
    return {
      data: await this.service.listRuns(
        await this.context.requireTenant(request, "inspection-runs:read"),
        scope,
      ),
    };
  }

  @Get("inspection-runs/:id")
  async run(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.getRun(
        await this.context.requireTenant(request, "inspection-runs:read"),
        id,
      ),
    };
  }

  @Post("inspection-runs/:id/start")
  async start(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.startRun(
        await this.context.requireTenant(request, "inspection-runs:execute"),
        id,
      ),
    };
  }

  @Put("inspection-runs/:id/responses")
  async responses(@Req() request: FastifyRequest, @Param("id") id: string, @Body() body: unknown) {
    return {
      data: await this.service.saveResponses(
        await this.context.requireTenant(request, "inspection-runs:execute"),
        id,
        parse(inspectionResponsesSchema, body),
      ),
    };
  }

  @Post("inspection-runs/:id/findings")
  async finding(@Req() request: FastifyRequest, @Param("id") id: string, @Body() body: unknown) {
    return {
      data: await this.service.createFinding(
        await this.context.requireTenant(request, "inspection-runs:execute"),
        id,
        parse(inspectionFindingCreateSchema, body),
      ),
    };
  }

  @Post("inspection-runs/:id/submit")
  async submit(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.submitRun(
        await this.context.requireTenant(request, "inspection-runs:execute"),
        id,
      ),
    };
  }

  @Post("inspection-runs/:id/review")
  async review(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.reviewRun(
        await this.context.requireTenant(request, "inspection-runs:review"),
        id,
      ),
    };
  }

  @Get("inspection-dashboard")
  async dashboard(@Req() request: FastifyRequest) {
    return {
      data: await this.service.dashboard(
        await this.context.requireTenant(request, "inspection-dashboard:read"),
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
