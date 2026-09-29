# Technical Debt Register

| ID     | Item                                                              | Reason                                                          | Impact                                                                                  | Priority | Planned phase                | Status     |
| ------ | ----------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------- | ---------------------------- | ---------- |
| TD-001 | ESLint 10 adoption blocked by `eslint-plugin-react` compatibility | Current Next.js lint stack throws at runtime under ESLint 10.11 | Uses deprecated-but-supported ESLint 9.39.5; no security advisory                       | Low      | Phase 0 or dependency update | Open       |
| TD-002 | Local Compose services cannot run inside the agent sandbox        | Docker CLI is unavailable in this execution environment         | GitHub Actions is the Docker-enabled validation environment                             | Low      | Phase 0 CI                   | Validating |
| TD-003 | Marketing claims implied telemetry/prediction                     | Existing site predated narrowed MVP thesis                      | Copy now labels the demonstration as illustrative and uses inspection/evidence language | High     | Phase 0 content pass         | Closed     |

Debt is not a substitute for roadmap work. Close items by linking the validating change or test.
