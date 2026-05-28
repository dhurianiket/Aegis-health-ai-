#!/usr/bin/env bash
# ==============================================================================
# Aegis Health AI — Google Jules CLI Automated Sync and Regression Script
# ==============================================================================
# Usage: ./scripts/jules-sync-staging.sh --session <JULES_SESSION_ID> [Options]
#
# Description:
#   This automation script is invoked programmatically by the Paperclip orchestrator 
#   or run locally by developers in WSL2. It coordinates with the Google Jules CLI
#   (@google/jules), pulls downstream modifications, and triggers staging/E2E 
#   regression validations before promotion.
# ==============================================================================

set -eo pipefail

# ANSI color codes for high fidelity terminal diagnostics
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default Configuration
SESSION_ID=""
STAGING_BRANCH="staging/jules-regression"
RUN_E2E=false

# Helper function for printing structured status logs
log_info() {
    echo -e "${BLUE}[Jules CLI Sync]${NC} ${GREEN}INFO:${NC} $1"
}

log_warn() {
    echo -e "${BLUE}[Jules CLI Sync]${NC} ${YELLOW}WARNING:${NC} $1"
}

log_error() {
    echo -e "${BLUE}[Jules CLI Sync]${NC} ${RED}ERROR:${NC} $1" >&2
}

# 1. Parse Arguments
while [[ "$#" -gt 0 ]]; do
    case "$1" in
        --session)
            SESSION_ID="$2"
            shift 2
            ;;
        --branch)
            STAGING_BRANCH="$2"
            shift 2
            ;;
        --run-e2e)
            RUN_E2E=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Usage: $0 --session <SESSION_ID> [--branch <STAGING_BRANCH>] [--run-e2e]"
            exit 1
            ;;
    esac
done

# Check required parameters
if [ -z "$SESSION_ID" ]; then
    log_error "Missing required parameter: --session <SESSION_ID>"
    exit 1
fi

log_info "Commencing automated synchronisation pipeline for Google Jules Session: ${SESSION_ID}"

# 2. Verify Google Jules CLI installation
if ! command -v jules &> /dev/null; then
    log_error "Google 'jules' command-line utility was not found in the executable PATH."
    log_error "Please run 'npm install -g @google/jules' or authenticate your Google Cloud SDK."
    exit 127
fi

# 3. Create or checkout dedicated regression staging branch
log_info "Preparing git tree isolation space for sync tasks..."
git fetch origin main

# If regression branch already exists locally, delete and recreate it to protect staging state
if git show-ref --quiet refs/heads/"$STAGING_BRANCH"; then
    log_warn "Local branch '$STAGING_BRANCH' exists. Cleaning stale tree..."
    git checkout main
    git branch -D "$STAGING_BRANCH"
fi

git checkout -b "$STAGING_BRANCH" origin/main
log_info "Created isolated branch: ${STAGING_BRANCH}"

# 4. Pull modifications downstream utilizing the Google Jules CLI command-set
log_info "Calling Jules remote sync daemon..."
set +e
jules remote pull --session "$SESSION_ID"
exit_code=$?
set -e

if [ $exit_code -ne 0 ]; then
    log_error "Google Jules CLI remote pull operation encountered an unhandled error (Exit Code: $exit_code)."
    log_error "Verify network connectivity, GCP session tokens, and checkout scope."
    # Back to main and terminate
    git checkout main
    exit $exit_code
fi

log_info "Synchronisation of downstream VM edits complete! Commencing local sanity checks..."

# 5. Clean setup and Dependency Alignment
log_info "Starting clean local build initialization..."
npm ci

# Transition and restore packages in firebase cloud functions directory as well
log_info "Aligning Serverless Cloud functions dependency tree..."
cd functions
npm install
cd ..

# 6. Run Compilation Static Analysis Checks (Rulebook 3.B)
log_info "Executing static code evaluation (tsc)..."
if ! npm run lint; then
    log_error "Type compilation failures detected inside local directory tree."
    log_error "Rejecting synchronisation pull."
    git checkout main
    exit 1
fi
log_info "Type safety compilation tests passed."

# 7. Execute Local Vitest Unit Testing Framework
log_info "Kicking off standard test matrix (vitest run)..."
if ! npm run test; then
    log_error "Unit regression failures intercepted during Vitest validation run."
    log_error "Task rejected. Failures must be flagged to Paperclip coordinator."
    git checkout main
    exit 2
fi
log_info "Vitest sanity validation completed successfully."

# 8. Run Staging E2E Suite (Playwright) if requested
if [ "$RUN_E2E" = true ]; then
    log_info "Invoking intensive end-to-end regression validation (Playwright)..."
    if ! npx playwright test; then
        log_error "Playwright browser assertion test suite failed."
        log_error "Stopping branch promotion sequence."
        git checkout main
        exit 3
    fi
    log_info "E2E assertions completed successfully."
fi

# 9. Successful staging execution. Push regression branch to remote git hosting
log_info "All staging regression cycles verified green. Promoting branch to Git remote..."
git add .
git commit -m "jules-sync(session-${SESSION_ID:0:8}): automated code pull & regression audit" || true
git push -u origin "$STAGING_BRANCH" --force

log_info "Staging push successful! Raising PR target from ${STAGING_BRANCH} -> main"
log_info "Google Jules cloud VM synchronisation process succeeded."

exit 0
