#!/usr/bin/env bash
set -Eeuo pipefail

release_sha=${GITHUB_SHA:-$(git rev-parse HEAD)}
artifact_dir=${RELEASE_ARTIFACT_DIR:-release-artifacts}
api_name=nexus-rc-api
worker_name=nexus-rc-worker
web_name=nexus-rc-web
mkdir -p "$artifact_dir"

cleanup() {
  docker rm -f "$web_name" "$api_name" "$worker_name" >/dev/null 2>&1 || true
}
on_error() {
  local code=$? line=$1 command=$2
  echo "::error title=Release container rehearsal failed::line=$line command=$command exit=$code" >&2
  for container in "$web_name" "$api_name" "$worker_name"; do
    docker logs "$container" >&2 2>/dev/null || true
  done
  return "$code"
}
trap 'on_error "$LINENO" "$BASH_COMMAND"' ERR
trap cleanup EXIT

for service in worker api web; do
  args=()
  if [[ "$service" == web ]]; then
    args+=(--build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3001}")
  fi
  docker build "${args[@]}" -f "apps/$service/Dockerfile" -t "nexus-$service:$release_sha" .
done

{
  printf 'commit=%s\n' "$release_sha"
  printf 'next_public_api_url=%s\n' "${NEXT_PUBLIC_API_URL:-http://localhost:3001}"
  for service in worker api web; do
    image="nexus-$service:$release_sha"
    printf '%s_image_id=%s\n' "$service" "$(docker image inspect --format '{{.Id}}' "$image")"
    docker save "$image" | sha256sum | awk -v service="$service" '{print service "_archive_sha256=" $1}'
  done
} | tee "$artifact_dir/container-digests.txt"

wait_for_log() {
  local container=$1 pattern=$2
  for _ in $(seq 1 60); do
    docker logs "$container" 2>&1 | grep -q "$pattern" && return 0
    docker inspect --format '{{.State.Running}}' "$container" 2>/dev/null | grep -q true || break
    sleep 1
  done
  docker logs "$container" >&2 || true
  return 1
}

start_api() {
  docker run -d --name "$api_name" --network host --env-file .env -e NODE_ENV=production "nexus-api:$release_sha" >/dev/null
  for _ in $(seq 1 60); do
    curl --fail --silent http://localhost:3001/ready >/dev/null && return 0
    sleep 1
  done
  docker logs "$api_name" >&2 || true
  return 1
}

# Migrations and seed run before the worker -> API -> web startup sequence.
docker run -d --name "$worker_name" --network host --env-file .env -e NODE_ENV=production "nexus-worker:$release_sha" >/dev/null
wait_for_log "$worker_name" 'worker.ready'
start_api
docker run -d --name "$web_name" --network host --env-file .env -e NODE_ENV=production "nexus-web:$release_sha" >/dev/null
web_ready=false
for _ in $(seq 1 60); do
  if curl --fail --silent http://localhost:3000/signin >/dev/null; then
    web_ready=true
    break
  fi
  sleep 1
done
if [[ "$web_ready" != true ]]; then
  docker logs "$web_name" >&2 || true
  false
fi

# Replace the API while its dependencies and worker stay available.
docker stop --time 20 "$api_name" >/dev/null
test "$(docker inspect --format '{{.State.ExitCode}}' "$api_name")" = 0
docker rm "$api_name" >/dev/null
start_api

# Docker stop sends SIGTERM. Each candidate must drain and exit cleanly.
shutdown_failures=0
for container in "$web_name" "$api_name" "$worker_name"; do
  docker stop --time 30 "$container" >/dev/null
  exit_code=$(docker inspect --format '{{.State.ExitCode}}' "$container")
  if [[ "$exit_code" != 0 ]]; then
    docker logs "$container" >&2 || true
    echo "::error title=Container SIGTERM failed::$container exited with $exit_code" >&2
    shutdown_failures=$((shutdown_failures + 1))
  fi
done
[[ "$shutdown_failures" -eq 0 ]]

echo "Release container startup, readiness, replacement, and SIGTERM checks passed."
