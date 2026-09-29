import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";

import { ReadinessService, type ReadinessResult } from "./readiness.service.js";

@ApiTags("system")
@Controller()
export class HealthController {
  constructor(private readonly readiness: ReadinessService) {}

  @Get("health")
  @ApiOkResponse({ description: "API process is alive." })
  health(): { status: "ok"; service: "api" } {
    return { status: "ok", service: "api" };
  }

  @Get("ready")
  @ApiOkResponse({ description: "Required infrastructure is reachable." })
  @ApiServiceUnavailableResponse({ description: "One or more dependencies are unavailable." })
  async ready(): Promise<ReadinessResult> {
    const result = await this.readiness.check();
    if (result.status !== "ready") {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }
}
