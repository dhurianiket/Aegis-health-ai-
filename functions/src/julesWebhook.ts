import { onRequest } from "firebase-functions/v2/https";
import * as crypto from "crypto";
import { getFirestore } from "firebase-admin/firestore";

// Google Cloud Project & Jules API Config
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || "aegis-health-app-90697";
const JULES_API_URL = `https://jules.googleapis.com/v1/projects/${GCP_PROJECT_ID}/sessions`;

// Invariant Matcher: Developer user ID for tracking autonomous tasks in isolated user-specific subcollections (AGENTS.md Rule 1.F compliance)
const ADMIN_DEV_USER_ID = "developer_agent_jules";

/**
 * Verify GitHub webhook signature using HMAC-SHA512 or HMAC-SHA256.
 */
function verifySignature(payload: string, signature: string | string[] | undefined, secret: string | undefined): boolean {
  if (!secret) {
    console.error("GITHUB_WEBHOOK_SECRET environment variable is missing.");
    return false;
  }
  if (!signature) return false;

  const checkSig = Array.isArray(signature) ? signature[0] : signature;
  const match = checkSig.match(/^(sha256|sha1)=(.*)$/);
  if (!match) return false;

  const algo = match[1];
  const hash = match[2];

  const hmac = crypto.createHmac(algo, secret);
  const calculated = hmac.update(payload).digest("hex");

  const calculatedBuffer = Buffer.from(calculated);
  const hashBuffer = Buffer.from(hash);

  if (calculatedBuffer.length !== hashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(calculatedBuffer, hashBuffer);
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

      // 1. Signature Verification (Defensive Guard)
      const githubSignature = req.headers["x-github-signature-256"] || req.headers["x-github-signature"];
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
      const action = body.action; // e.g., "labeled" or "opened"
      const issue = body.issue;

      if (!issue) {
        res.status(400).send("No issue object found in payload.");
        return;
      }

      // We only care about labeling events that apply "jules-fix" or "jules-feature"
      if (action !== "labeled") {
        res.status(200).send(`Ignored issue action: ${action}`);
        return;
      }

      const addedLabel = body.label?.name;
      if (addedLabel !== "jules-fix" && addedLabel !== "jules-feature") {
        res.status(200).send(`Ignored label addition: ${addedLabel}`);
        return;
      }

      console.log(`🚀 GitHub Issue #${issue.number} labeled with '${addedLabel}'. Starting Jules integration flow...`);

      // 2. Format Context details for Jules session invocation
      const issueTitle = issue.title;
      const issueBody = issue.body || "No description provided.";
      const repoUrl = body.repository.clone_url;
      const headBranch = `jules/branch-issue-${issue.number}`;

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
      const julesPayload = {
        repository: {
          url: repoUrl,
          branch: "main",
        },
        issue: {
          id: issue.id,
          number: issue.number,
          title: issueTitle,
          description: issueBody,
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
          // The Google API expects authorization which on GCP functions can be proxied or generated via ADC.
          // In deep production we use an IAM authenticated header using Google Auth libraries.
          "Authorization": `Bearer ${process.env.GEMINI_API_KEY || "GOOGLE_ADC_OR_API_KEY"}`,
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
        issueNumber: issue.number,
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
      res.status(500).send("Internal Webhook Error");
    }
  }
);
