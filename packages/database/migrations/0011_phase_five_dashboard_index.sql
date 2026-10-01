CREATE INDEX inspection_runs_coverage_idx
  ON inspection_runs (organization_id, site_id, scheduled_for, status);
