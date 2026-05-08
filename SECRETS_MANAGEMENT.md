# Secrets Management

## Environment Variables

This application requires certain environment variables to function properly. 
Never commit your `.env` file to version control.

Required variables are documented in `.env.example`.

### Client-Exposed Variables (`VITE_*`)
Variables prefixed with `VITE_` are publicly accessible in the client bundle. These are strictly for non-sensitive configurations or public initialization keys.
- **Firebase Config Keys**: These are generally safe to expose as Firebase relies on security rules for access control. However, NEVER expose `VITE_FIREBASE_ADMIN_KEY` or similar admin secrets.

### Server-Only Secrets
All other variables (without `VITE_`) are server-only. They are completely inaccessible from the browser bundle.
- **Gemini API Key**: `GEMINI_API_KEY` is kept server-side to prevent unauthorized usage of your LLM quota.
- **Other 3rd Party APIs**: All other integrations requiring secret keys must be proxied through a server backend.

## Security Practices
1. **Never commit secrets**: Your `.env` and `firebase-applet-config.json` files are in `.gitignore`. Keep them out of version control.
2. **Access Control**: Production databases (like Firestore) must have rigorous security rules protecting data, relying on authentication rather than obscured endpoints.
3. **API Keys validation**: Regularly rotate your API keys, and scope them stringently (e.g., restrict Google Maps API keys to a specific domain).
