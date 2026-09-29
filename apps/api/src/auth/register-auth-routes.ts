import type { NexusAuth } from "@nexus/auth";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

function requestBody(request: FastifyRequest): string | Uint8Array | undefined {
  if (request.method === "GET" || request.method === "HEAD" || request.body === undefined) {
    return undefined;
  }
  if (typeof request.body === "string" || request.body instanceof Uint8Array) {
    return request.body;
  }
  return JSON.stringify(request.body);
}

export function toAuthRequest(request: FastifyRequest, baseURL: string): Request {
  const url = new URL(request.raw.url ?? request.url, baseURL);
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
    else if (value !== undefined) headers.set(name, String(value));
  }
  const body = requestBody(request);
  return new Request(url, {
    method: request.method,
    headers,
    ...(body === undefined ? {} : { body }),
  });
}

async function forwardAuthResponse(response: Response, reply: FastifyReply): Promise<void> {
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") reply.header(key, value);
  });

  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) reply.header("set-cookie", cookies);

  reply.status(response.status);
  const body = response.body ? Buffer.from(await response.arrayBuffer()) : undefined;
  await reply.send(body);
}

export function registerAuthRoutes(
  fastify: FastifyInstance,
  auth: NexusAuth,
  baseURL: string,
): void {
  fastify.route({
    method: ["GET", "POST"],
    url: "/v1/auth/*",
    async handler(request, reply) {
      const response = await auth.handler(toAuthRequest(request, baseURL));
      await forwardAuthResponse(response, reply);
    },
  });
}
