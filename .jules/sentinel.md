## 2024-10-06 - Prevent API Key Leakage in Proxy Logs
**Vulnerability:** Google Gemini API key passed via URL query parameters (`?key=...`) in `server.ts`.
**Learning:** Query parameters are often recorded in server and proxy access logs, risking credential exposure even over HTTPS.
**Prevention:** Always pass sensitive credentials like API keys via secure HTTP headers (e.g., `x-goog-api-key`) rather than URL strings.

## 2024-10-06 - Append rather than overwrite journal
**Vulnerability:** Agent tooling overwrite pattern led to deleted context.
**Learning:** When writing context journals, always use append mode rather than overwrite to avoid destroying previously acquired knowledge.
**Prevention:** Use `>>` or `cat << 'EOF' >>` instead of `>` when adding to `.jules/*.md` logs.
