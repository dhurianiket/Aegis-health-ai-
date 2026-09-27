/**
 * Test-only helper: mints a locally-signed RS256 JWT shaped like a Firebase ID
 * token, plus the matching JWKS, so Worker tests exercise the real signature
 * verification path. The key pair is generated in memory per test run; nothing
 * here is a real credential.
 */
export const TEST_PROJECT_ID = "synthetic-test-project";
export const GOOGLE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const TEST_KID = "synthetic-test-kid";

function base64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlJson(value: unknown): string {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

export interface TestSigner {
  jwks: { keys: JsonWebKey[] };
  mintToken: (claims?: Record<string, unknown>) => Promise<string>;
}

export async function createTestSigner(projectId: string = TEST_PROJECT_ID): Promise<TestSigner> {
  const pair = (await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const publicJwk = (await crypto.subtle.exportKey("jwk", pair.publicKey)) as JsonWebKey & { kid?: string };
  const jwk: JsonWebKey & { kid: string } = { ...publicJwk, kid: TEST_KID, alg: "RS256", use: "sig" };

  const mintToken = async (claims: Record<string, unknown> = {}): Promise<string> => {
    const now = Math.floor(Date.now() / 1000);
    const header = base64UrlJson({ alg: "RS256", kid: TEST_KID, typ: "JWT" });
    const payload = base64UrlJson({
      iss: `https://securetoken.google.com/${projectId}`,
      aud: projectId,
      sub: "synthetic-uid-001",
      auth_time: now - 60,
      iat: now - 60,
      exp: now + 3600,
      ...claims,
    });
    const signed = new TextEncoder().encode(`${header}.${payload}`);
    const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, signed));
    return `${header}.${payload}.${base64Url(sig)}`;
  };

  return { jwks: { keys: [jwk] }, mintToken };
}
