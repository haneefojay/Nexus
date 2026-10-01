# Authoritative metric definitions

All timestamps persist as UTC `timestamptz`; calendar presentation uses the organization timezone.

- **Due now:** scheduled at or before now, due at or after now, and status `ASSIGNED`, `READY`, or `IN_PROGRESS`.
- **Overdue:** due before now and still `ASSIGNED`, `READY`, or `IN_PROGRESS`.
- **Completed (30 days):** status `CLOSED` with `closed_at` in the trailing 30 days.
- **Required coverage:** inspection runs scheduled at or before now for an active site.
- **Completed coverage:** required runs whose status is `CLOSED`; future closed runs cannot inflate coverage.
- **Open findings/actions:** records in a non-terminal lifecycle state; overdue actions are non-terminal actions with due time before now.

Zero is displayed as zero. A site with no required runs displays **No scheduled data**, not 100%. Request failure and dependency unavailability are errors, never coerced to zero.
