import type { SpecialistId } from "../../../types/ai";
import { SPECIALISTS } from "./specialistFactory";

/**
 * Model-emitted referral tags look like `[REFERRAL: specialist_id | reason]`.
 * They are NEVER saved automatically: the UI strips them from the displayed
 * reply and offers a suggestion chip the user must tap to save.
 */
export interface ReferralSuggestion {
  toSpecialist: SpecialistId;
  reason: string;
}

export const MAX_REFERRAL_REASON_LENGTH = 200;

const REFERRAL_TAG_REGEX = /\[REFERRAL:\s*([a-zA-Z0-9_-]+)\s*\|\s*([^\]]*)\]/gi;
/** Also catches malformed/partial tags (e.g. missing reason) so nothing raw leaks into the UI. */
const LOOSE_REFERRAL_TAG_REGEX = /\[REFERRAL:[^\]]*\]/gi;

function isSpecialistId(value: string): value is SpecialistId {
  return Object.prototype.hasOwnProperty.call(SPECIALISTS, value);
}

/** Removes every referral tag from `text` and tidies the whitespace left behind. */
export function stripReferralTags(text: string): string {
  return text
    .replace(LOOSE_REFERRAL_TAG_REGEX, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Parses referral tags out of a model reply.
 * - Only the 10 known specialist ids are accepted (unknown ids are dropped).
 * - A guide cannot refer to itself (`currentSpecialist`).
 * - Reasons are single-lined and capped at MAX_REFERRAL_REASON_LENGTH chars.
 * - Duplicate targets are collapsed (first reason wins).
 */
export function parseReferralSuggestions(
  text: string,
  currentSpecialist?: SpecialistId,
): { cleanText: string; suggestions: ReferralSuggestion[] } {
  const suggestions: ReferralSuggestion[] = [];
  const seen = new Set<SpecialistId>();
  for (const match of text.matchAll(REFERRAL_TAG_REGEX)) {
    const target = match[1].toLowerCase().trim();
    if (!isSpecialistId(target) || target === currentSpecialist || seen.has(target)) continue;
    const reason = match[2].replace(/\s+/g, " ").trim().slice(0, MAX_REFERRAL_REASON_LENGTH);
    if (!reason) continue;
    seen.add(target);
    suggestions.push({ toSpecialist: target, reason });
  }
  return { cleanText: stripReferralTags(text), suggestions };
}
