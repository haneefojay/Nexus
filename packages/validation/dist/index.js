import { z } from "zod";
export const uuidV7Schema = z
    .uuid()
    .refine((value) => value.split("-")[2]?.startsWith("7"), "Expected a UUIDv7 identifier");
export const cursorQuerySchema = z.object({
    cursor: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
});
export const coordinateSchema = z.object({
    longitude: z.number().min(-180).max(180),
    latitude: z.number().min(-90).max(90),
});
//# sourceMappingURL=index.js.map