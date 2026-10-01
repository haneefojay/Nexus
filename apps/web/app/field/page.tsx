"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  AlertTriangle,
  Camera,
  Check,
  Cloud,
  CloudOff,
  Download,
  RefreshCw,
  ShieldAlert,
  Wifi,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { fieldDb, type CachedAssignment, type CachedFieldContext } from "@/lib/field-db";
import {
  captureEvidence,
  discardRecoverableRun,
  downloadAssignments,
  inspectRecoveryRecord,
  locallySubmit,
  retryCommand,
  saveDraft,
  synchronizeContext,
} from "@/lib/field-sync";

type Organization = { id: string; name: string; role: string };

export default function FieldPage() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [contextKey, setContextKey] = useState("");
  const [selectedRunId, setSelectedRunId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const unsupported =
    typeof window !== "undefined" &&
    (!("indexedDB" in window) || !("serviceWorker" in navigator) || !crypto.subtle)
      ? "This browser cannot safely store offline field work. Use a current Chromium, Safari, or Firefox release."
      : "";

  const context = useLiveQuery(
    () => (contextKey ? fieldDb.contexts.get(contextKey) : undefined),
    [contextKey],
  );
  const assignments =
    useLiveQuery(
      () =>
        contextKey
          ? fieldDb.assignments.where("contextKey").equals(contextKey).sortBy("downloadedAt")
          : [],
      [contextKey],
    ) ?? [];
  const selected =
    assignments.find((assignment) => assignment.inspectionRunId === selectedRunId) ??
    assignments[0];

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    void fieldDb.contexts
      .where("state")
      .equals("ACTIVE")
      .reverse()
      .sortBy("lastSynchronizedAt")
      .then((contexts) => {
        const latest = contexts.at(-1);
        if (latest) {
          setContextKey(latest.contextKey);
          setOrganizationId(latest.organizationId);
        }
      });
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!online) return;
    void api<{ data: Organization[] }>("/v1/organizations")
      .then(({ data }) => {
        setOrganizations(data);
        if (!organizationId) setOrganizationId(data[0]?.id ?? "");
      })
      .catch(() => setMessage("Authentication expired. Cached work remains on this device."));
  }, [online, organizationId]);

  const prepare = useCallback(async () => {
    if (!organizationId) return;
    setBusy(true);
    setMessage("");
    try {
      const active = await downloadAssignments(organizationId);
      setContextKey(active.contextKey);
      setMessage("Assignments are available offline on this device.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Assignments could not be downloaded");
    } finally {
      setBusy(false);
    }
  }, [organizationId]);

  const synchronize = useCallback(async () => {
    if (!context) return;
    setBusy(true);
    setMessage("");
    try {
      await synchronizeContext(context);
      setMessage("Synchronization pass completed. Check each assignment state below.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Synchronization paused");
    } finally {
      setBusy(false);
    }
  }, [context]);

  useEffect(() => {
    if (!online || !context || busy) return;
    const timer = window.setTimeout(() => void synchronizeContext(context), 300);
    return () => window.clearTimeout(timer);
  }, [online, context, busy]);

  if (unsupported)
    return (
      <main className="field-shell field-centered">
        <ShieldAlert aria-hidden="true" size={36} />
        <h1>Offline field mode unavailable</h1>
        <p>{unsupported}</p>
        <Link className="field-button" href="/app">
          Return to online operations
        </Link>
      </main>
    );

  return (
    <main className="field-shell">
      <header className="field-header">
        <div>
          <p className="eyebrow">NEXUS / FIELD MODE</p>
          <h1>Inspection field kit</h1>
        </div>
        <div aria-live="polite" className={`connection-pill ${online ? "online" : "offline"}`}>
          {online ? <Wifi size={16} /> : <WifiOff size={16} />}
          {online ? "Online" : "Offline"}
        </div>
      </header>

      <section className="field-prepare" aria-label="Assignment preparation">
        <div>
          <strong>{context?.organizationName ?? "No field context downloaded"}</strong>
          <span>
            {context
              ? `Last synchronized ${new Date(context.lastSynchronizedAt).toLocaleString()}`
              : "Connect to download assigned inspections before going offline."}
          </span>
        </div>
        {online && (
          <select
            aria-label="Organization to prepare"
            onChange={(event) => setOrganizationId(event.target.value)}
            value={organizationId}
          >
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        )}
        <button className="field-button" disabled={!online || busy} onClick={prepare}>
          <Download size={17} /> {context ? "Refresh assignments" : "Prepare offline"}
        </button>
        <button
          className="field-button secondary"
          disabled={!online || !context || busy}
          onClick={synchronize}
        >
          <RefreshCw className={busy ? "spin" : ""} size={17} /> Synchronize
        </button>
      </section>

      <p aria-live="polite" className="field-announcement">
        {message}
      </p>

      {!context && (
        <section className="field-empty">
          <CloudOff size={32} />
          <h2>No offline-ready assignments</h2>
          <p>
            Connect, authenticate, and choose “Prepare offline” before leaving network coverage.
          </p>
        </section>
      )}

      {context && (
        <div className="field-grid">
          <aside className="field-assignment-list" aria-label="Downloaded assignments">
            <h2>Downloaded work</h2>
            {assignments.map((assignment) => (
              <button
                className={selected?.key === assignment.key ? "active" : ""}
                key={assignment.key}
                onClick={() => setSelectedRunId(assignment.inspectionRunId)}
              >
                <span>{String(assignment.site.name ?? "Inspection")}</span>
                <StateBadge state={assignment.localStatus} />
              </button>
            ))}
            {!assignments.length && (
              <p className="field-muted">No eligible assignments were returned.</p>
            )}
          </aside>
          {selected && <InspectionExecution context={context} assignment={selected} />}
        </div>
      )}
    </main>
  );
}

function InspectionExecution({
  context,
  assignment,
}: {
  context: CachedFieldContext;
  assignment: CachedAssignment;
}) {
  const draft = useLiveQuery(() => fieldDb.drafts.get(assignment.key), [assignment.key]);
  const commands =
    useLiveQuery(
      () => fieldDb.commands.where("inspectionRunId").equals(assignment.inspectionRunId).toArray(),
      [assignment.inspectionRunId],
    ) ?? [];
  const evidence =
    useLiveQuery(
      () => fieldDb.evidence.where("inspectionRunId").equals(assignment.inspectionRunId).toArray(),
      [assignment.inspectionRunId],
    ) ?? [];
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [notes, setNotes] = useState("");
  const [photoNote, setPhotoNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setResponses(draft?.responses ?? {});
      setNotes(draft?.notes ?? "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [draft, assignment.key]);

  const items = useMemo(
    () => assignment.snapshot.template.sections.flatMap((section) => section.items),
    [assignment],
  );
  const completed = items.filter(
    (item) => responses[item.id] !== undefined && responses[item.id] !== "",
  ).length;
  const locked = Boolean(draft?.locallySubmittedAt);

  async function persist() {
    setError("");
    try {
      await saveDraft(assignment, responses, notes);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Draft could not be saved");
    }
  }

  async function submit() {
    if (!draft) return;
    if (
      !window.confirm(
        "Submit this inspection on this device? It will remain pending until the server confirms synchronization.",
      )
    )
      return;
    setError("");
    try {
      await locallySubmit(context, assignment, { ...draft, responses, notes });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Local submission failed");
    }
  }

  async function addPhoto(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      await captureEvidence(assignment, file, photoNote);
      setPhotoNote("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Photo could not be stored");
    }
  }

  async function downloadRecovery() {
    const record = await inspectRecoveryRecord(context.contextKey, assignment.inspectionRunId);
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(record, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexus-field-recovery-${assignment.inspectionRunId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="field-execution">
      <header>
        <div>
          <p className="eyebrow">ASSIGNMENT / {assignment.inspectionRunId.slice(0, 8)}</p>
          <h2>{String(assignment.site.name ?? "Field inspection")}</h2>
          <p>
            {String(assignment.asset?.name ?? assignment.site.address ?? "Site inspection")} · due{" "}
            {new Date(assignment.snapshot.dueAt).toLocaleString()}
          </p>
        </div>
        <StateBadge state={assignment.localStatus} />
      </header>

      <div
        aria-label={`${completed} of ${items.length} responses complete`}
        aria-valuemax={items.length}
        aria-valuemin={0}
        aria-valuenow={completed}
        className="field-progress"
        role="progressbar"
      >
        <i style={{ width: `${items.length ? (completed / items.length) * 100 : 0}%` }} />
      </div>
      <p className="field-muted">
        {completed} of {items.length} responses complete
      </p>

      {assignment.snapshot.template.sections.map((section, sectionIndex) => (
        <fieldset disabled={locked} key={section.id ?? `${sectionIndex}-${section.title}`}>
          <legend>{section.title}</legend>
          {section.instructions && <p>{section.instructions}</p>}
          {section.items.map((item) => (
            <ResponseControl
              item={item}
              key={item.id}
              onChange={(value) => setResponses((current) => ({ ...current, [item.id]: value }))}
              value={responses[item.id]}
            />
          ))}
        </fieldset>
      ))}

      <label className="field-control">
        Inspection notes
        <textarea
          disabled={locked}
          onChange={(event) => setNotes(event.target.value)}
          value={notes}
        />
      </label>

      <section className="field-evidence">
        <h3>
          <Camera size={18} /> Photos stored on this device
        </h3>
        {!locked && (
          <>
            <input
              accept="image/jpeg,image/png,image/webp"
              aria-label="Capture or choose inspection photo"
              capture="environment"
              onChange={(event) => void addPhoto(event.target.files?.[0])}
              type="file"
            />
            <input
              aria-label="Photo note"
              onChange={(event) => setPhotoNote(event.target.value)}
              placeholder="Optional photo note"
              value={photoNote}
            />
          </>
        )}
        {evidence.map((item) => (
          <div key={item.evidenceId}>
            <span>{item.fileName}</span>
            <small>{item.state.replaceAll("_", " ")}</small>
          </div>
        ))}
      </section>

      {error && (
        <p aria-live="assertive" className="field-error">
          <AlertTriangle size={16} /> {error}
        </p>
      )}

      <div className="field-actions">
        {!locked && (
          <>
            <button className="field-button secondary" onClick={() => void persist()}>
              Save on device
            </button>
            <button className="field-button" onClick={() => void submit()}>
              Confirm local submission
            </button>
          </>
        )}
      </div>

      <section className="field-queue" aria-label="Synchronization queue">
        <h3>Synchronization queue</h3>
        {commands.map((command) => (
          <div key={command.commandId}>
            <span>
              {command.sequence}. {command.type.replaceAll("_", " ")}
            </span>
            <small>{command.state.replaceAll("_", " ")}</small>
            {["RETRYABLE", "PERMANENT_FAILURE", "AUTH_REQUIRED"].includes(command.state) && (
              <button onClick={() => void retryCommand(command.commandId)}>Retry</button>
            )}
          </div>
        ))}
        {!commands.length && <p className="field-muted">No commands are queued.</p>}
        {commands.some((command) =>
          ["CONFLICT", "PERMANENT_FAILURE", "AUTH_REQUIRED"].includes(command.state),
        ) && (
          <div className="field-recovery">
            <p>
              Server confirmation is blocked. Refresh authoritative assignments, sign in again, or
              keep a recovery record before discarding local work.
            </p>
            <button onClick={() => void downloadRecovery()}>Download recovery record</button>
            <button
              onClick={() => {
                if (window.confirm("Discard the unsynchronized local copy from this device?"))
                  void discardRecoverableRun(context.contextKey, assignment.inspectionRunId);
              }}
            >
              Discard local copy
            </button>
            {commands.some((command) => command.state === "AUTH_REQUIRED") && (
              <Link href="/signin">Reauthenticate</Link>
            )}
          </div>
        )}
      </section>
    </section>
  );
}

function ResponseControl({
  item,
  value,
  onChange,
}: {
  item: CachedAssignment["snapshot"]["template"]["sections"][number]["items"][number];
  value: unknown;
  onChange(value: unknown): void;
}) {
  const label = (
    <>
      {item.label} {item.required && <span aria-label="required">*</span>}
    </>
  );
  if (["PASS_FAIL", "YES_NO"].includes(item.responseType)) {
    const options = item.responseType === "PASS_FAIL" ? ["PASS", "FAIL"] : ["YES", "NO"];
    return (
      <div className="field-control">
        <span>{label}</span>
        <div className="field-choice">
          {options.map((option) => (
            <button
              aria-pressed={value === option}
              key={option}
              onClick={() => onChange(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (item.responseType === "SINGLE_CHOICE")
    return (
      <label className="field-control">
        {label}
        <select onChange={(event) => onChange(event.target.value)} value={String(value ?? "")}>
          <option value="">Choose…</option>
          {item.options?.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
    );
  if (item.responseType === "NUMERIC")
    return (
      <label className="field-control">
        {label}
        <input
          max={item.maximum}
          min={item.minimum}
          onChange={(event) =>
            onChange(event.target.value === "" ? "" : Number(event.target.value))
          }
          type="number"
          value={typeof value === "number" ? value : ""}
        />
      </label>
    );
  return (
    <label className="field-control">
      {label}
      {item.responseType === "LONG_TEXT" ? (
        <textarea onChange={(event) => onChange(event.target.value)} value={String(value ?? "")} />
      ) : (
        <input onChange={(event) => onChange(event.target.value)} value={String(value ?? "")} />
      )}
    </label>
  );
}

function StateBadge({ state }: { state: CachedAssignment["localStatus"] }) {
  const icon =
    state === "SYNCHRONIZED" ? (
      <Check size={14} />
    ) : ["FAILED", "CONFLICTED"].includes(state) ? (
      <AlertTriangle size={14} />
    ) : state === "READY" ? (
      <CloudOff size={14} />
    ) : (
      <Cloud size={14} />
    );
  return (
    <span className={`field-state ${state.toLowerCase()}`}>
      {icon} {state.replaceAll("_", " ")}
    </span>
  );
}
