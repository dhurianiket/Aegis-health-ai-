# Specialist Lounge — storage, retention, consent, deletion

## Storage layout (schema v2)

```
users/{uid}/profiles/{pid}/specialistChats/{specialistId}                 chat meta: specialistId, profileId, userId, schemaVersion, updatedAt (no message text)
users/{uid}/profiles/{pid}/specialistChats/{specialistId}/messages/{id}   one doc per message
```

Message doc fields: `role` (`user` | `assistant`), `content` (≤ 20,000 chars), `createdAt` (Timestamp), `expireAt` (Timestamp = createdAt + 180 days), `seq` (int), `schemaVersion` (2), and optional `kind: "triage"`.
Ids are `<13-digit epoch ms>-<seq>-<random>` (sortable). Messages are append-only, and the rules forbid updates.

### Lazy migration from v1

Schema v1 kept one growing `messages` array on the chat doc. When a chat is opened, `loadLoungeMessages` migrates it:
1. It writes each legacy message to `messages/legacy-00000…`. The ids are deterministic, so the migration is idempotent and safe to retry.
2. It then removes the array (`deleteField`) and sets `schemaVersion: 2` and `migratedAt`.

If migration fails, the legacy array is still shown (read fallback) and the migration is retried the next time the chat is opened.
Migrated messages get `expireAt = original createdAt + 180 days`. Legacy messages older than 180 days are therefore removed by the next TTL sweep after migration, which matches the retention policy.

## TTL policy: manual step (not automatable from CI)

Firestore TTL is configured per collection group, outside `firestore.rules`. Run this once per project:

```bash
gcloud firestore fields ttls update expireAt \
  --collection-group=messages --enable-ttl --project=aegis-health-app-90697
# verify
gcloud firestore fields ttls list --project=aegis-health-app-90697
```

Or in the console: Firestore → TTL → Create policy → collection group `messages`, timestamp field `expireAt`.
TTL deletion is asynchronous. It usually happens within 24 hours after `expireAt`, but it is not instant.

Note: the `messages` collection group name is shared by any other `messages` subcollection in the project. Today only the Lounge uses it, and any future use must also set `expireAt` deliberately.

## Consent

Consent is stored at `users/{uid}/profiles/{pid}/consents/specialist_lounge_ai`, with the fields `{ purpose, version, accepted: true, isMinorProfile, guardianConfirmed, acceptedAt: serverTimestamp }`.
- The consent sheet appears before the profile's first Lounge use, and again whenever `LOUNGE_CONSENT_VERSION` changes.
- It discloses:
  - processing by Google (Gemini) through Cloudflare, possibly outside India
  - that the guides are educational only
  - pseudonymisation
  - 180-day retention and the delete option
  - 112/108 for emergencies
- Child profiles (by `dob` or `paediatricConsent.isMinor`) also require a parent or lawful guardian confirmation. `firestore.rules` enforces this, along with the purpose, shape and a server timestamp.

## Delete Lounge data (per profile)

"Delete Lounge data" in the Lounge header, after a confirmation dialog, deletes for the active profile only:
- all `specialistChats/*` docs and every `messages/*`, including orphaned message subcollections for the 10 known guide ids
- all `activeReferrals/*`
- `cachedReports` where `patientId == pid` and `reportType` starts with `SpecialistSummary_`

The consent record is kept, because it documents the user's choice.

## Pseudonymisation before prompting

`buildPatientDataBlock` runs every record field through `pseudonymiseRecordText`:
- The full name becomes the first name.
- The standalone surname becomes `[surname removed]`, unless the surname is a common report word.
- Phone numbers (Indian mobile and landline), emails, Aadhaar-like 12-digit numbers, ABHA numbers and addresses, and labelled ids (UHID, MRN, Patient ID, and similar) are removed.

The profile name itself is withheld (`includeName: false`). This is best-effort regex redaction, not anonymisation.
