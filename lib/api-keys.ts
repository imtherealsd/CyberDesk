/**
 * CyberDesk Developer PaaS API Key Management
 * Handles API key generation, secure cryptographic hashing (SHA-256), and scope authorization.
 */

import { createHash, randomBytes } from "crypto";

export type ApiKeyScope =
  | "read:incidents"
  | "write:incidents"
  | "analyze:evidence"
  | "generate:dossier"
  | "manage:webhooks";

export interface ApiKeyRecord {
  id: string;
  orgId?: string;
  userId: string;
  name: string;
  keyPrefix: string;
  hashedKey: string;
  scopes: ApiKeyScope[];
  rateLimit: number; // requests per minute
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export interface GeneratedApiKey {
  rawKey: string; // Shown ONCE to user on creation
  keyPrefix: string;
  hashedKey: string;
}

/**
 * Generates a new cryptographically secure API key with prefix 'cyb_live_...'.
 */
export function generateApiKey(): GeneratedApiKey {
  const secret = randomBytes(24).toString("hex");
  const rawKey = `cyb_live_${secret}`;
  const keyPrefix = rawKey.substring(0, 13); // 'cyb_live_abcd'
  const hashedKey = hashApiKey(rawKey);

  return {
    rawKey,
    keyPrefix,
    hashedKey,
  };
}

/**
 * Computes SHA-256 hash of an API key for safe database storage.
 */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Verifies if an API key has the required permission scope.
 */
export function hasScope(grantedScopes: ApiKeyScope[], requiredScope: ApiKeyScope): boolean {
  if (grantedScopes.includes("write:incidents") && requiredScope === "read:incidents") return true;
  return grantedScopes.includes(requiredScope);
}
