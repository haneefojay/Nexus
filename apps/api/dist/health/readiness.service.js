var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from "@nestjs/common";
import { createConnection } from "node:net";
function endpointFromUrl(value, fallbackPort) {
    if (!value)
        return null;
    const url = new URL(value);
    return {
        host: url.hostname,
        port: url.port ? Number.parseInt(url.port, 10) : fallbackPort,
    };
}
async function canConnect(endpoint, timeoutMs = 1_500) {
    if (!endpoint)
        return "not_configured";
    return new Promise((resolve) => {
        const socket = createConnection(endpoint);
        const finish = (status) => {
            socket.removeAllListeners();
            socket.destroy();
            resolve(status);
        };
        socket.setTimeout(timeoutMs);
        socket.once("connect", () => finish("up"));
        socket.once("timeout", () => finish("down"));
        socket.once("error", () => finish("down"));
    });
}
let ReadinessService = class ReadinessService {
    async check() {
        const [postgres, redis, objectStorage] = await Promise.all([
            canConnect(endpointFromUrl(process.env.DATABASE_URL, 5432)),
            canConnect(endpointFromUrl(process.env.REDIS_URL, 6379)),
            canConnect(endpointFromUrl(process.env.S3_ENDPOINT, 443)),
        ]);
        const dependencies = { postgres, redis, objectStorage };
        const status = Object.values(dependencies).every((value) => value === "up")
            ? "ready"
            : "not_ready";
        return { status, dependencies };
    }
};
ReadinessService = __decorate([
    Injectable()
], ReadinessService);
export { ReadinessService };
//# sourceMappingURL=readiness.service.js.map