/**
 * Aegis Health AI — Unified Meta Graph API Publisher (v21.0)
 *
 * Supports:
 *  1. Facebook Pages: Text, link, and photo posts.
 *  2. Instagram Graph API: 2-step async media container creation & publishing.
 *  3. WhatsApp Business Cloud API: Outbound template and notification messages.
 *
 * Usage:
 *   npx ts-node scripts/publish-social.ts --platform fb --message "Hello from Aegis"
 *   npx ts-node scripts/publish-social.ts --platform ig --imageUrl "https://..." --caption "Caption"
 *   npx ts-node scripts/publish-social.ts --platform wa --to "+91XXXXXXXXXX" --template "hello_world"
 */

import https from "https";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "";
const PAGE_ID = process.env.META_PAGE_ID || "61596273488322";
const IG_ACCOUNT_ID = process.env.META_IG_ACCOUNT_ID || "";
const WA_PHONE_ID = process.env.META_WHATSAPP_PHONE_ID || "";

interface MetaApiResponse {
  id?: string;
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
  [key: string]: unknown;
}

function makeGraphRequest(endpoint: string, method: "GET" | "POST", data?: Record<string, string>): Promise<MetaApiResponse> {
  return new Promise((resolve, reject) => {
    if (!ACCESS_TOKEN) {
      return reject(new Error("Missing META_ACCESS_TOKEN in environment variables."));
    }

    const url = new URL(endpoint.startsWith("http") ? endpoint : `${GRAPH_BASE_URL}/${endpoint}`);
    const postData = data ? new URLSearchParams({ ...data, access_token: ACCESS_TOKEN }).toString() : "";

    if (method === "GET") {
      url.searchParams.append("access_token", ACCESS_TOKEN);
    }

    const options = {
      method,
      headers: method === "POST" ? {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      } : {},
    };

    const req = https.request(url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body) as MetaApiResponse;
          if (parsed.error) {
            reject(new Error(`Meta API [${parsed.error.code}]: ${parsed.error.message}`));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error(`Non-JSON response: ${body}`));
        }
      });
    });

    req.on("error", reject);
    if (method === "POST" && postData) {
      req.write(postData);
    }
    req.end();
  });
}

/**
 * 1. Publish to Facebook Page
 */
export async function publishToFacebookPage(message: string, link?: string): Promise<string> {
  console.log(`[FB] Publishing to Facebook Page ${PAGE_ID}...`);
  const payload: Record<string, string> = { message };
  if (link) payload.link = link;

  const res = await makeGraphRequest(`${PAGE_ID}/feed`, "POST", payload);
  console.log(`[FB] Success! Post ID: ${res.id}`);
  return res.id!;
}

/**
 * 2. Publish to Instagram (2-Step Async Container)
 */
export async function publishToInstagram(imageUrl: string, caption: string): Promise<string> {
  if (!IG_ACCOUNT_ID) {
    throw new Error("Missing META_IG_ACCOUNT_ID. Query 'GET /{PAGE_ID}?fields=instagram_business_account' first.");
  }

  console.log(`[IG] Step 1: Creating Media Container for ${IG_ACCOUNT_ID}...`);
  const containerRes = await makeGraphRequest(`${IG_ACCOUNT_ID}/media`, "POST", {
    image_url: imageUrl,
    caption,
  });

  const creationId = containerRes.id!;
  console.log(`[IG] Container created: ${creationId}. Waiting 3s for container readiness...`);
  await new Promise((r) => setTimeout(r, 3000));

  console.log(`[IG] Step 2: Publishing Media Container...`);
  const publishRes = await makeGraphRequest(`${IG_ACCOUNT_ID}/media_publish`, "POST", {
    creation_id: creationId,
  });

  console.log(`[IG] Success! Instagram Media ID: ${publishRes.id}`);
  return publishRes.id!;
}

/**
 * 3. Send WhatsApp Notification
 */
export async function sendWhatsAppTemplate(toPhone: string, templateName = "hello_world", languageCode = "en_US"): Promise<string> {
  if (!WA_PHONE_ID) {
    throw new Error("Missing META_WHATSAPP_PHONE_ID.");
  }

  console.log(`[WA] Sending template '${templateName}' to ${toPhone}...`);
  return new Promise((resolve, reject) => {
    const url = new URL(`${GRAPH_BASE_URL}/${WA_PHONE_ID}/messages`);
    const payload = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
      },
    });

    const req = https.request(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body) as MetaApiResponse;
          if (parsed.error) {
            reject(new Error(`WhatsApp API [${parsed.error.code}]: ${parsed.error.message}`));
          } else {
            console.log(`[WA] Success!`, parsed);
            resolve(JSON.stringify(parsed));
          }
        } catch {
          reject(new Error(`Non-JSON response: ${body}`));
        }
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// CLI Driver
async function main() {
  const args = process.argv.slice(2);
  const platformIdx = args.indexOf("--platform");
  const platform = platformIdx !== -1 ? args[platformIdx + 1] : "fb";

  if (args.includes("--help") || args.length === 0) {
    console.log(`
Aegis Health AI Meta Publisher CLI
Usage:
  --platform fb   --message "Your update text" [--link "https://..."]
  --platform ig   --imageUrl "https://..." --caption "Caption #Aegis"
  --platform wa   --to "+91XXXXXXXXXX" [--template "hello_world"]
    `);
    return;
  }

  try {
    if (platform === "fb") {
      const msgIdx = args.indexOf("--message");
      const message = msgIdx !== -1 ? args[msgIdx + 1] : "Aegis Health AI Clinical Intelligence update.";
      await publishToFacebookPage(message);
    } else if (platform === "ig") {
      const imgIdx = args.indexOf("--imageUrl");
      const capIdx = args.indexOf("--caption");
      const imageUrl = imgIdx !== -1 ? args[imgIdx + 1] : "https://aegishealthai.co.in/aegis-nvidia-inception-linkedin-banner.png";
      const caption = capIdx !== -1 ? args[capIdx + 1] : "Aegis Health AI • Clinical Precision";
      await publishToInstagram(imageUrl, caption);
    } else if (platform === "wa") {
      const toIdx = args.indexOf("--to");
      if (toIdx === -1) throw new Error("Must provide --to phone number for WhatsApp.");
      await sendWhatsAppTemplate(args[toIdx + 1]);
    }
  } catch (err: unknown) {
    console.error("Execution failed:", (err as Error).message);
    process.exit(1);
  }
}

main();
