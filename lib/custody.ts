/**
 * CyberDesk Digital Chain of Custody & Evidence Certification Engine
 * Computes cryptographic SHA-256 hashes for evidence files and generates Section 65B Indian Evidence Act Certificates.
 */

import { createHash } from "crypto";

export interface EvidenceHash {
  algorithm: "SHA-256";
  digest: string;
  generatedAt: string;
  byteSize: number;
  filename: string;
}

export interface Section65BCertificate {
  certificateId: string;
  caseId: string;
  deponentName: string;
  deviceDescription: string;
  operatingSystem: string;
  generationDate: string;
  certifiedEvidenceList: Array<{
    filename: string;
    mimeType: string;
    sha256Hash: string;
    capturedDateTime: string;
  }>;
  legalDeclaration: string;
  signatureBlock: {
    signatory: string;
    designation: string;
    timestamp: string;
  };
}

/**
 * Calculates SHA-256 hash of an evidence buffer or string.
 */
export function calculateSHA256(data: Buffer | string, filename: string): EvidenceHash {
  const buffer = typeof data === "string" ? Buffer.from(data, "utf-8") : data;
  const hash = createHash("sha256").update(buffer).digest("hex");

  return {
    algorithm: "SHA-256",
    digest: hash,
    generatedAt: new Date().toISOString(),
    byteSize: buffer.byteLength,
    filename,
  };
}

/**
 * Generates an Indian Evidence Act Section 65B (Section 63 of Bharatiya Sakshya Adhiniyam 2023) Electronic Evidence Certificate.
 */
export function generateSection65BCertificate(params: {
  caseId: string;
  deponentName: string;
  evidenceItems: Array<{
    filename: string;
    mimeType: string;
    sha256Hash: string;
    createdAt: string;
  }>;
}): Section65BCertificate {
  const certId = `CERT-65B-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const now = new Date().toISOString();

  return {
    certificateId: certId,
    caseId: params.caseId,
    deponentName: params.deponentName || "Complainant / Authorized Investigator",
    deviceDescription: "Web Client & CyberDesk Evidence Preservation Engine",
    operatingSystem: "Server-side Cryptographic Validation Subsystem",
    generationDate: now,
    certifiedEvidenceList: params.evidenceItems.map((item) => ({
      filename: item.filename,
      mimeType: item.mimeType,
      sha256Hash: item.sha256Hash || "SHA-256 calculated on server ingest",
      capturedDateTime: item.createdAt,
    })),
    legalDeclaration: `I hereby certify under Section 65B of the Indian Evidence Act, 1872 (and Section 63 of the Bharatiya Sakshya Adhiniyam, 2023) that the digital electronic records identified herein were produced and securely captured during the ordinary course of documenting this cyber incident. The computer systems and cryptographic algorithms used to process and hash the evidence operated properly without unauthorized modification or tampering. The SHA-256 cryptographic digests recorded herein accurately represent the digital artifacts without alteration.`,
    signatureBlock: {
      signatory: params.deponentName || "Verified Electronic Signatory",
      designation: "Deponent / Aggrieved Citizen",
      timestamp: now,
    },
  };
}
