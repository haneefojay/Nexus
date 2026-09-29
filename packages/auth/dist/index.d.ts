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
//# sourceMappingURL=index.d.ts.map