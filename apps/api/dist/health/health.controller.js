var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";
import { ReadinessService } from "./readiness.service.js";
let HealthController = class HealthController {
    constructor(readiness) {
        this.readiness = readiness;
    }
    health() {
        return { status: "ok", service: "api" };
    }
    async ready() {
        const result = await this.readiness.check();
        if (result.status !== "ready") {
            throw new ServiceUnavailableException(result);
        }
        return result;
    }
};
__decorate([
    Get("health"),
    ApiOkResponse({ description: "API process is alive." }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HealthController.prototype, "health", null);
__decorate([
    Get("ready"),
    ApiOkResponse({ description: "Required infrastructure is reachable." }),
    ApiServiceUnavailableResponse({ description: "One or more dependencies are unavailable." }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "ready", null);
HealthController = __decorate([
    ApiTags("system"),
    Controller(),
    __param(0, Inject(ReadinessService)),
    __metadata("design:paramtypes", [ReadinessService])
], HealthController);
export { HealthController };
//# sourceMappingURL=health.controller.js.map