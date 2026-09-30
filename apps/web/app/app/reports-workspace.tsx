"use client";

import { Download, FileText, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";

type Run = { id: string; status: string; scheduledFor: string };
type Report = {
  id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "EXPIRED";
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
};

export function ReportsWorkspace({ organizationId }: { organizationId: string }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [runId, setRunId] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(
    async (selected: string) => {
      if (!selected) {
        setReports([]);
        return;
      }
      const result = await api<{ data: Report[] }>(
        `/v1/inspection-runs/${selected}/reports`,
        {},
        organizationId,
      );
      setReports(result.data);
    },
    [organizationId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api<{ data: Run[] }>("/v1/inspection-runs", {}, organizationId);
      const reportable = result.data.filter((run) =>
        ["SUBMITTED", "REVIEW_REQUIRED", "APPROVED", "CLOSED"].includes(run.status),
      );
      setRuns(reportable);
      const selected = reportable.some((run) => run.id === runId)
        ? runId
        : (reportable[0]?.id ?? "");
      setRunId(selected);
      await loadReports(selected);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Reports could not be loaded");
    } finally {
      setLoading(false);
    }
  }, [loadReports, organizationId, runId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (!reports.some((report) => ["QUEUED", "PROCESSING"].includes(report.status))) return;
    const timer = window.setInterval(() => void loadReports(runId).catch(() => undefined), 2000);
    return () => window.clearInterval(timer);
  }, [loadReports, reports, runId]);

  async function requestReport() {
    if (!runId || busy) return;
    setBusy(true);
    setError("");
    try {
      await api(`/v1/inspection-runs/${runId}/reports`, { method: "POST" }, organizationId);
      await loadReports(runId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Report request failed");
    } finally {
      setBusy(false);
    }
  }

  async function retry(id: string) {
    setBusy(true);
    setError("");
    try {
      await api(`/v1/reports/${id}/retry`, { method: "POST" }, organizationId);
      await loadReports(runId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Report retry failed");
    } finally {
      setBusy(false);
    }
  }

  async function download(id: string) {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ data: { downloadUrl: string } }>(
        `/v1/reports/${id}/download`,
        {},
        organizationId,
      );
      window.location.assign(result.data.downloadUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Download authorization failed");
      setBusy(false);
    }
  }

  if (loading)
    return (
      <div className="empty-state" role="status">
        Loading report state…
      </div>
    );
  return (
    <section className="inspection-workspace" aria-labelledby="reports-heading">
      <header className="view-heading">
        <div>
          <p className="eyebrow">REPORTING / AUTHORITATIVE</p>
          <h2 id="reports-heading">Inspection reports</h2>
          <p>PDFs are generated from immutable submitted inspection data and private storage.</p>
        </div>
      </header>
      {error && (
        <div className="form-error" role="alert">
          {error} <button onClick={() => void load()}>Retry loading</button>
        </div>
      )}
      {!runs.length ? (
        <div className="empty-state">No submitted inspections are available for reporting.</div>
      ) : (
        <>
          <div className="inline-form">
            <label>
              Inspection run
              <select
                value={runId}
                onChange={(event) => {
                  const id = event.target.value;
                  setRunId(id);
                  void loadReports(id);
                }}
              >
                {runs.map((run) => (
                  <option key={run.id} value={run.id}>
                    {new Date(run.scheduledFor).toLocaleString()} ·{" "}
                    {run.status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <button className="signal-button" disabled={busy} onClick={() => void requestReport()}>
              <FileText size={16} />
              {busy ? "Working…" : "Request PDF"}
            </button>
          </div>
          <div className="data-table" aria-live="polite">
            <table>
              <thead>
                <tr>
                  <th scope="col">Requested</th>
                  <th scope="col">Status</th>
                  <th scope="col">Availability</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>{new Date(report.createdAt).toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${report.status.toLowerCase()}`}>
                        {report.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>
                      {report.status === "FAILED"
                        ? "Generation failed; retry is available."
                        : report.status === "EXPIRED"
                          ? "Artifact expired."
                          : report.status === "COMPLETED"
                            ? `Ready${report.expiresAt ? ` until ${new Date(report.expiresAt).toLocaleString()}` : ""}`
                            : "The server is generating this report."}
                    </td>
                    <td>
                      {report.status === "COMPLETED" && (
                        <button disabled={busy} onClick={() => void download(report.id)}>
                          <Download size={16} /> Download PDF
                        </button>
                      )}
                      {report.status === "FAILED" && (
                        <button disabled={busy} onClick={() => void retry(report.id)}>
                          <RefreshCw size={16} /> Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!reports.length && (
              <div className="empty-state">No report has been requested for this inspection.</div>
            )}
          </div>
        </>
      )}
      <ExportsPanel organizationId={organizationId} />
    </section>
  );
}

function ExportsPanel({ organizationId }: { organizationId: string }) {
  type ExportRecord = {
    id: string;
    exportType: "ASSETS" | "FINDINGS" | "INSPECTIONS";
    status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "EXPIRED";
    rowCount: number;
    createdAt: string;
  };
  const [exportType, setExportType] = useState<ExportRecord["exportType"]>("ASSETS");
  const [records, setRecords] = useState<ExportRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const result = await api<{ data: ExportRecord[] }>("/v1/exports", {}, organizationId);
    setRecords(result.data);
  }, [organizationId]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Exports could not be loaded"),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (!records.some((record) => ["QUEUED", "PROCESSING"].includes(record.status))) return;
    const timer = window.setInterval(() => void load().catch(() => undefined), 2000);
    return () => window.clearInterval(timer);
  }, [load, records]);
  async function requestExport() {
    setBusy(true);
    setError("");
    try {
      await api(
        "/v1/exports",
        { method: "POST", body: JSON.stringify({ exportType }) },
        organizationId,
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Export request failed");
    } finally {
      setBusy(false);
    }
  }
  async function act(record: ExportRecord, action: "retry" | "download") {
    setBusy(true);
    setError("");
    try {
      if (action === "retry")
        await api(`/v1/exports/${record.id}/retry`, { method: "POST" }, organizationId);
      else {
        const result = await api<{ data: { downloadUrl: string } }>(
          `/v1/exports/${record.id}/download`,
          {},
          organizationId,
        );
        window.location.assign(result.data.downloadUrl);
      }
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Export action failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-labelledby="exports-heading">
      <header className="view-heading">
        <div>
          <p className="eyebrow">EXPORTS / UTC SOURCE DATA</p>
          <h2 id="exports-heading">Operational CSV exports</h2>
          <p>
            Stable asset, finding, and inspection columns. Spreadsheet formulas are neutralized.
          </p>
        </div>
      </header>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <div className="inline-form">
        <label>
          Dataset
          <select
            value={exportType}
            onChange={(event) => setExportType(event.target.value as ExportRecord["exportType"])}
          >
            <option value="ASSETS">Assets</option>
            <option value="FINDINGS">Findings</option>
            <option value="INSPECTIONS">Inspections</option>
          </select>
        </label>
        <button className="signal-button" disabled={busy} onClick={() => void requestExport()}>
          <FileText size={16} />
          {busy ? "Working…" : "Request CSV"}
        </button>
      </div>
      <div className="data-table" aria-live="polite">
        <table>
          <thead>
            <tr>
              <th scope="col">Dataset</th>
              <th scope="col">Rows</th>
              <th scope="col">Status</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.exportType}</td>
                <td>{record.rowCount}</td>
                <td>{record.status.replaceAll("_", " ")}</td>
                <td>
                  {record.status === "COMPLETED" && (
                    <button disabled={busy} onClick={() => void act(record, "download")}>
                      <Download size={16} /> Download CSV
                    </button>
                  )}
                  {record.status === "FAILED" && (
                    <button disabled={busy} onClick={() => void act(record, "retry")}>
                      <RefreshCw size={16} /> Retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!records.length && (
          <div className="empty-state">No operational export has been requested.</div>
        )}
      </div>
    </section>
  );
}
