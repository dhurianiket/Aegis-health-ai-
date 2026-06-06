
## 2024-05-18 - Express Body Parser / Endpoint DoS Risk
**Vulnerability:** The server used `express.json({ limit: "50mb" })` allowing massively oversized JSON payloads, and the `/api/generate-visit-prep` endpoint took an arbitrary-length prompt directly into the Gemini API without validation.
**Learning:** Default limits or oversized arbitrary limits left the app vulnerable to payload parsing DoS and LLM quota exhaustion.
**Prevention:** Always restrict JSON payload limits to a reasonable bound (e.g. `1mb`) in the Express setup, and explicitly validate input length (e.g. `< 50000` chars) on any text parameters that wrap expensive external requests.
