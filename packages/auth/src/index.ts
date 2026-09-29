import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import {
  accounts,
  rateLimits,
  sessions,
  users,
  verifications,
  type createDatabase,
} from "@nexus/database";
import { hash as argonHash, argon2id, verify as argonVerify } from "argon2";
import { betterAuth } from "better-auth";

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

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
  kind: "EMAIL_VERIFICATION" | "PASSWORD_RESET";
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

export async function hashPassword(password: string): Promise<string> {
  return argonHash(password, {
    type: argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argonVerify(hash, password);
}

export function createNexusAuth(options: CreateNexusAuthOptions) {
  return betterAuth({
    appName: "NEXUS",
    secret: options.secret,
    baseURL: options.baseURL,
    basePath: "/v1/auth",
    trustedOrigins: options.trustedOrigins,
    database: drizzleAdapter(options.db, {
      provider: "pg",
      schema: { users, sessions, accounts, verifications, rateLimits },
      usePlural: true,
      transaction: true,
    }),
    advanced: {
      database: { generateId: false },
      cookiePrefix: "nexus",
      useSecureCookies: options.secureCookies,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: options.secureCookies,
        path: "/",
      },
    },
    session: {
      expiresIn: 7 * DAY,
      updateAge: DAY,
      cookieCache: { enabled: false },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      autoSignIn: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: HOUR,
      revokeSessionsOnPasswordReset: true,
      password: {
        hash: hashPassword,
        verify: ({ hash, password }) => verifyPassword(hash, password),
      },
      sendResetPassword: async ({ user, url }) => {
        await options.emailDispatcher.enqueue({
          kind: "PASSWORD_RESET",
          recipient: user.email,
          recipientName: user.name,
          actionUrl: url,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      expiresIn: HOUR,
      sendVerificationEmail: async ({ user, url }) => {
        await options.emailDispatcher.enqueue({
          kind: "EMAIL_VERIFICATION",
          recipient: user.email,
          recipientName: user.name,
          actionUrl: url,
        });
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "rateLimits",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 5 },
        "/forget-password": { window: 300, max: 3 },
        "/reset-password": { window: 300, max: 5 },
      },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const user = await options.db.query.users.findFirst({
              columns: { active: true },
              where: (table, operators) => operators.eq(table.id, session.userId),
            });
            return user?.active === true;
          },
        },
      },
    },
  });
}

export type NexusAuth = ReturnType<typeof createNexusAuth>;
