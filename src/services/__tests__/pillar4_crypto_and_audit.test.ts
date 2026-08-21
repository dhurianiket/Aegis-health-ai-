import { describe, it, expect } from 'vitest';
import {
  encryptZeroKnowledge,
  decryptZeroKnowledge,
  hashPassphrase,
} from '../zeroKnowledgeCryptoService';
import {
  logSecurityEvent,
  getAuditLogs,
  clearAuditLogs,
} from '../auditLogService';

describe('Pillar 4: WebCrypto AES-256-GCM Zero-Knowledge Engine', () => {
  it('should encrypt and decrypt plaintext accurately using WebCrypto subtle API', async () => {
    const plaintext = 'Aegis Clinical Biomarker Secret Payload';
    const passphrase = 'UltraSecurePassphrase123!';

    const payload = await encryptZeroKnowledge(plaintext, passphrase);

    expect(payload).toBeDefined();
    expect(payload.algorithm).toBe('AES-256-GCM');
    expect(payload.ciphertext).not.toBe(plaintext);
    expect(payload.salt).toBeDefined();
    expect(payload.iv).toBeDefined();

    const decrypted = await decryptZeroKnowledge(payload, passphrase);
    expect(decrypted).toBe(plaintext);
  });

  it('should reject decryption when given an incorrect master passphrase', async () => {
    const plaintext = 'Confidential Patient File';
    const passphrase = 'CorrectPassphrase!';
    const wrongPassphrase = 'WrongPassphrase!';

    const payload = await encryptZeroKnowledge(plaintext, passphrase);

    await expect(decryptZeroKnowledge(payload, wrongPassphrase)).rejects.toThrow(
      'Incorrect master passphrase'
    );
  });

  it('should generate deterministic SHA-256 hash for passphrase verification', async () => {
    const passphrase = 'MyPassphrase123';
    const result1 = await hashPassphrase(passphrase);
    expect(result1.hash).toBeDefined();
    expect(result1.salt).toBeDefined();

    const result2 = await hashPassphrase(passphrase, result1.salt);
    expect(result2.hash).toBe(result1.hash);
  });
});

describe('Pillar 4: Immutable SHA-256 Security Audit Subsystem', () => {
  it('should log security events and generate tamper-proof SHA-256 signatures', async () => {
    clearAuditLogs();

    const record = await logSecurityEvent(
      'VAULT_UNLOCKED',
      'Test Vault Unlock Event',
      'Aniket Dhuri'
    );

    expect(record).toBeDefined();
    expect(record.action).toBe('VAULT_UNLOCKED');
    expect(record.sha256Checksum).toHaveLength(64); // SHA-256 hex length

    const logs = getAuditLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].id).toBe(record.id);
  });
});
