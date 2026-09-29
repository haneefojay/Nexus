# Technical Debt Register

| ID     | Item                                                                      | Reason                                                          | Impact                                                                               | Priority | Planned phase                | Status |
| ------ | ------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------- | ---------------------------- | ------ |
| TD-001 | ESLint 10 adoption blocked by `eslint-plugin-react` compatibility         | Current Next.js lint stack throws at runtime under ESLint 10.11 | Uses deprecated-but-supported ESLint 9.39.5; no security advisory                    | Low      | Phase 0 or dependency update | Open   |
| TD-002 | Local Compose services not runtime-validated in the agent sandbox         | Docker CLI is unavailable in this execution environment         | Compose syntax and actual image health must be confirmed on a Docker-enabled machine | Medium   | Phase 0                      | Open   |
| TD-003 | Marketing claims still contain illustrative telemetry/prediction language | Existing site predates the narrowed MVP thesis                  | Public site can imply unsupported capability                                         | High     | Phase 0 content pass         | Open   |

Debt is not a substitute for roadmap work. Close items by linking the validating change or test.
