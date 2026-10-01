import { createHash } from "node:crypto";

import { hashPassword } from "@nexus/auth";
import { parseServerEnvironment } from "@nexus/config";
import { createDatabase } from "@nexus/database";
import { S3StorageProvider } from "@nexus/storage";

const ids = {
  user: "0199abcd-0000-7000-8000-000000000001",
  organization: "0199abcd-0000-7000-8000-000000000002",
  site: "0199abcd-0000-7000-8000-000000000003",
  type: "0199abcd-0000-7000-8000-000000000004",
  asset: "0199abcd-0000-7000-8000-000000000005",
  template: "0199abcd-0000-7000-8000-000000000006",
  version: "0199abcd-0000-7000-8000-000000000007",
  plan: "0199abcd-0000-7000-8000-000000000008",
  run: "0199abcd-0000-7000-8000-000000000009",
  response: "0199abcd-0000-7000-8000-000000000010",
  finding: "0199abcd-0000-7000-8000-000000000011",
  action: "0199abcd-0000-7000-8000-000000000012",
  grant: "0199abcd-0000-7000-8000-000000000013",
  object: "0199abcd-0000-7000-8000-000000000014",
  evidence: "0199abcd-0000-7000-8000-000000000015",
} as const;

async function main(): Promise<void> {
  const environment = parseServerEnvironment(process.env);
  if (environment.NODE_ENV === "production" || process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error(
      "Demo seed is disabled; set ALLOW_DEMO_SEED=true only in an approved non-production environment.",
    );
  }
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 12)
    throw new Error("DEMO_PASSWORD must contain at least 12 characters.");
  const database = createDatabase(environment.DATABASE_URL);
  const storage = new S3StorageProvider({
    endpoint: environment.S3_ENDPOINT,
    region: environment.S3_REGION,
    bucket: environment.S3_BUCKET,
    accessKeyId: environment.S3_ACCESS_KEY,
    secretAccessKey: environment.S3_SECRET_KEY,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
  });
  try {
    await storage.ensureBucket();
    const body = Buffer.from(
      "Fictional NEXUS demo evidence. No real person, customer, or location data.\n",
    );
    const checksum = createHash("sha256").update(body).digest("hex");
    const existing = (await database.client.unsafe(
      `select object_key from evidence_upload_grants where id = '${ids.grant}'`,
    )) as { object_key: string }[];
    let objectKey = existing[0]?.object_key;
    if (!objectKey) {
      const upload = await storage.createAuthorizedUpload({
        organizationId: ids.organization,
        actorId: ids.user,
        targetType: "FINDING",
        targetId: ids.finding,
        contentType: "application/pdf",
        contentLength: body.length,
        checksum,
      });
      const uploadResponse = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: upload.requiredHeaders,
        body,
      });
      if (!uploadResponse.ok)
        throw new Error(`Demo evidence upload failed: ${uploadResponse.status}`);
      objectKey = upload.objectKey;
    }
    const passwordHash = await hashPassword(password);
    const literal = (value: string): string => `'${value.replaceAll("'", "''")}'`;
    await database.client.begin(async (transaction) => {
      await transaction.unsafe(`
      INSERT INTO users(id,email,name,email_verified,email_verified_at) VALUES('${ids.user}','demo.owner@nexus.invalid','Fictional Demo Owner',true,now()) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email_verified=true;
      INSERT INTO accounts(account_id,provider_id,user_id,password) VALUES('${ids.user}','credential','${ids.user}',${literal(passwordHash)}) ON CONFLICT(provider_id,account_id) DO UPDATE SET password=excluded.password;
      INSERT INTO organizations(id,name,slug,timezone) VALUES('${ids.organization}','Fictional Operations — Demo','fictional-operations-demo','Africa/Lagos') ON CONFLICT(id) DO NOTHING;
      INSERT INTO memberships(user_id,organization_id,role,status) VALUES('${ids.user}','${ids.organization}','OWNER','ACTIVE') ON CONFLICT(user_id,organization_id) DO UPDATE SET role='OWNER',status='ACTIVE';
      INSERT INTO sites(id,organization_id,name,reference,type,status,address,location,created_by) VALUES('${ids.site}','${ids.organization}','Fictional Riverside Facility','DEMO-RIVER','OTHER','ACTIVE','Fictional address — not a real location',ST_SetSRID(ST_MakePoint(3.38,6.52),4326),'${ids.user}') ON CONFLICT(id) DO NOTHING;
      INSERT INTO asset_types(id,organization_id,name,category) VALUES('${ids.type}','${ids.organization}','Fictional Pump','DEMO') ON CONFLICT(id) DO NOTHING;
      INSERT INTO assets(id,organization_id,site_id,asset_type_id,identifier,name,status,condition,location) VALUES('${ids.asset}','${ids.organization}','${ids.site}','${ids.type}','DEMO-PUMP-001','Fictional circulation pump','ACTIVE','ATTENTION',ST_SetSRID(ST_MakePoint(3.381,6.521),4326)) ON CONFLICT(id) DO NOTHING;
      INSERT INTO inspection_templates(id,organization_id,name,status,draft_schema,latest_version,created_by) VALUES('${ids.template}','${ids.organization}','Fictional pump safety inspection','PUBLISHED','{"sections":[{"title":"Safety","items":[{"id":"guard","label":"Guard secure","responseType":"BOOLEAN","required":true}]}]}',1,'${ids.user}') ON CONFLICT(id) DO NOTHING;
      INSERT INTO inspection_template_versions(id,organization_id,template_id,version_number,schema,checksum,created_by) VALUES('${ids.version}','${ids.organization}','${ids.template}',1,'{"sections":[{"title":"Safety","items":[{"id":"guard","label":"Guard secure","responseType":"BOOLEAN","required":true}]}]}',repeat('a',64),'${ids.user}') ON CONFLICT(id) DO NOTHING;
      INSERT INTO inspection_plans(id,organization_id,template_version_id,name,target_type,site_id,asset_id,recurrence_type,starts_at,assigned_user_id,next_due_at,created_by,next_sequence) VALUES('${ids.plan}','${ids.organization}','${ids.version}','Fictional monthly safety plan','ASSET','${ids.site}','${ids.asset}','MONTHLY','2026-09-01T09:00:00Z','${ids.user}','2026-11-01T09:00:00Z','${ids.user}',1) ON CONFLICT(id) DO NOTHING;
      INSERT INTO inspection_runs(id,organization_id,inspection_plan_id,template_version_id,site_id,asset_id,assigned_to,sequence,status,scheduled_for,due_at,started_at,submitted_at,approved_at,closed_at,notes) VALUES('${ids.run}','${ids.organization}','${ids.plan}','${ids.version}','${ids.site}','${ids.asset}','${ids.user}',0,'CLOSED','2026-09-01T09:00:00Z','2026-09-02T09:00:00Z','2026-09-01T09:05:00Z','2026-09-01T09:20:00Z','2026-09-01T10:00:00Z','2026-09-01T10:00:00Z','Fictional demo record') ON CONFLICT(id) DO NOTHING;
      INSERT INTO inspection_responses(id,organization_id,inspection_run_id,item_id,value,captured_by) VALUES('${ids.response}','${ids.organization}','${ids.run}','guard','false','${ids.user}') ON CONFLICT(id) DO NOTHING;
      INSERT INTO inspection_findings(id,organization_id,inspection_run_id,item_id,title,notes,severity,site_id,asset_id,status,created_by,detected_at) VALUES('${ids.finding}','${ids.organization}','${ids.run}','guard','Fictional loose guard','Demo-only condition','MEDIUM','${ids.site}','${ids.asset}','ACTION_REQUIRED','${ids.user}','2026-09-01T09:15:00Z') ON CONFLICT(id) DO NOTHING;
      INSERT INTO corrective_actions(id,organization_id,finding_id,title,description,assigned_to,priority,due_at,status,created_by) VALUES('${ids.action}','${ids.organization}','${ids.finding}','Secure fictional guard','Demo-only corrective action','${ids.user}','MEDIUM','2026-10-15T17:00:00Z','OPEN','${ids.user}') ON CONFLICT(id) DO NOTHING;
      INSERT INTO evidence_upload_grants(id,organization_id,target_type,target_id,uploader_user_id,object_key,original_name,content_type,expected_size,expected_checksum,status,expires_at,finalized_at) VALUES('${ids.grant}','${ids.organization}','FINDING','${ids.finding}','${ids.user}',${literal(objectKey)},'fictional-demo-evidence.pdf','application/pdf',${body.length},${literal(checksum)},'FINALIZED',now()+interval '1 day',now()) ON CONFLICT(id) DO NOTHING;
      INSERT INTO storage_objects(id,organization_id,upload_grant_id,object_key,original_name,content_type,size,checksum,status) VALUES('${ids.object}','${ids.organization}','${ids.grant}',${literal(objectKey)},'fictional-demo-evidence.pdf','application/pdf',${body.length},${literal(checksum)},'AVAILABLE') ON CONFLICT(id) DO NOTHING;
      INSERT INTO evidence(id,organization_id,target_type,target_id,storage_object_id,uploader_user_id,captured_at,checksum,note) VALUES('${ids.evidence}','${ids.organization}','FINDING','${ids.finding}','${ids.object}','${ids.user}','2026-09-01T09:15:00Z',${literal(checksum)},'Fictional demo evidence') ON CONFLICT(id) DO NOTHING;
      INSERT INTO activity_events(organization_id,actor_user_id,action,resource_type,resource_id,metadata) SELECT '${ids.organization}','${ids.user}','demo.seeded','organization','${ids.organization}','{"fictional":true}' WHERE NOT EXISTS(SELECT 1 FROM activity_events WHERE organization_id='${ids.organization}' AND action='demo.seeded');
      `);
    });
    console.info("Fictional demo seeded through real database and private object storage paths.");
  } finally {
    await database.close();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown demo seed failure";
  console.error(`::error title=Fictional demo seed failed::${message.replaceAll("\n", " ")}`);
  process.exitCode = 1;
});
