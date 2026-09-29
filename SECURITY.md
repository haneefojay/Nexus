# Security Policy

## Reporting vulnerabilities

Do not open a public issue containing exploit details, credentials, tenant data, or signed URLs. Report privately to the project security contact configured for the deployment.

Include:

- affected version and environment;
- reproducible steps;
- impact;
- affected organization/resource;
- suggested remediation if known.

## Security priorities

NEXUS treats these as release-blocking:

- cross-tenant access;
- broken role or object authorization;
- session compromise;
- unauthorized evidence or report download;
- malicious file upload;
- secret exposure;
- mutation of submitted inspection history or audit events.

## Supported versions

During pre-MVP development, only the current `main` branch is supported. A formal supported-version table will be established with the first production release.

## Secrets

Never commit real secrets. Use `.env.example` for names and safe local defaults only. Rotate any credential that enters version control or logs.
