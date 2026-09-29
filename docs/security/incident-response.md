# Incident Response

1. **Detect and classify:** record time, reporter, affected environment/tenants/data, and severity.
2. **Contain:** revoke sessions/keys, disable vulnerable route/job, isolate artifacts, preserve evidence, and avoid destructive cleanup.
3. **Eradicate:** patch root cause, rotate affected secrets, scan related paths, and validate tenant boundaries.
4. **Recover:** restore/repair from verified sources, smoke-test, monitor, and communicate status.
5. **Notify:** owners assess contractual/regulatory/user notification with legal/privacy guidance.
6. **Learn:** timeline, impact, root causes, control failures, actions/owners/dates, and ADR/requirements/test updates.

Security contacts and escalation channels are configured outside the public repository. Do not put sensitive incident details in public issues or logs.
