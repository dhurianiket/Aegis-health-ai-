#!/usr/bin/env python3
"""
Aegis Health AI — Meta Social Technologies MCP Server
Runs over stdio to provide native Meta (Facebook, Instagram, WhatsApp) automation tools directly to Antigravity.
"""

import os
import sys
import json
import time
import urllib.request
import urllib.parse
from typing import Optional

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    print("Error: FastMCP is required. Ensure 'mcp' package is installed.", file=sys.stderr)
    sys.exit(1)

mcp = FastMCP("Meta-Social-Technologies-MCP")

GRAPH_API_VERSION = "v21.0"
GRAPH_BASE_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"

def get_env_var(key: str, default: str = "") -> str:
    # First check process environment
    val = os.environ.get(key, "").strip()
    if val:
        return val
    # Check .env in parent workspace
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith(f"{key}="):
                        return line.split("=", 1)[1].strip().strip('"').strip("'")
        except Exception:
            pass
    return default

def _make_graph_request(endpoint: str, method: str = "GET", data: Optional[dict] = None) -> dict:
    access_token = get_env_var("META_ACCESS_TOKEN")
    if not access_token:
        raise ValueError("Missing META_ACCESS_TOKEN. Set it in your environment or .env file.")

    url = endpoint if endpoint.startswith("http") else f"{GRAPH_BASE_URL}/{endpoint}"

    if method == "GET":
        separator = "&" if "?" in url else "?"
        url = f"{url}{separator}access_token={urllib.parse.quote(access_token)}"
        req = urllib.request.Request(url, method="GET")
    else:
        post_data = data or {}
        post_data["access_token"] = access_token
        encoded = urllib.parse.urlencode(post_data).encode("utf-8")
        req = urllib.request.Request(url, data=encoded, method="POST")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")

    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(error_body)
            msg = err_json.get("error", {}).get("message", error_body)
            code = err_json.get("error", {}).get("code", e.code)
            raise RuntimeError(f"Meta Graph API [{code}]: {msg}")
        except json.JSONDecodeError:
            raise RuntimeError(f"Meta HTTP Error {e.code}: {error_body}")

@mcp.tool()
def meta_discover_instagram_id(page_id: str = "1434703356392770") -> str:
    """Discovers the linked Instagram Business Account ID for a Facebook Page."""
    res = _make_graph_request(f"{page_id}?fields=instagram_business_account")
    ig_data = res.get("instagram_business_account")
    if not ig_data or "id" not in ig_data:
        return f"No linked Instagram account found for Facebook Page {page_id}. Ensure it is connected in Meta Business Suite."
    return f"Instagram Business Account ID: {ig_data['id']}"

@mcp.tool()
def meta_publish_facebook_post(message: str, link: Optional[str] = None, page_id: str = "1434703356392770") -> str:
    """Publishes a text or link post to the Aegis Health AI Facebook Page."""
    payload = {"message": message}
    if link:
        payload["link"] = link
    res = _make_graph_request(f"{page_id}/feed", method="POST", data=payload)
    return f"Successfully posted to Facebook Page! Post ID: {res.get('id')}"

@mcp.tool()
def meta_publish_instagram_post(image_url: str, caption: str, instagram_account_id: Optional[str] = None) -> str:
    """Publishes an image post to Instagram via the 2-step media container protocol."""
    ig_id = instagram_account_id or get_env_var("META_IG_ACCOUNT_ID")
    if not ig_id:
        # Try auto-discovery
        disc = _make_graph_request("1434703356392770?fields=instagram_business_account")
        ig_id = disc.get("instagram_business_account", {}).get("id")
        if not ig_id:
            return "Error: Could not resolve Instagram Account ID. Please connect Instagram to your Page."

    # Step 1: Create media container
    container = _make_graph_request(f"{ig_id}/media", method="POST", data={
        "image_url": image_url,
        "caption": caption
    })
    creation_id = container.get("id")
    if not creation_id:
        return f"Failed to create Instagram container: {container}"

    # Wait for container ingestion
    time.sleep(3)

    # Step 2: Publish container
    published = _make_graph_request(f"{ig_id}/media_publish", method="POST", data={
        "creation_id": creation_id
    })
    return f"Successfully posted to Instagram! Media ID: {published.get('id')}"

@mcp.tool()
def meta_send_whatsapp_message(to_phone: str, template_name: str = "hello_world", phone_number_id: Optional[str] = None) -> str:
    """Dispatches a WhatsApp Cloud API notification template message to a phone number."""
    phone_id = phone_number_id or get_env_var("META_WHATSAPP_PHONE_ID")
    if not phone_id:
        return "Error: Missing META_WHATSAPP_PHONE_ID. Check WhatsApp API Setup in Developer Dashboard."

    access_token = get_env_var("META_ACCESS_TOKEN")
    url = f"{GRAPH_BASE_URL}/{phone_id}/messages"
    payload = json.dumps({
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_phone,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en_US"}
        }
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Authorization", f"Bearer {access_token}")
    req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            return f"WhatsApp message dispatched! Message ID: {res.get('messages', [{}])[0].get('id')}"
    except urllib.error.HTTPError as e:
        return f"WhatsApp Error {e.code}: {e.read().decode('utf-8')}"

@mcp.tool()
def meta_get_page_insights(page_id: str = "61596273488322") -> str:
    """Retrieves reach and engagement metrics for the Aegis Health AI Facebook Page."""
    try:
        res = _make_graph_request(f"{page_id}/insights?metric=page_impressions_unique,page_engaged_users&period=day")
        return json.dumps(res, indent=2)
    except Exception as e:
        return f"Error retrieving insights: {str(e)}"

if __name__ == "__main__":
    mcp.run()
