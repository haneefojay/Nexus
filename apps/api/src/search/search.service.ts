import { sql, type createDatabase } from "@nexus/database";
import { BadRequestException, Injectable } from "@nestjs/common";

import type { TenantContext } from "../context/request-context.service.js";

@Injectable()
export class SearchService {
  constructor(private readonly db: ReturnType<typeof createDatabase>["db"]) {}

  async search(context: TenantContext, rawQuery: string) {
    const query = rawQuery.trim();
    if (query.length < 2 || query.length > 80)
      throw new BadRequestException("Search queries must contain 2 to 80 characters");
    const pattern = `%${query.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    return this.db.execute<{
      type: "SITE" | "ASSET" | "FINDING" | "CORRECTIVE_ACTION";
      id: string;
      title: string;
      subtitle: string | null;
      attention_rank: number;
    }>(sql`
      select * from (
        select 'SITE'::text as type, s.id, s.name as title, s.reference as subtitle, 6 as attention_rank
        from sites s
        where s.organization_id = ${context.organizationId}::uuid
          and s.status <> 'ARCHIVED'
          and (s.name ilike ${pattern} escape '\\' or coalesce(s.reference, '') ilike ${pattern} escape '\\')
        union all
        select 'ASSET', a.id, a.name, a.identifier,
          case when a.condition = 'CRITICAL' then 1 when a.condition = 'ATTENTION' then 5 else 6 end
        from assets a
        where a.organization_id = ${context.organizationId}::uuid
          and a.status <> 'ARCHIVED'
          and (a.name ilike ${pattern} escape '\\' or a.identifier ilike ${pattern} escape '\\'
            or coalesce(a.serial_number, '') ilike ${pattern} escape '\\')
        union all
        select 'FINDING', f.id, f.title, f.status::text,
          case when f.severity = 'CRITICAL' then 1 when f.severity = 'HIGH' then 2 else 6 end
        from inspection_findings f
        where f.organization_id = ${context.organizationId}::uuid
          and f.title ilike ${pattern} escape '\\'
        union all
        select 'CORRECTIVE_ACTION', c.id, c.title, c.status::text,
          case when c.due_at < now() and c.status not in ('VERIFIED','CANCELLED') then 3 else 6 end
        from corrective_actions c
        where c.organization_id = ${context.organizationId}::uuid
          and c.title ilike ${pattern} escape '\\'
      ) results
      order by attention_rank, title
      limit 50
    `);
  }
}
