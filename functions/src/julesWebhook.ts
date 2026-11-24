import { onRequest } from "firebase-functions/v2/https";
import * as crypto from "crypto";
import { getFirestore } from "firebase-admin/firestore";
import { hasForbiddenKeys, isPlainObject } from "./validation";

// Google Cloud Project & Jules API Config
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || "aegis-health-app-90697";
const JULES_API_URL = `https://jules.googleapis.com/v1/projects/${GCP_PROJECT_ID}/sessions`;

// Invariant Matcher: Developer user ID for tracking autonomous tasks in isolated user-specific subcollections (AGENTS.md Rule 1.F compliance)
const ADMIN_DEV_USER_ID = "developer_agent_jules";

/**
 * Verify GitHub webhook signature using HMAC-SHA256 in constant time.
 */
function verifySignature(payload: string, signature: string | string[] | undefined, secret: string | undefined): boolean {
  if (!secret) {
    console.error("GITHUB_WEBHOOK_SECRET environment variable is missing.");
    return false;
  }
  if (!signature) return false;

  const checkSig = Array.isArray(signature) ? signature[0] : signature;
  if (typeof checkSig !== "string") return false;
  const match = checkSig.match(/^sha256=([0-9a-f]{64})$/i);
  if (!match) return false;

  const calculatedDigest = crypto.createHmac("sha256", secret).update(payload).digest();
  const providedDigest = Buffer.from(match[1], "hex");

  if (calculatedDigest.length !== 32 || providedDigest.length !== 32) {
    return false;
  }

  return crypto.timingSafeEqual(calculatedDigest, providedDigest);
}

/**
 * HTTP Triggered function to handle GitHub Webhooks.
 * Intercepts labeled issues ("jules-fix", "jules-feature") and kicks off a Jules cloud VM session.
 */
export const handleGitHubWebhook = onRequest(
  { secrets: ["GITHUB_WEBHOOK_SECRET", "GEMINI_API_KEY"] },
  async (req: any, res: any) => {
    try {
      const rawBody = req.rawBody?.toString();
      if (!rawBody) {
        res.status(400).send("Bad Request: Missing request body.");
        return;
      }

      // 1. Signature Verification (Defensive Guard — SHA-256 only)
      const githubSignature = req.headers["x-github-signature-256"];
      const secret = process.env.GITHUB_WEBHOOK_SECRET;

      if (!verifySignature(rawBody, githubSignature, secret)) {
        console.warn("Invalid webhook signature intercepted.");
        res.status(401).send("Unauthorized Webhook Call.");
        return;
      }

      const eventType = req.headers["x-github-event"];
      if (eventType !== "issues") {
        res.status(200).send(`Ignored non-issue event type: ${eventType}`);
        return;
      }

      const body = req.body;
      if (!isPlainObject(body) || hasForbiddenKeys(body)) {
        res.status(400).send("Bad Request: Invalid or unsafe JSON payload.");
        return;
      }
      const action = typeof body.action === "string" ? body.action : "";
      const rawIssue = body.issue;

      if (!isPlainObject(rawIssue) || typeof rawIssue.number !== "number" || typeof rawIssue.title !== "string") {
        res.status(400).send("No valid issue object found in payload.");
        return;
      }

      // We only care about labeling events that apply "jules-fix" or "jules-feature"
      if (action !== "labeled") {
        res.status(200).send(`Ignored issue action: ${action}`);
        return;
      }

      const rawLabel = body.label;
      const addedLabel = isPlainObject(rawLabel) && typeof rawLabel.name === "string" ? rawLabel.name : undefined;
      if (addedLabel !== "jules-fix" && addedLabel !== "jules-feature") {
        res.status(200).send(`Ignored label addition: ${addedLabel}`);
        return;
      }

      const rawRepo = body.repository;
      if (!isPlainObject(rawRepo) || typeof rawRepo.clone_url !== "string") {
        res.status(400).send("No valid repository clone_url found in payload.");
        return;
      }

      const issueNumber = rawIssue.number;
      const issueTitle = rawIssue.title;
      const issueBody = typeof rawIssue.body === "string" && rawIssue.body ? rawIssue.body : "No description provided.";
      const repoUrl = rawRepo.clone_url;
      const headBranch = `jules/branch-issue-${issueNumber}`;

      console.log(`🚀 GitHub Issue #${issueNumber} labeled with '${addedLabel}'. Starting Jules integration flow...`);

      // Construct a pristine system prompt telling Jules what to do
      const directive = addedLabel === "jules-fix" 
        ? "BUG_FIX_WORKFLOW" 
        : "FEATURE_IMPLEMENTATION_WORKFLOW";

      const julesPrompt = `
Task Directive: ${directive}
Issue Title: ${issueTitle}
Issue Description:
---
${issueBody}
---
Repository Context: Aegis Health AI
Target Branch: ${headBranch}
Instructions: Run 'npm test' inside your sandboxed VM environment to verify changes before raising a pull request.
Ensure your code adheres strictly to the invariants listed in AGENTS.md.
`;

      // 3. Programmatically Call Google Jules REST API
      const julesToken = process.env.JULES_AUTH_TOKEN || process.env.GOOGLE_ADC_TOKEN;
      if (!julesToken) {
        console.warn("⚠️ JULES_AUTH_TOKEN is not configured; failing closed for Google Jules API call.");
        return res.status(503).json({
          status: "skipped",
          message: "Jules VM automation paused: JULES_AUTH_TOKEN required."
        });
      }

      const julesPayload = {
        repository: {
          url: repoUrl,
          branch: "main"
        },
        sessionOptions: {
          targetBranch: headBranch,
          prompt: julesPrompt,
          enableCloudBuildTests: true,
        }
      };

      console.log("Invoking Google Jules API: POST", JULES_API_URL);
      
      const julesResponse = await fetch(JULES_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${julesToken}`,
        },
        body: JSON.stringify(julesPayload)
      });

      if (!julesResponse.ok) {
        const errText = await julesResponse.text();
        throw new Error(`Jules API Call failed: ${julesResponse.status} - ${errText}`);
      }

      const julesResult = await julesResponse.json() as {
        sessionId: string;
        sessionUrl: string;
        status: string;
      };

      console.log(`Jules VM spawned successfully. SessionID: ${julesResult.sessionId}`);

      // 4. Persistence of Jules Tracking Session following Invariant Rule F:
      // Writes are securely isolated underneath developer specific subcollections.
      const db = getFirestore();
      const sessionRef = db
        .collection("users")
        .doc(ADMIN_DEV_USER_ID)
        .collection("julesSessions")
        .doc(julesResult.sessionId);

      await sessionRef.set({
        sessionId: julesResult.sessionId,
        sessionUrl: julesResult.sessionUrl,
        issueNumber,
        issueTitle: issueTitle,
        labelApplied: addedLabel,
        status: "SPAWNED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      res.status(200).json({
        message: "Jules session successfully launched.",
        sessionId: julesResult.sessionId,
        sessionUrl: julesResult.sessionUrl
      });
    } catch (error: any) {
      console.error("Critical Webhook Pipeline Failure:", error);
      res.status(500).send("Internal Webhook Error.");
    }
  }
);
