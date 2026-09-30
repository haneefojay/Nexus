import {
  assetCreateSchema,
  assetTypeCreateSchema,
  assetUpdateSchema,
  importPreviewSchema,
  mapViewportSchema,
  siteCreateSchema,
  siteUpdateSchema,
} from "@nexus/validation";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";

import { RequestContextService } from "../context/request-context.service.js";
import { OperationsService } from "./operations.service.js";

@ApiTags("operations")
@ApiCookieAuth("nexus.session_token")
@Controller("v1")
export class OperationsController {
  constructor(
    private readonly context: RequestContextService,
    private readonly service: OperationsService,
  ) {}

  @Get("sites")
  async sites(@Req() request: FastifyRequest) {
    return {
      data: await this.service.listSites(await this.context.requireTenant(request, "sites:read")),
    };
  }
  @Post("sites")
  async createSite(@Req() request: FastifyRequest, @Body() body: unknown) {
    const input = parse(siteCreateSchema, body);
    return {
      data: await this.service.createSite(
        await this.context.requireTenant(request, "sites:manage"),
        input,
      ),
    };
  }
  @Patch("sites/:id")
  async updateSite(@Req() request: FastifyRequest, @Param("id") id: string, @Body() body: unknown) {
    return {
      data: await this.service.updateSite(
        await this.context.requireTenant(request, "sites:manage"),
        id,
        parse(siteUpdateSchema, body),
      ),
    };
  }
  @Post("sites/:id/archive")
  async archiveSite(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.updateSite(
        await this.context.requireTenant(request, "sites:manage"),
        id,
        { status: "ARCHIVED" },
      ),
    };
  }
  @Get("asset-types")
  async types(@Req() request: FastifyRequest) {
    return {
      data: await this.service.listAssetTypes(
        await this.context.requireTenant(request, "assets:read"),
      ),
    };
  }
  @Post("asset-types")
  async createType(@Req() request: FastifyRequest, @Body() body: unknown) {
    return {
      data: await this.service.createAssetType(
        await this.context.requireTenant(request, "assets:manage"),
        parse(assetTypeCreateSchema, body),
      ),
    };
  }
  @Get("assets")
  async assets(@Req() request: FastifyRequest, @Query("q") q?: string) {
    return {
      data: await this.service.listAssets(
        await this.context.requireTenant(request, "assets:read"),
        q,
      ),
    };
  }
  @Post("assets")
  async createAsset(@Req() request: FastifyRequest, @Body() body: unknown) {
    return {
      data: await this.service.createAsset(
        await this.context.requireTenant(request, "assets:manage"),
        parse(assetCreateSchema, body),
      ),
    };
  }
  @Patch("assets/:id")
  async updateAsset(
    @Req() request: FastifyRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return {
      data: await this.service.updateAsset(
        await this.context.requireTenant(request, "assets:manage"),
        id,
        parse(assetUpdateSchema, body),
      ),
    };
  }
  @Post("assets/:id/archive")
  async archiveAsset(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.updateAsset(
        await this.context.requireTenant(request, "assets:manage"),
        id,
        { status: "ARCHIVED" },
      ),
    };
  }
  @Get("map/assets")
  async map(@Req() request: FastifyRequest, @Query() query: unknown) {
    return {
      data: await this.service.map(
        await this.context.requireTenant(request, "map:read"),
        parse(mapViewportSchema, query),
      ),
    };
  }
  @Post("imports/preview")
  async preview(@Req() request: FastifyRequest, @Body() body: unknown) {
    const input = parse(importPreviewSchema, body);
    return {
      data: await this.service.previewImport(
        await this.context.requireTenant(request, "imports:manage"),
        input.kind,
        input.csv,
      ),
    };
  }
  @Post("imports/:id/confirm")
  async confirm(@Req() request: FastifyRequest, @Param("id") id: string) {
    return {
      data: await this.service.confirmImport(
        await this.context.requireTenant(request, "imports:manage"),
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
