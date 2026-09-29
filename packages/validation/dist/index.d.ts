import { z } from "zod";
export declare const uuidV7Schema: z.ZodUUID;
export declare const cursorQuerySchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const coordinateSchema: z.ZodObject<{
    longitude: z.ZodNumber;
    latitude: z.ZodNumber;
}, z.core.$strip>;
//# sourceMappingURL=index.d.ts.map