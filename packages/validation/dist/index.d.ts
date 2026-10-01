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
export declare const organizationCreateSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    timezone: z.ZodString;
}, z.core.$strip>;
export type OrganizationCreateInput = z.infer<typeof organizationCreateSchema>;
export declare const membershipRoleSchema: z.ZodEnum<{
    OWNER: "OWNER";
    OPERATIONS_MANAGER: "OPERATIONS_MANAGER";
    SUPERVISOR: "SUPERVISOR";
    TECHNICIAN: "TECHNICIAN";
    VIEWER: "VIEWER";
}>;
export declare const invitationCreateSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodEmail>;
    role: z.ZodEnum<{
        OPERATIONS_MANAGER: "OPERATIONS_MANAGER";
        SUPERVISOR: "SUPERVISOR";
        TECHNICIAN: "TECHNICIAN";
        VIEWER: "VIEWER";
    }>;
}, z.core.$strip>;
export declare const membershipUpdateSchema: z.ZodObject<{
    role: z.ZodEnum<{
        OWNER: "OWNER";
        OPERATIONS_MANAGER: "OPERATIONS_MANAGER";
        SUPERVISOR: "SUPERVISOR";
        TECHNICIAN: "TECHNICIAN";
        VIEWER: "VIEWER";
    }>;
}, z.core.$strip>;
export declare const lifecycleStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    ACTIVE: "ACTIVE";
    INACTIVE: "INACTIVE";
    ARCHIVED: "ARCHIVED";
}>;
export declare const siteCreateSchema: z.ZodObject<{
    name: z.ZodString;
    reference: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    type: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<{
        DRAFT: "DRAFT";
        ACTIVE: "ACTIVE";
        INACTIVE: "INACTIVE";
        ARCHIVED: "ARCHIVED";
    }>>;
    address: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    notes: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const siteUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    reference: z.ZodOptional<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>>;
    type: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        DRAFT: "DRAFT";
        ACTIVE: "ACTIVE";
        INACTIVE: "INACTIVE";
        ARCHIVED: "ARCHIVED";
    }>>>;
    address: z.ZodOptional<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>>;
    notes: z.ZodOptional<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>>;
    latitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    longitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export declare const assetTypeCreateSchema: z.ZodObject<{
    name: z.ZodString;
    category: z.ZodString;
    description: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    metadataSchema: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const assetCreateSchema: z.ZodObject<{
    siteId: z.ZodUUID;
    assetTypeId: z.ZodUUID;
    parentAssetId: z.ZodOptional<z.ZodNullable<z.ZodUUID>>;
    identifier: z.ZodString;
    name: z.ZodString;
    serialNumber: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    manufacturer: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    model: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    installationDate: z.ZodOptional<z.ZodISODate>;
    status: z.ZodDefault<z.ZodEnum<{
        DRAFT: "DRAFT";
        ACTIVE: "ACTIVE";
        INACTIVE: "INACTIVE";
        ARCHIVED: "ARCHIVED";
    }>>;
    condition: z.ZodDefault<z.ZodEnum<{
        UNKNOWN: "UNKNOWN";
        GOOD: "GOOD";
        ATTENTION: "ATTENTION";
        CRITICAL: "CRITICAL";
    }>>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const assetUpdateSchema: z.ZodObject<{
    siteId: z.ZodOptional<z.ZodUUID>;
    assetTypeId: z.ZodOptional<z.ZodUUID>;
    parentAssetId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodUUID>>>;
    identifier: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    serialNumber: z.ZodOptional<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>>;
    manufacturer: z.ZodOptional<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>>;
    model: z.ZodOptional<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>>;
    installationDate: z.ZodOptional<z.ZodOptional<z.ZodISODate>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        DRAFT: "DRAFT";
        ACTIVE: "ACTIVE";
        INACTIVE: "INACTIVE";
        ARCHIVED: "ARCHIVED";
    }>>>;
    condition: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        UNKNOWN: "UNKNOWN";
        GOOD: "GOOD";
        ATTENTION: "ATTENTION";
        CRITICAL: "CRITICAL";
    }>>>;
    latitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    longitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    metadata: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export declare const importPreviewSchema: z.ZodObject<{
    kind: z.ZodEnum<{
        SITE: "SITE";
        ASSET: "ASSET";
    }>;
    csv: z.ZodString;
}, z.core.$strip>;
export declare const mapViewportSchema: z.ZodObject<{
    west: z.ZodCoercedNumber<unknown>;
    south: z.ZodCoercedNumber<unknown>;
    east: z.ZodCoercedNumber<unknown>;
    north: z.ZodCoercedNumber<unknown>;
    zoom: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const inspectionResponseTypeSchema: z.ZodEnum<{
    PASS_FAIL: "PASS_FAIL";
    YES_NO: "YES_NO";
    SINGLE_CHOICE: "SINGLE_CHOICE";
    NUMERIC: "NUMERIC";
    SHORT_TEXT: "SHORT_TEXT";
    LONG_TEXT: "LONG_TEXT";
    PHOTO: "PHOTO";
    DATE_TIME: "DATE_TIME";
}>;
export declare const inspectionTemplateItemSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    helpText: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    responseType: z.ZodEnum<{
        PASS_FAIL: "PASS_FAIL";
        YES_NO: "YES_NO";
        SINGLE_CHOICE: "SINGLE_CHOICE";
        NUMERIC: "NUMERIC";
        SHORT_TEXT: "SHORT_TEXT";
        LONG_TEXT: "LONG_TEXT";
        PHOTO: "PHOTO";
        DATE_TIME: "DATE_TIME";
    }>;
    required: z.ZodDefault<z.ZodBoolean>;
    unit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    minimum: z.ZodOptional<z.ZodNumber>;
    maximum: z.ZodOptional<z.ZodNumber>;
    options: z.ZodOptional<z.ZodArray<z.ZodString>>;
    severityTrigger: z.ZodOptional<z.ZodEnum<{
        CRITICAL: "CRITICAL";
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
    }>>;
    evidenceRequired: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const inspectionTemplateSchema: z.ZodObject<{
    sections: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        instructions: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
        items: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            helpText: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
            responseType: z.ZodEnum<{
                PASS_FAIL: "PASS_FAIL";
                YES_NO: "YES_NO";
                SINGLE_CHOICE: "SINGLE_CHOICE";
                NUMERIC: "NUMERIC";
                SHORT_TEXT: "SHORT_TEXT";
                LONG_TEXT: "LONG_TEXT";
                PHOTO: "PHOTO";
                DATE_TIME: "DATE_TIME";
            }>;
            required: z.ZodDefault<z.ZodBoolean>;
            unit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
            minimum: z.ZodOptional<z.ZodNumber>;
            maximum: z.ZodOptional<z.ZodNumber>;
            options: z.ZodOptional<z.ZodArray<z.ZodString>>;
            severityTrigger: z.ZodOptional<z.ZodEnum<{
                CRITICAL: "CRITICAL";
                LOW: "LOW";
                MEDIUM: "MEDIUM";
                HIGH: "HIGH";
            }>>;
            evidenceRequired: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const inspectionTemplateCreateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    category: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    schema: z.ZodObject<{
        sections: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            instructions: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
            items: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                helpText: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
                responseType: z.ZodEnum<{
                    PASS_FAIL: "PASS_FAIL";
                    YES_NO: "YES_NO";
                    SINGLE_CHOICE: "SINGLE_CHOICE";
                    NUMERIC: "NUMERIC";
                    SHORT_TEXT: "SHORT_TEXT";
                    LONG_TEXT: "LONG_TEXT";
                    PHOTO: "PHOTO";
                    DATE_TIME: "DATE_TIME";
                }>;
                required: z.ZodDefault<z.ZodBoolean>;
                unit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
                minimum: z.ZodOptional<z.ZodNumber>;
                maximum: z.ZodOptional<z.ZodNumber>;
                options: z.ZodOptional<z.ZodArray<z.ZodString>>;
                severityTrigger: z.ZodOptional<z.ZodEnum<{
                    CRITICAL: "CRITICAL";
                    LOW: "LOW";
                    MEDIUM: "MEDIUM";
                    HIGH: "HIGH";
                }>>;
                evidenceRequired: z.ZodDefault<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const inspectionTemplateUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>>;
    category: z.ZodOptional<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>>;
    schema: z.ZodOptional<z.ZodObject<{
        sections: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            instructions: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
            items: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                helpText: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
                responseType: z.ZodEnum<{
                    PASS_FAIL: "PASS_FAIL";
                    YES_NO: "YES_NO";
                    SINGLE_CHOICE: "SINGLE_CHOICE";
                    NUMERIC: "NUMERIC";
                    SHORT_TEXT: "SHORT_TEXT";
                    LONG_TEXT: "LONG_TEXT";
                    PHOTO: "PHOTO";
                    DATE_TIME: "DATE_TIME";
                }>;
                required: z.ZodDefault<z.ZodBoolean>;
                unit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
                minimum: z.ZodOptional<z.ZodNumber>;
                maximum: z.ZodOptional<z.ZodNumber>;
                options: z.ZodOptional<z.ZodArray<z.ZodString>>;
                severityTrigger: z.ZodOptional<z.ZodEnum<{
                    CRITICAL: "CRITICAL";
                    LOW: "LOW";
                    MEDIUM: "MEDIUM";
                    HIGH: "HIGH";
                }>>;
                evidenceRequired: z.ZodDefault<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const inspectionRecurrenceSchema: z.ZodObject<{
    type: z.ZodEnum<{
        DAILY: "DAILY";
        WEEKLY: "WEEKLY";
        MONTHLY: "MONTHLY";
        QUARTERLY: "QUARTERLY";
        CUSTOM_DAYS: "CUSTOM_DAYS";
    }>;
    intervalDays: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const inspectionPlanCreateSchema: z.ZodObject<{
    templateVersionId: z.ZodUUID;
    name: z.ZodString;
    targetType: z.ZodEnum<{
        SITE: "SITE";
        ASSET: "ASSET";
    }>;
    siteId: z.ZodUUID;
    assetId: z.ZodOptional<z.ZodUUID>;
    recurrence: z.ZodObject<{
        type: z.ZodEnum<{
            DAILY: "DAILY";
            WEEKLY: "WEEKLY";
            MONTHLY: "MONTHLY";
            QUARTERLY: "QUARTERLY";
            CUSTOM_DAYS: "CUSTOM_DAYS";
        }>;
        intervalDays: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    startsAt: z.ZodISODateTime;
    endsAt: z.ZodOptional<z.ZodISODateTime>;
    assignedUserId: z.ZodOptional<z.ZodUUID>;
    assignedRole: z.ZodOptional<z.ZodEnum<{
        OWNER: "OWNER";
        OPERATIONS_MANAGER: "OPERATIONS_MANAGER";
        SUPERVISOR: "SUPERVISOR";
        TECHNICIAN: "TECHNICIAN";
        VIEWER: "VIEWER";
    }>>;
    dueWindowMinutes: z.ZodDefault<z.ZodNumber>;
    requiresReview: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const inspectionPlanUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    assignedUserId: z.ZodOptional<z.ZodNullable<z.ZodUUID>>;
    assignedRole: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        OWNER: "OWNER";
        OPERATIONS_MANAGER: "OPERATIONS_MANAGER";
        SUPERVISOR: "SUPERVISOR";
        TECHNICIAN: "TECHNICIAN";
        VIEWER: "VIEWER";
    }>>>;
    dueWindowMinutes: z.ZodOptional<z.ZodNumber>;
    requiresReview: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const inspectionResponsesSchema: z.ZodObject<{
    responses: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        value: z.ZodUnknown;
    }, z.core.$strip>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const inspectionFindingCreateSchema: z.ZodObject<{
    itemId: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    notes: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    severity: z.ZodEnum<{
        CRITICAL: "CRITICAL";
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
    }>;
}, z.core.$strip>;
export declare const findingStatusSchema: z.ZodEnum<{
    OPEN: "OPEN";
    ACKNOWLEDGED: "ACKNOWLEDGED";
    ACTION_REQUIRED: "ACTION_REQUIRED";
    IN_PROGRESS: "IN_PROGRESS";
    READY_FOR_VERIFICATION: "READY_FOR_VERIFICATION";
    VERIFIED: "VERIFIED";
    CLOSED: "CLOSED";
    DISMISSED: "DISMISSED";
}>;
export declare const findingTransitionSchema: z.ZodObject<{
    status: z.ZodEnum<{
        OPEN: "OPEN";
        ACKNOWLEDGED: "ACKNOWLEDGED";
        ACTION_REQUIRED: "ACTION_REQUIRED";
        IN_PROGRESS: "IN_PROGRESS";
        READY_FOR_VERIFICATION: "READY_FOR_VERIFICATION";
        VERIFIED: "VERIFIED";
        CLOSED: "CLOSED";
        DISMISSED: "DISMISSED";
    }>;
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const findingDismissSchema: z.ZodObject<{
    reason: z.ZodString;
}, z.core.$strip>;
export declare const correctiveActionCreateSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    assignedTo: z.ZodUUID;
    priority: z.ZodEnum<{
        CRITICAL: "CRITICAL";
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
    }>;
    dueAt: z.ZodString;
}, z.core.$strip>;
export declare const correctiveActionTransitionSchema: z.ZodObject<{
    note: z.ZodOptional<z.ZodString>;
    completionNotes: z.ZodOptional<z.ZodString>;
    completionEvidenceCount: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const correctiveActionAssignSchema: z.ZodObject<{
    assignedTo: z.ZodUUID;
    reason: z.ZodString;
}, z.core.$strip>;
export declare const evidenceTargetTypeSchema: z.ZodEnum<{
    FINDING: "FINDING";
    CORRECTIVE_ACTION: "CORRECTIVE_ACTION";
    INSPECTION_RUN: "INSPECTION_RUN";
}>;
export declare const evidenceUploadAuthorizeSchema: z.ZodObject<{
    targetType: z.ZodEnum<{
        FINDING: "FINDING";
        CORRECTIVE_ACTION: "CORRECTIVE_ACTION";
        INSPECTION_RUN: "INSPECTION_RUN";
    }>;
    targetId: z.ZodUUID;
    originalName: z.ZodString;
    contentType: z.ZodEnum<{
        "image/jpeg": "image/jpeg";
        "image/png": "image/png";
        "image/webp": "image/webp";
        "application/pdf": "application/pdf";
    }>;
    contentLength: z.ZodNumber;
    checksum: z.ZodString;
}, z.core.$strip>;
export declare const evidenceFinalizeSchema: z.ZodObject<{
    uploadGrantId: z.ZodUUID;
    capturedAt: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    deviceMetadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.core.$strip>;
export declare const fieldSyncCommandSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    commandId: z.ZodUUID;
    organizationId: z.ZodUUID;
    inspectionRunId: z.ZodUUID;
    userId: z.ZodUUID;
    deviceId: z.ZodUUID;
    sequence: z.ZodNumber;
    dependsOn: z.ZodArray<z.ZodUUID>;
    occurredAt: z.ZodString;
    idempotencyKey: z.ZodString;
    type: z.ZodLiteral<"START_INSPECTION">;
    payload: z.ZodObject<{}, z.core.$strict>;
}, z.core.$strip>, z.ZodObject<{
    commandId: z.ZodUUID;
    organizationId: z.ZodUUID;
    inspectionRunId: z.ZodUUID;
    userId: z.ZodUUID;
    deviceId: z.ZodUUID;
    sequence: z.ZodNumber;
    dependsOn: z.ZodArray<z.ZodUUID>;
    occurredAt: z.ZodString;
    idempotencyKey: z.ZodString;
    type: z.ZodLiteral<"SAVE_RESPONSES">;
    payload: z.ZodObject<{
        responses: z.ZodArray<z.ZodObject<{
            itemId: z.ZodString;
            value: z.ZodUnknown;
        }, z.core.$strip>>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    commandId: z.ZodUUID;
    organizationId: z.ZodUUID;
    inspectionRunId: z.ZodUUID;
    userId: z.ZodUUID;
    deviceId: z.ZodUUID;
    sequence: z.ZodNumber;
    dependsOn: z.ZodArray<z.ZodUUID>;
    occurredAt: z.ZodString;
    idempotencyKey: z.ZodString;
    type: z.ZodLiteral<"AUTHORIZE_EVIDENCE">;
    payload: z.ZodObject<{
        originalName: z.ZodString;
        contentType: z.ZodEnum<{
            "image/jpeg": "image/jpeg";
            "image/png": "image/png";
            "image/webp": "image/webp";
            "application/pdf": "application/pdf";
        }>;
        contentLength: z.ZodNumber;
        checksum: z.ZodString;
        targetType: z.ZodLiteral<"INSPECTION_RUN">;
        targetId: z.ZodUUID;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    commandId: z.ZodUUID;
    organizationId: z.ZodUUID;
    inspectionRunId: z.ZodUUID;
    userId: z.ZodUUID;
    deviceId: z.ZodUUID;
    sequence: z.ZodNumber;
    dependsOn: z.ZodArray<z.ZodUUID>;
    occurredAt: z.ZodString;
    idempotencyKey: z.ZodString;
    type: z.ZodLiteral<"FINALIZE_EVIDENCE">;
    payload: z.ZodObject<{
        uploadGrantId: z.ZodUUID;
        capturedAt: z.ZodOptional<z.ZodString>;
        note: z.ZodOptional<z.ZodString>;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
        deviceMetadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    commandId: z.ZodUUID;
    organizationId: z.ZodUUID;
    inspectionRunId: z.ZodUUID;
    userId: z.ZodUUID;
    deviceId: z.ZodUUID;
    sequence: z.ZodNumber;
    dependsOn: z.ZodArray<z.ZodUUID>;
    occurredAt: z.ZodString;
    idempotencyKey: z.ZodString;
    type: z.ZodLiteral<"SUBMIT_INSPECTION">;
    payload: z.ZodObject<{}, z.core.$strict>;
}, z.core.$strip>], "type">;
export declare const fieldSyncBatchSchema: z.ZodObject<{
    protocolVersion: z.ZodLiteral<1>;
    localSchemaVersion: z.ZodLiteral<1>;
    deviceId: z.ZodUUID;
    commands: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        commandId: z.ZodUUID;
        organizationId: z.ZodUUID;
        inspectionRunId: z.ZodUUID;
        userId: z.ZodUUID;
        deviceId: z.ZodUUID;
        sequence: z.ZodNumber;
        dependsOn: z.ZodArray<z.ZodUUID>;
        occurredAt: z.ZodString;
        idempotencyKey: z.ZodString;
        type: z.ZodLiteral<"START_INSPECTION">;
        payload: z.ZodObject<{}, z.core.$strict>;
    }, z.core.$strip>, z.ZodObject<{
        commandId: z.ZodUUID;
        organizationId: z.ZodUUID;
        inspectionRunId: z.ZodUUID;
        userId: z.ZodUUID;
        deviceId: z.ZodUUID;
        sequence: z.ZodNumber;
        dependsOn: z.ZodArray<z.ZodUUID>;
        occurredAt: z.ZodString;
        idempotencyKey: z.ZodString;
        type: z.ZodLiteral<"SAVE_RESPONSES">;
        payload: z.ZodObject<{
            responses: z.ZodArray<z.ZodObject<{
                itemId: z.ZodString;
                value: z.ZodUnknown;
            }, z.core.$strip>>;
            notes: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        commandId: z.ZodUUID;
        organizationId: z.ZodUUID;
        inspectionRunId: z.ZodUUID;
        userId: z.ZodUUID;
        deviceId: z.ZodUUID;
        sequence: z.ZodNumber;
        dependsOn: z.ZodArray<z.ZodUUID>;
        occurredAt: z.ZodString;
        idempotencyKey: z.ZodString;
        type: z.ZodLiteral<"AUTHORIZE_EVIDENCE">;
        payload: z.ZodObject<{
            originalName: z.ZodString;
            contentType: z.ZodEnum<{
                "image/jpeg": "image/jpeg";
                "image/png": "image/png";
                "image/webp": "image/webp";
                "application/pdf": "application/pdf";
            }>;
            contentLength: z.ZodNumber;
            checksum: z.ZodString;
            targetType: z.ZodLiteral<"INSPECTION_RUN">;
            targetId: z.ZodUUID;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        commandId: z.ZodUUID;
        organizationId: z.ZodUUID;
        inspectionRunId: z.ZodUUID;
        userId: z.ZodUUID;
        deviceId: z.ZodUUID;
        sequence: z.ZodNumber;
        dependsOn: z.ZodArray<z.ZodUUID>;
        occurredAt: z.ZodString;
        idempotencyKey: z.ZodString;
        type: z.ZodLiteral<"FINALIZE_EVIDENCE">;
        payload: z.ZodObject<{
            uploadGrantId: z.ZodUUID;
            capturedAt: z.ZodOptional<z.ZodString>;
            note: z.ZodOptional<z.ZodString>;
            latitude: z.ZodOptional<z.ZodNumber>;
            longitude: z.ZodOptional<z.ZodNumber>;
            deviceMetadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        commandId: z.ZodUUID;
        organizationId: z.ZodUUID;
        inspectionRunId: z.ZodUUID;
        userId: z.ZodUUID;
        deviceId: z.ZodUUID;
        sequence: z.ZodNumber;
        dependsOn: z.ZodArray<z.ZodUUID>;
        occurredAt: z.ZodString;
        idempotencyKey: z.ZodString;
        type: z.ZodLiteral<"SUBMIT_INSPECTION">;
        payload: z.ZodObject<{}, z.core.$strict>;
    }, z.core.$strip>], "type">>;
}, z.core.$strip>;
export declare const fieldAssignmentQuerySchema: z.ZodObject<{
    protocolVersion: z.ZodPipe<z.ZodCoercedNumber<unknown>, z.ZodLiteral<1>>;
    localSchemaVersion: z.ZodPipe<z.ZodCoercedNumber<unknown>, z.ZodLiteral<1>>;
    deviceId: z.ZodUUID;
    deviceLabel: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type InvitationCreateInput = z.infer<typeof invitationCreateSchema>;
export type SiteCreateInput = z.infer<typeof siteCreateSchema>;
export type SiteUpdateInput = z.infer<typeof siteUpdateSchema>;
export type AssetTypeCreateInput = z.infer<typeof assetTypeCreateSchema>;
export type AssetCreateInput = z.infer<typeof assetCreateSchema>;
export type AssetUpdateInput = z.infer<typeof assetUpdateSchema>;
export type InspectionTemplateSchema = z.infer<typeof inspectionTemplateSchema>;
export type InspectionTemplateCreateInput = z.infer<typeof inspectionTemplateCreateSchema>;
export type InspectionTemplateUpdateInput = z.infer<typeof inspectionTemplateUpdateSchema>;
export type InspectionPlanCreateInput = z.infer<typeof inspectionPlanCreateSchema>;
export type InspectionPlanUpdateInput = z.infer<typeof inspectionPlanUpdateSchema>;
export type InspectionResponsesInput = z.infer<typeof inspectionResponsesSchema>;
export type InspectionFindingCreateInput = z.infer<typeof inspectionFindingCreateSchema>;
export type FindingTransitionInput = z.infer<typeof findingTransitionSchema>;
export type FindingDismissInput = z.infer<typeof findingDismissSchema>;
export type CorrectiveActionCreateInput = z.infer<typeof correctiveActionCreateSchema>;
export type CorrectiveActionTransitionInput = z.infer<typeof correctiveActionTransitionSchema>;
export type CorrectiveActionAssignInput = z.infer<typeof correctiveActionAssignSchema>;
export type EvidenceUploadAuthorizeInput = z.infer<typeof evidenceUploadAuthorizeSchema>;
export type EvidenceFinalizeInput = z.infer<typeof evidenceFinalizeSchema>;
export type FieldSyncCommandInput = z.infer<typeof fieldSyncCommandSchema>;
export type FieldSyncBatchInput = z.infer<typeof fieldSyncBatchSchema>;
export type FieldAssignmentQueryInput = z.infer<typeof fieldAssignmentQuerySchema>;
//# sourceMappingURL=index.d.ts.map