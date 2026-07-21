## 2024-05-24 - Disable x-powered-by header in Express
**Vulnerability:** The application was broadcasting its technology stack by not disabling the `x-powered-by` header.
**Learning:** In Express applications, the `x-powered-by` header is enabled by default, which can leak information about the underlying technology stack to potential attackers.
**Prevention:** Always add `app.disable('x-powered-by');` when initializing an Express application to prevent this information leakage.

## 2024-05-24 - Sanitize error messages in Express API
**Vulnerability:** The `/api/generate-visit-prep` endpoint was leaking raw error details (`details: errBody` and `error: e.message`) in the response.
**Learning:** Sending raw internal error messages or stack traces to the client can expose sensitive information about the application's internal workings or third-party APIs.
**Prevention:** Always map internal errors to generic, safe error messages before sending them to the client.