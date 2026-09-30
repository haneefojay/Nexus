import { Controller, Get, Inject, Query, Req } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";

import { RequestContextService } from "../context/request-context.service.js";
import { SearchService } from "./search.service.js";

@ApiTags("search")
@ApiCookieAuth("nexus.session_token")
@Controller("v1")
export class SearchController {
  constructor(
    @Inject(RequestContextService) private readonly context: RequestContextService,
    @Inject(SearchService) private readonly service: SearchService,
  ) {}

  @Get("search")
  async search(@Req() request: FastifyRequest, @Query("q") query = "") {
    return {
      data: await this.service.search(
        await this.context.requireTenant(request, "search:read"),
        query,
      ),
    };
  }
}
