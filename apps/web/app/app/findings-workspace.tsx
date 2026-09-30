"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";

type Member = { id: string; name: string; status?: string };
type Finding = {
  id: string;
  title: string;
  severity: string;
  status: string;
  siteId: string;
  assetId: string | null;
  detectedAt: string;
};
type Action = {
  id: string;
  findingId: string;
  title: string;
  assignedTo: string;
  priority: string;
  dueAt: string;
  status: string;
  overdue: boolean;
};
type FindingDetail = Finding & {
  history: { id: string; fromStatus: string | null; toStatus: string; createdAt: string }[];
  actionHistory: { id: string; fromStatus: string | null; toStatus: string; createdAt: string }[];
  evidence: { id: string; targetType: string; uploadedAt: string; note: string | null }[];
};

export function FindingsWorkspace({
  organizationId,
  members,
}: {
  organizationId: string;
  members: Member[];
}) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [assignees, setAssignees] = useState<Member[]>(members);
  const [status, setStatus] = useState("ALL");
  const [severity, setSeverity] = useState("ALL");
  const [selected, setSelected] = useState<Finding | null>(null);
  const [detail, setDetail] = useState<FindingDetail | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [findingResult, actionResult] = await Promise.all([
        api<{ data: Finding[] }>("/v1/findings", {}, organizationId),
        api<{ data: Action[] }>("/v1/actions", {}, organizationId),
      ]);
      setFindings(findingResult.data);
      setActions(actionResult.data);
      try {
        const assigneeResult = await api<{ data: Member[] }>(
          "/v1/actions/eligible-assignees",
          {},
          organizationId,
        );
        setAssignees(assigneeResult.data);
      } catch {
        setAssignees(members);
      }
      setSelected((current) =>
        current ? (findingResult.data.find((item) => item.id === current.id) ?? null) : null,
      );
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load findings");
    }
  }, [members, organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (!selected) {
      return;
    }
    const timer = window.setTimeout(() => {
      void api<{ data: FindingDetail }>(`/v1/findings/${selected.id}`, {}, organizationId)
        .then((result) => setDetail(result.data))
        .catch((error: unknown) =>
          setMessage(error instanceof Error ? error.message : "Could not load finding history"),
        );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [organizationId, selected]);

  const visible = useMemo(
    () =>
      findings.filter(
        (item) =>
          (status === "ALL" || item.status === status) &&
          (severity === "ALL" || item.severity === severity),
      ),
    [findings, severity, status],
  );
  const selectedAction = actions.find((item) => item.findingId === selected?.id);

  async function command(path: string, body?: unknown) {
    setBusy(true);
    try {
      await api(
        path,
        { method: "POST", ...(body === undefined ? {} : { body: JSON.stringify(body) }) },
        organizationId,
      );
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The transition failed");
    } finally {
      setBusy(false);
    }
  }

  async function createAction(form: FormData) {
    if (!selected) return;
    await command(`/v1/findings/${selected.id}/actions`, {
      title: form.get("title"),
      description: form.get("description"),
      assignedTo: form.get("assignedTo"),
      priority: form.get("priority"),
      dueAt: new Date(String(form.get("dueAt"))).toISOString(),
    });
  }

  async function uploadEvidence(form: FormData) {
    if (!selectedAction) return;
    const file = form.get("evidence") as File;
    const checksum = [
      ...new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())),
    ]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
    setBusy(true);
    try {
      const authorization = await api<{
        data: {
          uploadGrantId: string;
          uploadUrl: string;
          requiredHeaders: Record<string, string>;
        };
      }>(
        "/v1/uploads/authorize",
        {
          method: "POST",
          body: JSON.stringify({
            targetType: "CORRECTIVE_ACTION",
            targetId: selectedAction.id,
            originalName: file.name,
            contentType: file.type,
            contentLength: file.size,
            checksum,
          }),
        },
        organizationId,
      );
      const uploaded = await fetch(authorization.data.uploadUrl, {
        method: "PUT",
        headers: authorization.data.requiredHeaders,
        body: file,
      });
      if (!uploaded.ok) throw new Error("Evidence upload failed");
      await api(
        "/v1/evidence",
        {
          method: "POST",
          body: JSON.stringify({
            uploadGrantId: authorization.data.uploadGrantId,
            capturedAt: new Date(file.lastModified).toISOString(),
          }),
        },
        organizationId,
      );
      setMessage("Evidence uploaded and verified.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Evidence upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function openEvidence(id: string) {
    try {
      const response = await api<{ data: { downloadUrl: string } }>(
        `/v1/evidence/${id}/download`,
        {},
        organizationId,
      );
      window.open(response.data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Evidence download failed");
    }
  }

  return (
    <div className="phase-three-layout">
      <section className="data-section">
        <header>
          <div>
            <h2>Finding queue</h2>
            <p>Tenant-scoped operational findings ordered by severity.</p>
          </div>
          <div className="filter-row">
            <select aria-label="Filter finding status" onChange={(e) => setStatus(e.target.value)}>
              <option>ALL</option>
              <option>OPEN</option>
              <option>ACKNOWLEDGED</option>
              <option>ACTION_REQUIRED</option>
              <option>IN_PROGRESS</option>
              <option>READY_FOR_VERIFICATION</option>
              <option>VERIFIED</option>
              <option>CLOSED</option>
              <option>DISMISSED</option>
            </select>
            <select
              aria-label="Filter finding severity"
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option>ALL</option>
              <option>CRITICAL</option>
              <option>HIGH</option>
              <option>MEDIUM</option>
              <option>LOW</option>
            </select>
          </div>
        </header>
        {message && (
          <p aria-live="polite" className="error-banner">
            {message}
          </p>
        )}
        <div className="finding-list">
          {visible.map((finding) => (
            <button
              className={selected?.id === finding.id ? "finding-card active" : "finding-card"}
              key={finding.id}
              onClick={() => {
                setDetail(null);
                setSelected(finding);
              }}
            >
              <span>{finding.severity}</span>
              <strong>{finding.title}</strong>
              <small>{finding.status.replaceAll("_", " ")}</small>
            </button>
          ))}
          {!visible.length && <div className="empty-state">No findings match these filters.</div>}
        </div>
      </section>
      <section className="data-section finding-detail">
        {!selected ? (
          <div className="empty-state">Select a finding to inspect its lifecycle.</div>
        ) : (
          <>
            <header>
              <div>
                <p className="eyebrow">FINDING / {selected.severity}</p>
                <h2>{selected.title}</h2>
                <p>{selected.status.replaceAll("_", " ")}</p>
              </div>
            </header>
            <div className="command-row">
              {selected.status === "OPEN" && (
                <button
                  disabled={busy}
                  onClick={() => void command(`/v1/findings/${selected.id}/acknowledge`)}
                >
                  Acknowledge
                </button>
              )}
              {selected.status === "VERIFIED" && (
                <button
                  disabled={busy}
                  onClick={() => void command(`/v1/findings/${selected.id}/close`)}
                >
                  Close finding
                </button>
              )}
            </div>
            {!selectedAction && !["CLOSED", "DISMISSED"].includes(selected.status) && (
              <form action={createAction} className="stack-form">
                <h3>Create corrective action</h3>
                <input name="title" placeholder="Action title" required />
                <textarea name="description" placeholder="Required remediation" required />
                <select name="assignedTo" required>
                  <option value="">Active assignee</option>
                  {assignees
                    .filter((member) => member.status === undefined || member.status === "ACTIVE")
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                </select>
                <select name="priority">
                  <option>CRITICAL</option>
                  <option>HIGH</option>
                  <option>MEDIUM</option>
                  <option>LOW</option>
                </select>
                <input aria-label="Due date" name="dueAt" required type="datetime-local" />
                <button disabled={busy}>Create action</button>
              </form>
            )}
            {selectedAction && (
              <div className="action-panel">
                <p className="eyebrow">CORRECTIVE ACTION / {selectedAction.priority}</p>
                <h3>{selectedAction.title}</h3>
                <p>
                  {selectedAction.status.replaceAll("_", " ")}
                  {selectedAction.overdue ? " · OVERDUE" : ""}
                </p>
                <div className="command-row">
                  {selectedAction.status === "OPEN" && (
                    <button
                      disabled={busy}
                      onClick={() => void command(`/v1/actions/${selectedAction.id}/start`)}
                    >
                      Start
                    </button>
                  )}
                  {selectedAction.status === "IN_PROGRESS" && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        void command(`/v1/actions/${selectedAction.id}/block`, {
                          note: "Blocked by field conditions",
                        })
                      }
                    >
                      Block
                    </button>
                  )}
                  {["BLOCKED", "VERIFICATION_REQUIRED"].includes(selectedAction.status) && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        void command(`/v1/actions/${selectedAction.id}/return`, {
                          note: "Returned for additional work",
                        })
                      }
                    >
                      Return to work
                    </button>
                  )}
                  {selectedAction.status === "VERIFICATION_REQUIRED" && (
                    <button
                      disabled={busy}
                      onClick={() => void command(`/v1/actions/${selectedAction.id}/verify`)}
                    >
                      Verify
                    </button>
                  )}
                </div>
                {selectedAction.status === "IN_PROGRESS" && (
                  <>
                    <form action={uploadEvidence} className="stack-form">
                      <label>
                        Completion evidence
                        <input
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          name="evidence"
                          required
                          type="file"
                        />
                      </label>
                      <button disabled={busy}>Upload evidence</button>
                    </form>
                    <form
                      action={(form) =>
                        command(`/v1/actions/${selectedAction.id}/complete`, {
                          completionNotes: form.get("completionNotes"),
                        })
                      }
                      className="stack-form"
                    >
                      <textarea name="completionNotes" placeholder="Completion notes" required />
                      <button disabled={busy}>Submit for verification</button>
                    </form>
                  </>
                )}
              </div>
            )}
            {detail && (
              <div className="action-panel">
                <h3>Immutable history</h3>
                {[...(detail.history ?? []), ...(detail.actionHistory ?? [])]
                  .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
                  .map((event) => (
                    <p key={event.id}>
                      {event.fromStatus ?? "CREATED"} → {event.toStatus.replaceAll("_", " ")}
                    </p>
                  ))}
                <h3>Evidence</h3>
                {(detail.evidence ?? []).map((item) => (
                  <button key={item.id} onClick={() => void openEvidence(item.id)}>
                    Open authorized evidence
                  </button>
                ))}
                {!(detail.evidence ?? []).length && <p>No evidence attached yet.</p>}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export function GlobalSearch({ organizationId }: { organizationId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { type: string; id: string; title: string; subtitle: string | null }[]
  >([]);
  const [message, setMessage] = useState("");
  async function search(form: FormData) {
    const q = String(form.get("q") ?? "").trim();
    setQuery(q);
    try {
      const response = await api<{ data: typeof results }>(
        `/v1/search?q=${encodeURIComponent(q)}`,
        {},
        organizationId,
      );
      setResults(response.data);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search failed");
    }
  }
  return (
    <section className="data-section">
      <header>
        <div>
          <h2>Global operational search</h2>
          <p>Sites, assets, findings, and corrective actions.</p>
        </div>
      </header>
      <form action={search} className="inline-form">
        <input
          aria-label="Global search"
          defaultValue={query}
          name="q"
          placeholder="Identifier or title"
          required
        />
        <button>Search</button>
      </form>
      {message && <p className="error-banner">{message}</p>}
      <div className="finding-list">
        {results.map((result) => (
          <article className="finding-card" key={`${result.type}-${result.id}`}>
            <span>{result.type.replaceAll("_", " ")}</span>
            <strong>{result.title}</strong>
            <small>{result.subtitle ?? "—"}</small>
          </article>
        ))}
        {query && !results.length && <div className="empty-state">No tenant-scoped matches.</div>}
      </div>
    </section>
  );
}
