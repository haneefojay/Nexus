import { type createDatabase } from "@nexus/database";
export interface AuthenticatedActor {
    userId: string;
    sessionId: string;
}
export interface OrganizationContext {
    organizationId: string;
    membershipId: string;
    role: "OWNER" | "OPERATIONS_MANAGER" | "SUPERVISOR" | "TECHNICIAN" | "VIEWER";
}
export interface AuthorizationContext {
    actor: AuthenticatedActor;
    organization: OrganizationContext;
    requestId: string;
}
export interface AuthEmail {
    kind: "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "ORGANIZATION_INVITATION";
    recipient: string;
    recipientName: string;
    actionUrl: string;
}
export interface AuthEmailDispatcher {
    enqueue(message: AuthEmail): Promise<void>;
}
export interface CreateNexusAuthOptions {
    db: ReturnType<typeof createDatabase>["db"];
    secret: string;
    baseURL: string;
    trustedOrigins: string[];
    secureCookies: boolean;
    emailDispatcher: AuthEmailDispatcher;
}
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(hash: string, password: string): Promise<boolean>;
export declare function createNexusAuth(options: CreateNexusAuthOptions): import("better-auth").Auth<{
    appName: string;
    secret: string;
    baseURL: string;
    basePath: string;
    trustedOrigins: string[];
    database: (options: import("better-auth").BetterAuthOptions) => import("better-auth").DBAdapter<import("better-auth").BetterAuthOptions>;
    advanced: {
        database: {
            generateId: false;
        };
        cookiePrefix: string;
        useSecureCookies: boolean;
        defaultCookieAttributes: {
            httpOnly: true;
            sameSite: "lax";
            secure: boolean;
            path: string;
        };
    };
    session: {
        expiresIn: number;
        updateAge: number;
        cookieCache: {
            enabled: false;
        };
    };
    emailAndPassword: {
        enabled: true;
        requireEmailVerification: true;
        autoSignIn: false;
        minPasswordLength: number;
        maxPasswordLength: number;
        resetPasswordTokenExpiresIn: number;
        revokeSessionsOnPasswordReset: true;
        password: {
            hash: typeof hashPassword;
            verify: ({ hash, password }: {
                hash: string;
                password: string;
            }) => Promise<boolean>;
        };
        sendResetPassword: ({ user, url }: {
            user: import("better-auth").User;
            url: string;
            token: string;
        }) => Promise<void>;
    };
    emailVerification: {
        sendOnSignUp: true;
        autoSignInAfterVerification: false;
        expiresIn: number;
        sendVerificationEmail: ({ user, url }: {
            user: import("better-auth").User;
            url: string;
            token: string;
        }) => Promise<void>;
    };
    rateLimit: {
        enabled: true;
        storage: "database";
        window: number;
        max: number;
        customRules: {
            "/sign-in/email": {
                window: number;
                max: number;
            };
            "/sign-up/email": {
                window: number;
                max: number;
            };
            "/forget-password": {
                window: number;
                max: number;
            };
            "/reset-password": {
                window: number;
                max: number;
            };
        };
    };
    databaseHooks: {
        session: {
            create: {
                before: (session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                } & Record<string, unknown>) => Promise<boolean>;
            };
        };
    };
}>;
export type NexusAuth = ReturnType<typeof createNexusAuth>;
//# sourceMappingURL=index.d.ts.map