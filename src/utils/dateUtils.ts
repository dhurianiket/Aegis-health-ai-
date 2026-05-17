export const parseSafeTimestamp = (timestamp: any): Date | null => {
  if (!timestamp) return null;

  // Firestore Timestamp object
  if (typeof timestamp.toDate === "function") return timestamp.toDate();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000);

  // Standard JS Date from string or number
  const parsed = new Date(timestamp);
  if (!isNaN(parsed.getTime())) return parsed;

  // Safari YYYY-MM-DD bug workaround
  if (typeof timestamp === "string") {
    const normalized = timestamp.replace(/-/g, "/").split("T")[0];
    const safeParsed = new Date(normalized);
    if (!isNaN(safeParsed.getTime())) return safeParsed;
  }

  return null; // Never throw — always return null on failure
};
