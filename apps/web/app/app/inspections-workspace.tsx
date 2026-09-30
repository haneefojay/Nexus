"use client";

import { AlertTriangle, CheckCircle2, Plus, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";

type Mode = "inspection-dashboard" | "templates" | "plans" | "inspections";
type Site = { id: string; name: string };
type Asset = { id: string; name: string; siteId: string };
type Member = { id: string; name: string; role: string; status: string };
type Template = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  latestVersion: number;
};
type TemplateDetail = Template & {
  versions: { id: string; versionNumber: number }[];
};
type Plan = {
  id: string;
  name: string;
  recurrenceType: string;
  active: boolean;
  nextDueAt: string;
};
type Run = {
  id: string;
  siteId: string;
  assetId: string | null;
  status: string;
  scheduledFor: string;
  dueAt: string;
  overdue: boolean;
};
type RunDetail = Run & {
  notes: string | null;
  template: {
    sections: {
      id: string;
      title: string;
      instructions?: string;
      items: {
        id: string;
        label: string;
        helpText?: string;
        responseType: string;
        required: boolean;
        options?: string[];
        unit?: string;
      }[];
    }[];
  };
  responses: { itemId: string; value: unknown }[];
  findings: { id: string; title: string; severity: string }[];
};
type Dashboard = {
  summary: { due: number; overdue: number; completed_recently: number };
  coverage: {
    site_id: string;
    site_name: string;
    required: number;
    completed: number;
    overdue: number;
  }[];
};

export function InspectionsWorkspace({
  organizationId,
  mode,
  sites,
  assets,
  members,
}: {
  organizationId: string;
  mode: Mode;
  sites: Site[];
  assets: Asset[];
  members: Member[];
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [selectedRun, setSelectedRun] = useState<RunDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [templateResult, planResult, runResult, dashboardResult] = await Promise.all([
        api<{ data: Template[] }>("/v1/inspection-templates", {}, organizationId),
        api<{ data: Plan[] }>("/v1/inspection-plans", {}, organizationId),
        api<{ data: Run[] }>("/v1/inspection-runs", {}, organizationId),
        api<{ data: Dashboard }>("/v1/inspection-dashboard", {}, organizationId),
      ]);
      setTemplates(templateResult.data);
      setPlans(planResult.data);
      setRuns(runResult.data);
      setDashboard(dashboardResult.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Inspection data could not be loaded");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function openRun(id: string) {
    try {
      const result = await api<{ data: RunDetail }>(
        `/v1/inspection-runs/${id}`,
        {},
        organizationId,
      );
      setSelectedRun(result.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Inspection could not be opened");
    }
  }

  if (loading) return <div className="empty-state">Loading inspection operations…</div>;
  return (
    <section className="inspection-workspace" aria-live="polite">
      {error && (
        <div className="form-error" role="alert">
          {error} <button onClick={() => void load()}>Retry</button>
        </div>
      )}
      {mode === "inspection-dashboard" && dashboard && (
        <InspectionDashboard dashboard={dashboard} />
      )}
      {mode === "templates" && (
        <Templates
          organizationId={organizationId}
          templates={templates}
          onChanged={load}
          onError={setError}
        />
      )}
      {mode === "plans" && (
        <Plans
          assets={assets}
          members={members}
          onChanged={load}
          onError={setError}
          organizationId={organizationId}
          plans={plans}
          sites={sites}
          templates={templates}
        />
      )}
      {mode === "inspections" &&
        (selectedRun ? (
          <RunExecution
            onBack={() => setSelectedRun(null)}
            onChanged={async () => {
              await load();
              setSelectedRun(null);
            }}
            onError={setError}
            organizationId={organizationId}
            run={selectedRun}
          />
        ) : (
          <Runs
            onOpen={(id) => void openRun(id)}
            onReview={async (id) => {
              try {
                await api(`/v1/inspection-runs/${id}/review`, { method: "POST" }, organizationId);
                await load();
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Review failed");
              }
            }}
            runs={runs}
            sites={sites}
          />
        ))}
    </section>
  );
}

function InspectionDashboard({ dashboard }: { dashboard: Dashboard }) {
  return (
    <>
      <header className="view-heading">
        <div>
          <p className="eyebrow">INSPECTION CONTROL / LIVE</p>
          <h1>Coverage and attention</h1>
          <p>Deterministic inspection deadlines and completion coverage.</p>
        </div>
      </header>
      <div className="metric-grid">
        <Metric label="Due now" value={dashboard.summary.due} />
        <Metric label="Overdue" value={dashboard.summary.overdue} alert />
        <Metric label="Completed · 30 days" value={dashboard.summary.completed_recently} />
      </div>
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Site</th>
              <th>Required</th>
              <th>Completed</th>
              <th>Overdue</th>
              <th>Coverage</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.coverage.map((row) => (
              <tr key={row.site_id}>
                <td>{row.site_name}</td>
                <td>{row.required}</td>
                <td>{row.completed}</td>
                <td>{row.overdue}</td>
                <td>{row.required ? Math.round((row.completed / row.required) * 100) : 100}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!dashboard.coverage.length && (
          <div className="empty-state">Coverage appears when sites have scheduled inspections.</div>
        )}
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <article className={alert && value ? "metric attention" : "metric"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Templates({
  organizationId,
  templates,
  onChanged,
  onError,
}: {
  organizationId: string;
  templates: Template[];
  onChanged: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [questions, setQuestions] = useState([
    { id: "condition", label: "Asset condition acceptable", responseType: "PASS_FAIL" },
  ]);

  async function create(form: FormData) {
    try {
      const created = await api<{ data: { id: string } }>(
        "/v1/inspection-templates",
        {
          method: "POST",
          body: JSON.stringify({
            name: form.get("name"),
            description: form.get("description"),
            category: form.get("category"),
            schema: {
              sections: [
                {
                  id: "checklist",
                  title: "Inspection checklist",
                  instructions: form.get("instructions"),
                  items: questions.map((question) => ({
                    ...question,
                    required: true,
                    evidenceRequired: false,
                    ...(question.responseType === "SINGLE_CHOICE"
                      ? { options: ["Acceptable", "Attention required"] }
                      : {}),
                  })),
                },
              ],
            },
          }),
        },
        organizationId,
      );
      await api(
        `/v1/inspection-templates/${created.data.id}/versions`,
        { method: "POST" },
        organizationId,
      );
      await onChanged();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Template could not be published");
    }
  }

  return (
    <>
      <header className="view-heading">
        <div>
          <p className="eyebrow">CONTROLLED CHECKLISTS</p>
          <h1>Inspection templates</h1>
          <p>Draft structured questions and publish an immutable version.</p>
        </div>
      </header>
      <form action={create} className="inspection-form">
        <div className="form-grid">
          <label>
            Template name
            <input name="name" required minLength={2} />
          </label>
          <label>
            Category
            <input name="category" placeholder="Electrical" />
          </label>
        </div>
        <label>
          Description
          <textarea name="description" rows={2} />
        </label>
        <label>
          Technician instructions
          <textarea name="instructions" rows={2} />
        </label>
        <fieldset>
          <legend>Ordered questions</legend>
          {questions.map((question, index) => (
            <div className="question-row" key={question.id}>
              <span>{index + 1}</span>
              <input
                aria-label={`Question ${index + 1} label`}
                onChange={(event) =>
                  setQuestions((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, label: event.target.value } : item,
                    ),
                  )
                }
                required
                value={question.label}
              />
              <select
                aria-label={`Question ${index + 1} response type`}
                onChange={(event) =>
                  setQuestions((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, responseType: event.target.value } : item,
                    ),
                  )
                }
                value={question.responseType}
              >
                <option value="PASS_FAIL">Pass / fail</option>
                <option value="YES_NO">Yes / no</option>
                <option value="SINGLE_CHOICE">Single choice</option>
                <option value="NUMERIC">Numeric reading</option>
                <option value="SHORT_TEXT">Short text</option>
                <option value="LONG_TEXT">Long text</option>
                <option value="PHOTO">Photo reference</option>
                <option value="DATE_TIME">Date and time</option>
              </select>
            </div>
          ))}
          <button
            className="secondary-button"
            onClick={() =>
              setQuestions((current) => [
                ...current,
                {
                  id: `question_${current.length + 1}`,
                  label: "",
                  responseType: "SHORT_TEXT",
                },
              ])
            }
            type="button"
          >
            <Plus size={15} /> Add question
          </button>
        </fieldset>
        <button className="signal-button">
          Publish template <Send size={15} />
        </button>
      </form>
      <RecordCards
        empty="No templates have been published."
        records={templates.map((template) => ({
          id: template.id,
          title: template.name,
          meta: `${template.status} · version ${template.latestVersion}`,
        }))}
      />
    </>
  );
}

function Plans({
  organizationId,
  templates,
  plans,
  sites,
  assets,
  members,
  onChanged,
  onError,
}: {
  organizationId: string;
  templates: Template[];
  plans: Plan[];
  sites: Site[];
  assets: Asset[];
  members: Member[];
  onChanged: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const published = templates.filter((template) => template.latestVersion > 0);
  async function create(form: FormData) {
    try {
      const templateId = String(form.get("templateId"));
      const detail = await api<{ data: TemplateDetail }>(
        `/v1/inspection-templates/${templateId}`,
        {},
        organizationId,
      );
      const version = detail.data.versions[0];
      if (!version) throw new Error("Publish the selected template before scheduling it");
      const target = String(form.get("target")).split(":");
      const startsAt = new Date(String(form.get("startsAt"))).toISOString();
      await api(
        "/v1/inspection-plans",
        {
          method: "POST",
          body: JSON.stringify({
            templateVersionId: version.id,
            name: form.get("name"),
            targetType: target[0],
            siteId: target[1],
            ...(target[0] === "ASSET" ? { assetId: target[2] } : {}),
            recurrence: { type: form.get("recurrence") },
            startsAt,
            assignedUserId: form.get("assignedUserId"),
            dueWindowMinutes: Number(form.get("dueWindowMinutes")),
            requiresReview: form.get("requiresReview") === "on",
          }),
        },
        organizationId,
      );
      await onChanged();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Plan could not be created");
    }
  }
  return (
    <>
      <header className="view-heading">
        <div>
          <p className="eyebrow">BOUNDED SCHEDULING</p>
          <h1>Inspection plans</h1>
          <p>Schedule a published checklist in the organization timezone.</p>
        </div>
      </header>
      <form action={create} className="inspection-form">
        <div className="form-grid">
          <label>
            Plan name
            <input name="name" required />
          </label>
          <label>
            Published template
            <select name="templateId" required>
              {published.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} · v{template.latestVersion}
                </option>
              ))}
            </select>
          </label>
          <label>
            Target
            <select name="target" required>
              {sites.map((site) => (
                <option key={`site-${site.id}`} value={`SITE:${site.id}`}>
                  Site · {site.name}
                </option>
              ))}
              {assets.map((asset) => (
                <option key={`asset-${asset.id}`} value={`ASSET:${asset.siteId}:${asset.id}`}>
                  Asset · {asset.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Assigned technician
            <select name="assignedUserId" required>
              {members
                .filter((member) => member.status === "ACTIVE")
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} · {member.role}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Recurrence
            <select name="recurrence">
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
            </select>
          </label>
          <label>
            First scheduled time
            <input name="startsAt" type="datetime-local" required />
          </label>
          <label>
            Due window · minutes
            <input defaultValue="1440" min="1" name="dueWindowMinutes" type="number" />
          </label>
          <label className="checkbox-label">
            <input name="requiresReview" type="checkbox" /> Require supervisor review
          </label>
        </div>
        <button className="signal-button" disabled={!published.length}>
          Create recurring plan <Plus size={15} />
        </button>
      </form>
      <RecordCards
        empty="No recurring inspection plans."
        records={plans.map((plan) => ({
          id: plan.id,
          title: plan.name,
          meta: `${plan.recurrenceType} · ${plan.active ? "active" : "paused"} · next ${new Date(plan.nextDueAt).toLocaleString()}`,
        }))}
      />
    </>
  );
}

function Runs({
  runs,
  sites,
  onOpen,
  onReview,
}: {
  runs: Run[];
  sites: Site[];
  onOpen: (id: string) => void;
  onReview: (id: string) => void;
}) {
  return (
    <>
      <header className="view-heading">
        <div>
          <p className="eyebrow">FIELD EXECUTION / ONLINE</p>
          <h1>Inspection runs</h1>
          <p>Upcoming, due, overdue, execution, submission, and review.</p>
        </div>
      </header>
      <div className="run-list">
        {runs.map((run) => (
          <article className={run.overdue ? "run-card overdue" : "run-card"} key={run.id}>
            <div>
              <span className="status-chip">{run.overdue ? "OVERDUE" : run.status}</span>
              <h3>{sites.find((site) => site.id === run.siteId)?.name ?? "Inspection target"}</h3>
              <p>Due {new Date(run.dueAt).toLocaleString()}</p>
            </div>
            {run.status === "REVIEW_REQUIRED" ? (
              <button className="signal-button" onClick={() => onReview(run.id)}>
                Approve review
              </button>
            ) : (
              <button className="secondary-button" onClick={() => onOpen(run.id)}>
                Open inspection
              </button>
            )}
          </article>
        ))}
        {!runs.length && (
          <div className="empty-state">
            No runs yet. Active plans generate only a bounded upcoming window.
          </div>
        )}
      </div>
    </>
  );
}

function RunExecution({
  organizationId,
  run,
  onBack,
  onChanged,
  onError,
}: {
  organizationId: string;
  run: RunDetail;
  onBack: () => void;
  onChanged: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const initial = useMemo(
    () => Object.fromEntries(run.responses.map((response) => [response.itemId, response.value])),
    [run.responses],
  );
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const items = run.template.sections.flatMap((section) => section.items);
  const completed = items.filter((item) => values[item.id] !== undefined).length;

  async function begin() {
    try {
      await api(`/v1/inspection-runs/${run.id}/start`, { method: "POST" }, organizationId);
      await onChanged();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Inspection could not start");
    }
  }
  async function submit() {
    try {
      await api(
        `/v1/inspection-runs/${run.id}/responses`,
        {
          method: "PUT",
          body: JSON.stringify({
            responses: Object.entries(values).map(([itemId, value]) => ({ itemId, value })),
          }),
        },
        organizationId,
      );
      await api(`/v1/inspection-runs/${run.id}/submit`, { method: "POST" }, organizationId);
      await onChanged();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Inspection could not be submitted");
    }
  }
  return (
    <>
      <button className="text-button" onClick={onBack}>
        ← Back to runs
      </button>
      <header className="view-heading">
        <div>
          <p className="eyebrow">GUIDED INSPECTION / {run.status}</p>
          <h1>Complete inspection</h1>
          <p>
            {completed} / {items.length} responses complete
          </p>
        </div>
      </header>
      {["ASSIGNED", "READY"].includes(run.status) ? (
        <button className="signal-button" onClick={() => void begin()}>
          Start inspection
        </button>
      ) : (
        <form
          className="inspection-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {run.template.sections.map((section) => (
            <fieldset key={section.id}>
              <legend>{section.title}</legend>
              {section.instructions && <p>{section.instructions}</p>}
              {section.items.map((item) => (
                <ResponseControl
                  item={item}
                  key={item.id}
                  onChange={(value) => setValues((current) => ({ ...current, [item.id]: value }))}
                  value={values[item.id]}
                />
              ))}
            </fieldset>
          ))}
          <button className="signal-button">
            Submit inspection <CheckCircle2 size={16} />
          </button>
        </form>
      )}
    </>
  );
}

function ResponseControl({
  item,
  value,
  onChange,
}: {
  item: RunDetail["template"]["sections"][number]["items"][number];
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const common = { required: item.required, "aria-describedby": `${item.id}-help` };
  return (
    <label className="response-control">
      <span>
        {item.label} {item.required && <b aria-label="required">*</b>}
      </span>
      {item.helpText && <small id={`${item.id}-help`}>{item.helpText}</small>}
      {["PASS_FAIL", "YES_NO"].includes(item.responseType) ? (
        <select
          {...common}
          onChange={(event) => onChange(event.target.value === "true")}
          value={value === undefined ? "" : String(value)}
        >
          <option value="">Select…</option>
          <option value="true">{item.responseType === "PASS_FAIL" ? "Pass" : "Yes"}</option>
          <option value="false">{item.responseType === "PASS_FAIL" ? "Fail" : "No"}</option>
        </select>
      ) : item.responseType === "SINGLE_CHOICE" ? (
        <select
          {...common}
          onChange={(event) => onChange(event.target.value)}
          value={String(value ?? "")}
        >
          <option value="">Select…</option>
          {item.options?.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : item.responseType === "LONG_TEXT" ? (
        <textarea
          {...common}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          value={String(value ?? "")}
        />
      ) : (
        <input
          {...common}
          onChange={(event) =>
            onChange(
              item.responseType === "NUMERIC" ? event.target.valueAsNumber : event.target.value,
            )
          }
          type={
            item.responseType === "NUMERIC"
              ? "number"
              : item.responseType === "DATE_TIME"
                ? "datetime-local"
                : "text"
          }
          value={String(value ?? "")}
        />
      )}
    </label>
  );
}

function RecordCards({
  records,
  empty,
}: {
  records: { id: string; title: string; meta: string }[];
  empty: string;
}) {
  return (
    <div className="record-cards">
      {records.map((record) => (
        <article key={record.id}>
          <CheckCircle2 size={18} />
          <div>
            <h3>{record.title}</h3>
            <p>{record.meta}</p>
          </div>
        </article>
      ))}
      {!records.length && (
        <div className="empty-state">
          <AlertTriangle size={18} /> {empty}
        </div>
      )}
    </div>
  );
}
