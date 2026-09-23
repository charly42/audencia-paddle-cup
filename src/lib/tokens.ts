import { randomBytes, createHash } from "node:crypto";

/** Jeton de billet non devinable : 144 bits d'entropie, base64url (24 caractères). */
export const newTicketToken = () => randomBytes(18).toString("base64url");

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I/L
/** Code court pour saisie manuelle au check-in. */
export function newTicketCode(len = 8) {
  const bytes = randomBytes(len);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
export const hashFingerprint = (parts: string[]) =>
  createHash("sha256").update(parts.join("|") + (process.env.SUPPORT_HASH_SALT || "")).digest("hex").slice(0, 40);
