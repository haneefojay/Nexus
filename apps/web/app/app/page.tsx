"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import {
  Activity,
  ArrowUpRight,
  Building2,
  Database,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  Map,
  Menu,
  Search,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";

import { MapView } from "./map-view";
import { InspectionsWorkspace } from "./inspections-workspace";

type Organization = { id: string; name: string; role: string; slug: string };
type Site = {
  id: string;
  name: string;
  reference: string | null;
  type: string;
  status: string;
  address: string | null;
};
type Asset = {
  id: string;
  identifier: string;
  name: string;
  siteId: string;
  assetTypeId: string;
  status: string;
  condition: string;
};
type AssetType = { id: string; name: string; category: string };
type Member = { id: string; name: string; email: string; role: string; status: string };
type View =
  | "overview"
  | "inspection-dashboard"
  | "inspections"
  | "templates"
  | "plans"
  | "sites"
  | "assets"
  | "map"
  | "team"
  | "import";

const navigation: { id: View; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "inspection-dashboard", label: "Inspection dashboard", icon: ClipboardCheck },
  { id: "inspections", label: "Inspection runs", icon: FileCheck2 },
  { id: "templates", label: "Templates", icon: ClipboardCheck },
  { id: "plans", label: "Plans & schedules", icon: CalendarDays },
  { id: "sites", label: "Sites", icon: Building2 },
  { id: "assets", label: "Assets", icon: Database },
  { id: "map", label: "Network map", icon: Map },
  { id: "team", label: "Team", icon: Users },
  { id: "import", label: "Import", icon: Upload },
];

export default function OperationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [sites, setSites] = useState<Site[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [types, setTypes] = useState<AssetType[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [view, setView] = useState<View>("overview");
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const organizationsResult = await api<{ data: Organization[] }>("/v1/organizations");
      setOrganizations(organizationsResult.data);
      const active = organizationId || organizationsResult.data[0]?.id || "";
      setOrganizationId(active);
      if (!active) return;
      const [siteResult, assetResult, typeResult] = await Promise.all([
        api<{ data: Site[] }>("/v1/sites", {}, active),
        api<{ data: Asset[] }>("/v1/assets", {}, active),
        api<{ data: AssetType[] }>("/v1/asset-types", {}, active),
      ]);
      setSites(siteResult.data);
      setAssets(assetResult.data);
      setTypes(typeResult.data);
      if (organizationsResult.data.find((item) => item.id === active)?.role === "OWNER") {
        const memberResult = await api<{ data: Member[] }>("/v1/members", {}, active);
        setMembers(memberResult.data);
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "NEXUS could not load";
      if (message.toLowerCase().includes("session") || message.toLowerCase().includes("verified")) {
        router.push("/signin");
      } else setError(message);
    }
  }, [organizationId, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const activeOrganization = organizations.find((item) => item.id === organizationId);
  const attention = useMemo(
    () => assets.filter((asset) => ["ATTENTION", "CRITICAL"].includes(asset.condition)).length,
    [assets],
  );

  async function createOrganization(form: FormData) {
    await api("/v1/organizations", {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
        slug: form.get("slug"),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    await load();
  }

  if (!organizations.length && !error) {
    return (
      <main className="onboarding">
        <p className="eyebrow">FIRST NETWORK / CONFIGURATION</p>
        <h1>Define your operating environment.</h1>
        <p>Create the organization that will contain your sites, assets, and field teams.</p>
        <form action={createOrganization} className="inline-form">
          <input
            aria-label="Organization name"
            name="name"
            placeholder="Organization name"
            required
          />
          <input
            aria-label="Organization slug"
            name="slug"
            pattern="[a-z0-9-]+"
            placeholder="organization-slug"
            required
          />
          <button className="signal-button">
            Create network <ArrowUpRight size={16} />
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="ops-shell">
      <aside className={menu ? "ops-sidebar open" : "ops-sidebar"}>
        <div className="shell-brand">
          <span className="brand-mark">
            <i />
            <i />
          </span>
          NEXUS
        </div>
        <button aria-label="Close menu" className="sidebar-close" onClick={() => setMenu(false)}>
          <X />
        </button>
        <div className="organization-control">
          <span>ACTIVE NETWORK</span>
          <select
            aria-label="Active organization"
            onChange={(event) => setOrganizationId(event.target.value)}
            value={organizationId}
          >
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </div>
        <nav aria-label="Operations">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={view === item.id ? "active" : ""}
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setMenu(false);
                }}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="system-health">
          <span className="status-dot" /> SYSTEM OPERATIONAL
        </div>
      </aside>
      <section className="ops-main">
        <header className="ops-header">
          <button aria-label="Open menu" className="mobile-ops-menu" onClick={() => setMenu(true)}>
            <Menu />
          </button>
          <div>
            <p className="eyebrow">NEXUS NETWORK / LIVE</p>
            <h1>{navigation.find((item) => item.id === view)?.label}</h1>
          </div>
          <div className="operator-role">{activeOrganization?.role.replaceAll("_", " ")}</div>
        </header>
        {error && <p className="error-banner">{error}</p>}
        {view === "overview" && <Overview sites={sites} assets={assets} attention={attention} />}
        {["inspection-dashboard", "inspections", "templates", "plans"].includes(view) && (
          <InspectionsWorkspace
            assets={assets}
            members={members}
            mode={view as "inspection-dashboard" | "inspections" | "templates" | "plans"}
            organizationId={organizationId}
            sites={sites}
          />
        )}
        {view === "sites" && (
          <SitesView organizationId={organizationId} sites={sites} onDone={load} />
        )}
        {view === "assets" && (
          <AssetsView
            organizationId={organizationId}
            assets={assets}
            sites={sites}
            types={types}
            onDone={load}
          />
        )}
        {view === "map" && organizationId && <MapView organizationId={organizationId} />}
        {view === "team" && (
          <TeamView organizationId={organizationId} members={members} onDone={load} />
        )}
        {view === "import" && <ImportView organizationId={organizationId} />}
      </section>
    </main>
  );
}

function Overview({
  sites,
  assets,
  attention,
}: {
  sites: Site[];
  assets: Asset[];
  attention: number;
}) {
  const operational = assets.length
    ? ((assets.filter((item) => item.status === "ACTIVE").length / assets.length) * 100).toFixed(1)
    : "—";
  return (
    <div className="overview-layout">
      <section className="metric-band">
        {[
          ["ASSETS", assets.length],
          ["SITES", sites.length],
          ["ATTENTION REQUIRED", attention],
          ["OPERATIONAL", operational === "—" ? "—" : `${operational}%`],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
      <section className="signal-field">
        <div className="signal-orbit" />
        <div className="signal-copy">
          <p className="eyebrow">NETWORK STATE</p>
          <h2>
            {assets.length
              ? "Your physical network is visible."
              : "Your network is ready for its first asset."}
          </h2>
          <p>
            Operational status is calculated directly from the active organization’s real asset
            register.
          </p>
        </div>
        {assets.slice(0, 24).map((asset, index) => (
          <span
            className={`field-node ${asset.condition.toLowerCase()}`}
            key={asset.id}
            style={{ left: `${8 + ((index * 37) % 84)}%`, top: `${12 + ((index * 23) % 74)}%` }}
            title={asset.name}
          />
        ))}
      </section>
    </div>
  );
}

function SitesView({
  organizationId,
  sites,
  onDone,
}: {
  organizationId: string;
  sites: Site[];
  onDone(): Promise<void>;
}) {
  async function create(form: FormData) {
    await api(
      "/v1/sites",
      {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          reference: form.get("reference") || undefined,
          type: form.get("type"),
          status: "ACTIVE",
          address: form.get("address") || undefined,
        }),
      },
      organizationId,
    );
    await onDone();
  }
  return (
    <DataSection
      title="Site register"
      subtitle="Physical locations in the active network."
      form={
        <form action={create} className="inline-form">
          <input name="name" placeholder="Site name" required />
          <input name="reference" placeholder="Reference" />
          <input name="type" placeholder="Type" required />
          <input name="address" placeholder="Address" />
          <button>Add site</button>
        </form>
      }
    >
      <DataTable
        headers={["Site", "Reference", "Type", "Status"]}
        rows={sites.map((site) => [site.name, site.reference ?? "—", site.type, site.status])}
      />
    </DataSection>
  );
}

function AssetsView({
  organizationId,
  assets,
  sites,
  types,
  onDone,
}: {
  organizationId: string;
  assets: Asset[];
  sites: Site[];
  types: AssetType[];
  onDone(): Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const visible = assets.filter((asset) =>
    `${asset.name} ${asset.identifier}`.toLowerCase().includes(query.toLowerCase()),
  );
  async function create(form: FormData) {
    await api(
      "/v1/assets",
      {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          identifier: form.get("identifier"),
          siteId: form.get("siteId"),
          assetTypeId: form.get("assetTypeId"),
          status: "ACTIVE",
          condition: "GOOD",
        }),
      },
      organizationId,
    );
    await onDone();
  }
  return (
    <DataSection
      title="Asset intelligence"
      subtitle="Every physical asset, scoped to this organization."
      form={
        <form action={create} className="inline-form">
          <input name="name" placeholder="Asset name" required />
          <input name="identifier" placeholder="Identifier" required />
          <select name="siteId" required>
            <option value="">Site</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
          <select name="assetTypeId" required>
            <option value="">Asset type</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <button>Add asset</button>
        </form>
      }
    >
      <label className="search-control">
        <Search size={16} />
        <input
          aria-label="Search assets"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search identifier or name"
          value={query}
        />
      </label>
      <DataTable
        headers={["Asset", "Identifier", "Status", "Condition"]}
        rows={visible.map((asset) => [asset.name, asset.identifier, asset.status, asset.condition])}
      />
    </DataSection>
  );
}

function TeamView({
  organizationId,
  members,
  onDone,
}: {
  organizationId: string;
  members: Member[];
  onDone(): Promise<void>;
}) {
  async function invite(form: FormData) {
    await api(
      "/v1/invitations",
      {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), role: form.get("role") }),
      },
      organizationId,
    );
    await onDone();
  }
  return (
    <DataSection
      title="Network access"
      subtitle="Fixed roles keep operational permissions explicit."
      form={
        <form action={invite} className="inline-form">
          <input name="email" placeholder="operator@company.com" required type="email" />
          <select name="role">
            <option>OPERATIONS_MANAGER</option>
            <option>SUPERVISOR</option>
            <option>TECHNICIAN</option>
            <option>VIEWER</option>
          </select>
          <button>Send invitation</button>
        </form>
      }
    >
      <DataTable
        headers={["Member", "Email", "Role", "Status"]}
        rows={members.map((member) => [
          member.name,
          member.email,
          member.role.replaceAll("_", " "),
          member.status,
        ])}
      />
    </DataSection>
  );
}

function ImportView({ organizationId }: { organizationId: string }) {
  const [result, setResult] = useState<{
    id: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    status: string;
  } | null>(null);
  async function preview(form: FormData) {
    const file = form.get("file") as File;
    const response = await api<{ data: NonNullable<typeof result> }>(
      "/v1/imports/preview",
      { method: "POST", body: JSON.stringify({ kind: form.get("kind"), csv: await file.text() }) },
      organizationId,
    );
    setResult(response.data);
  }
  async function confirm() {
    if (!result) return;
    const response = await api<{ data: NonNullable<typeof result> }>(
      `/v1/imports/${result.id}/confirm`,
      { method: "POST" },
      organizationId,
    );
    setResult({ ...result, status: response.data.status });
  }
  return (
    <DataSection
      title="Structured intake"
      subtitle="Preview and validate CSV data before it enters the operational register."
      form={
        <form action={preview} className="import-form">
          <select name="kind">
            <option value="SITE">Sites</option>
            <option value="ASSET">Assets</option>
          </select>
          <input accept=".csv,text/csv" name="file" required type="file" />
          <button>Validate file</button>
        </form>
      }
    >
      {result ? (
        <div className="import-result">
          <p className="eyebrow">IMPORT / {result.status}</p>
          <h2>{result.totalRows} rows examined.</h2>
          <p>
            {result.validRows} valid · {result.invalidRows} require attention
          </p>
          {result.status === "READY" && (
            <button className="signal-button" onClick={confirm}>
              Confirm import <ArrowUpRight size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className="empty-state">No file in validation.</div>
      )}
    </DataSection>
  );
}

function DataSection({
  title,
  subtitle,
  form,
  children,
}: {
  title: string;
  subtitle: string;
  form: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="data-section">
      <header>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {form}
      </header>
      {children}
    </div>
  );
}
function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <div className="empty-state">No records in this view.</div>}
    </div>
  );
}
