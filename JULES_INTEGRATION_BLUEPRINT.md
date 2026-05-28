# JULES_INTEGRATION_BLUEPRINT.md — Automated Cloud VM Architecture

This document defines the production-ready technical architecture, programmatic endpoints, config patterns, and CLI synchronization scripts required to integrate the **Google Jules** autonomous coding agent into the existing **Aegis / Paperclip / Hermes** multi-agent development engine.

---

## 1. High-Level Operations Pipeline

The integration positions Google Jules as an asynchronous execution squad member of the Aegis developer ecosystem. It coordinates with existing local resources to automate issue resolution, compile test cycles, and raise clean PRs without human intervention.

```
+------------------+         (Labeled Issue)         +-----------------------+
|  GitHub Repo     | ------------------------------> | julesWebhook           |
|  (Aegis Health)  |                                 | (Firebase Cloud Func) |
+------------------+                                 +-----------------------+
         ^                                                       |
         |                                                       | (REST Instantiation)
         |                                                       v
+------------------+       (CLI jules pull)          +-----------------------+
|  Local Workspace | <------------------------------ | Google Jules API      |
|  (WSL2 / Staging)|                                 | (Cloud Sandbox VM)     |
+------------------+                                 +-----------------------+
         |                                                       ^
         | (Code Plan Verification)                              |
         +-------------------------------------------------------+
                      (Gemini Pro Plan Auditor)
```

---

## 2. GitHub-Driven Event Webhook

The GitHub webhook acts as the automated trigger. When issues are tagged with specialized labels, the Firebase Functions webhook intercepts the payload, verifies authenticity, initiates the Google jules REST Session API, and logs credentials to user-isolated collection paths.

- **Trigger Labels:** `jules-fix` (issues/bugs), `jules-feature` (enhancements/features).
- **Core Verification:** Express middleware checks webhook headers using an HMAC-SHA256 signature calculated from a shared GitHub secret.
- **Data Isolation (Rule 1.F Compliance):** To prevent global collection conflicts, all tracking entries are appended underneath isolated dev profiles inside Firestore: `users/developer_agent_jules/julesSessions/{sessionId}`.

### File Reference: `functions/src/julesWebhook.ts`
*(Successfully deployed in Cloud Functions)*

---

## 3. Paperclip Orchestration & Pre-Execution Plan Audit

The **Paperclip Orchestrator** is the central scheduler that coordinates agent allocations. When it triggers Google Jules, it does so programmatically through an asynchronous pipeline containing:
1. **Exponential Backoff Connection Retries:** Resilient against transient third-party API gateway timeouts.
2. **Double-Pass Plan Validator (Gemini Pro):** Before Jules accesses the Cloud VM to rewrite files, its draft plan is audited against our architectural constraints (CORS wrappers, canvas height clamps, token optimization).
3. **Hermes Manager Failover Callback:** If Jules encounters continuous compiler hurdles or times out, the thread gracefully bubbles the diagnostic logs back to Hermes, releasing workspace queue mutex locks safely.

### File Reference: `functions/src/paperclipJulesCoordinator.ts`
*(Successfully deployed in Cloud Functions)*

---

## 4. Operational Configuration (`AGENTS.md`)

To guarantee Google Jules compiles and verifies its changes accurately while inside its remote sandbox VM, we have appended dedicated execution instructions to the main `AGENTS.md` configuration.

### Dependency Trees Setup Order
Jules must execute setups sequentially across both the container root and serverless function workspace layers before testing:
```bash
# Core front-end dependencies
npm ci || npm install

# Serverless function backend dependencies
cd functions && (npm ci || npm install) && cd ..
```

### Static Analysis & Verification Suite
Jules must test its tree state natively before checking in adjustments:
```bash
# Compilation Lint Verify
npm run lint

# Vitest suite test execution
npm run test
```

---

## 5. CLI Automated Pull and Staging Script

To synchronize changes created in the isolated Jules Cloud VM downstream into staging, we use a bash script utilizing the Google Jules CLI (`jules remote pull --session`). This script is designed to run automatically on our continuous integration (CI) runner.

### Key Operations:
1. Validates `jules` CLI tool-chain is installed.
2. Creates checkout branches locally in git to isolate regression testing.
3. Automatically triggers standard `npm run lint` and `npm run test` (Vitest run).
4. Optionally executes E2E regressions via **Playwright** browser models (`npx playwright test`).
5. Only pushes clean, green-compiled outputs upstream to staging repositories.

### File Reference: `scripts/jules-sync-staging.sh`
*(Executable shell wrapper configured under scripts directory)*
