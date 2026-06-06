## 2024-05-24 - [Firestore Privilege Escalation via Role Modification]
**Vulnerability:** Users had unrestricted write access to their own root user documents in `firestore.rules`, allowing them to arbitrarily set their `role` field to `admin`.
**Learning:** Checking a field for admin privileges in security rules is insecure if the rule also grants the user blanket `write` permissions to the document containing that field.
**Prevention:** Explicitly restrict modifications to privilege-defining fields (like `role`) using `request.resource.data` and `resource.data` to ensure users cannot escalate their own privileges.

## 2024-05-18 - Express Body Parser / Endpoint DoS Risk
**Vulnerability:** The server used `express.json({ limit: "50mb" })` allowing massively oversized JSON payloads, and the `/api/generate-visit-prep` endpoint took an arbitrary-length prompt directly into the Gemini API without validation.
**Learning:** Default limits or oversized arbitrary limits left the app vulnerable to payload parsing DoS and LLM quota exhaustion.
**Prevention:** Always restrict JSON payload limits to a reasonable bound (e.g. `1mb`) in the Express setup, and explicitly validate input length (e.g. `< 50000` chars) on any text parameters that wrap expensive external requests.
