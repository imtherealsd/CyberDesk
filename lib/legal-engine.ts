/**
 * CyberDesk LegalTech & Compliance Engine
 * Maps incident facts to Bharatiya Nyaya Sanhita (BNS) 2023 and Information Technology Act 2000 provisions.
 * Generates court-ready police complaints (FIR drafts) and formal Bank Section 91 notices.
 */

export interface LegalProvision {
  code: string;
  act: "Bharatiya Nyaya Sanhita (BNS) 2023" | "Information Technology Act 2000";
  title: string;
  description: string;
  bailable: boolean;
  cognizable: boolean;
  maxPenalty: string;
  applicabilityReason: string;
}

export interface FIRDraft {
  toAuthority: string;
  subject: string;
  complainantName: string;
  complainantContact: string;
  incidentDateTime: string;
  incidentType: string;
  financialLoss: string;
  applicableProvisions: LegalProvision[];
  narrativeBody: string;
  evidentialAnnexures: string[];
  suspectDetails: {
    phoneNumbers: string[];
    upiIds: string[];
    bankAccounts: string[];
    websitesOrUrls: string[];
    telegramHandles: string[];
  };
  prayer: string;
  verificationStatement: string;
}

export interface BankFreezeNotice {
  toBankNodalOfficer: string;
  bankName: string;
  noticeReference: string;
  subject: string;
  victimAccountNumber: string;
  disputedTransactions: Array<{
    amount: string;
    utrOrRef: string;
    beneficiaryAccountOrUpi: string;
    dateTime: string;
  }>;
  legalBasis: string;
  immediateDemands: string[];
  declaration: string;
}

/**
 * Maps incident descriptions, categories, and facts to legal sections under Indian law.
 */
export function matchLegalProvisions(
  incidentType: string,
  description: string,
  verifiedFacts: Array<{ label: string; value: string }>
): LegalProvision[] {
  const text = (description + " " + incidentType + " " + verifiedFacts.map((f) => f.value).join(" ")).toLowerCase();
  const provisions: LegalProvision[] = [];

  // 1. Cheating / Financial Fraud (BNS 318(4) - formerly IPC 420)
  if (
    text.includes("debit") ||
    text.includes("inr") ||
    text.includes("₹") ||
    text.includes("rs") ||
    text.includes("money") ||
    text.includes("scam") ||
    text.includes("fraud") ||
    text.includes("invest") ||
    text.includes("task")
  ) {
    provisions.push({
      code: "Section 318(4)",
      act: "Bharatiya Nyaya Sanhita (BNS) 2023",
      title: "Cheating and dishonestly inducing delivery of property",
      description: "Cheating with knowledge that wrongful loss may ensue to person whose interest offender is bound to protect.",
      bailable: false,
      cognizable: true,
      maxPenalty: "Imprisonment up to 7 years and fine",
      applicabilityReason: "Fraudulent inducement resulting in unauthorized monetary transfer/loss.",
    });
  }

  // 2. Impersonation / Phishing via Computer Resource (IT Act Section 66D)
  if (
    text.includes("kyc") ||
    text.includes("bank") ||
    text.includes("pretend") ||
    text.includes("claimed to be") ||
    text.includes("sbi") ||
    text.includes("hr") ||
    text.includes("impersonat") ||
    text.includes("whatsapp") ||
    text.includes("telegram") ||
    text.includes("fake")
  ) {
    provisions.push({
      code: "Section 66D",
      act: "Information Technology Act 2000",
      title: "Cheating by personation by using computer resource",
      description: "Cheating by personating any person or entity using a communication device or computer resource.",
      bailable: true,
      cognizable: true,
      maxPenalty: "Imprisonment up to 3 years and fine up to ₹1,00,000",
      applicabilityReason: "Perpetrator falsely assumed the identity of an official/organization over a digital communication channel.",
    });
  }

  // 3. Identity Theft (IT Act Section 66C)
  if (
    text.includes("otp") ||
    text.includes("pin") ||
    text.includes("password") ||
    text.includes("aadhaar") ||
    text.includes("pan") ||
    text.includes("account access") ||
    text.includes("credential")
  ) {
    provisions.push({
      code: "Section 66C",
      act: "Information Technology Act 2000",
      title: "Identity theft",
      description: "Fraudulent or dishonest use of electronic signature, password or other unique identification feature.",
      bailable: true,
      cognizable: true,
      maxPenalty: "Imprisonment up to 3 years and fine up to ₹1,00,000",
      applicabilityReason: "Unauthorized acquisition and misuse of authentication credentials or identity markers.",
    });
  }

  // 4. Extortion / Blackmail / Sextortion (BNS 308 - formerly IPC 384)
  if (
    text.includes("blackmail") ||
    text.includes("photo") ||
    text.includes("video") ||
    text.includes("extort") ||
    text.includes("threat") ||
    text.includes("nude") ||
    text.includes("morph")
  ) {
    provisions.push({
      code: "Section 308(2)",
      act: "Bharatiya Nyaya Sanhita (BNS) 2023",
      title: "Extortion by putting person in fear of injury/reputation damage",
      description: "Intentionally putting any person in fear of any injury or reputational harm and dishonestly inducing money/property delivery.",
      bailable: false,
      cognizable: true,
      maxPenalty: "Imprisonment up to 3 years, or with fine, or both",
      applicabilityReason: "Coercive threat using private media/materials demanding financial or psychological concessions.",
    });
  }

  // 5. Transmitting Obscene / Sexually Explicit Material (IT Act Section 67 / 67A)
  if (
    text.includes("photo") ||
    text.includes("video") ||
    text.includes("intimate") ||
    text.includes("morph") ||
    text.includes("blackmail")
  ) {
    provisions.push({
      code: "Section 67",
      act: "Information Technology Act 2000",
      title: "Publishing or transmitting obscene material in electronic form",
      description: "Publishing or transmitting material which is lascivious or appeals to prurient interest in electronic form.",
      bailable: true,
      cognizable: true,
      maxPenalty: "First conviction: Imprisonment up to 3 years and fine up to ₹5,00,000",
      applicabilityReason: "Threat of transmission or electronic dissemination of private images.",
    });
  }

  // Default fallback if no specific provisions matched
  if (provisions.length === 0) {
    provisions.push({
      code: "Section 66",
      act: "Information Technology Act 2000",
      title: "Computer related offences",
      description: "Any dishonest or fraudulent act referred to in Section 43 of the IT Act.",
      bailable: true,
      cognizable: true,
      maxPenalty: "Imprisonment up to 3 years or fine up to ₹5,00,000",
      applicabilityReason: "General computer-mediated unauthorized activity.",
    });
  }

  return provisions;
}

/**
 * Generates an authoritative, police-ready FIR complaint draft.
 */
export function generateFIRDraft(params: {
  complainantName: string;
  complainantContact: string;
  incidentType: string;
  description: string;
  verifiedFacts: Array<{ label: string; value: string }>;
  evidenceFilenames: string[];
  acknowledgementId?: string;
}): FIRDraft {
  const provisions = matchLegalProvisions(params.incidentType, params.description, params.verifiedFacts);

  // Extract suspect markers from verified facts
  const upiIds = params.verifiedFacts.filter((f) => f.label.toLowerCase().includes("upi") || f.value.includes("@")).map((f) => f.value);
  const bankAccounts = params.verifiedFacts.filter((f) => f.label.toLowerCase().includes("bank") || f.label.toLowerCase().includes("account")).map((f) => f.value);
  const phoneNumbers = params.verifiedFacts.filter((f) => f.label.toLowerCase().includes("phone") || f.label.toLowerCase().includes("mobile")).map((f) => f.value);
  const websitesOrUrls = params.verifiedFacts.filter((f) => f.value.startsWith("http") || f.value.includes(".com") || f.value.includes(".apk")).map((f) => f.value);
  const amountFact = params.verifiedFacts.find((f) => f.label.toLowerCase().includes("amount") || f.label.toLowerCase().includes("loss"));

  const financialLoss = amountFact ? amountFact.value : "Unspecified monetary value";

  return {
    toAuthority: "The Station House Officer / Cyber Crime Police Station",
    subject: `Complaint regarding ${params.incidentType} and financial cyber fraud — Request for FIR registration and urgent investigation`,
    complainantName: params.complainantName || "Citizen Complainant",
    complainantContact: params.complainantContact || "Provided via Portal",
    incidentDateTime: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
    incidentType: params.incidentType,
    financialLoss,
    applicableProvisions: provisions,
    narrativeBody: params.description,
    evidentialAnnexures: params.evidenceFilenames.map((name, i) => `Annexure ${String.fromCharCode(65 + i)}: Preserved digital record — ${name}`),
    suspectDetails: {
      phoneNumbers,
      upiIds,
      bankAccounts,
      websitesOrUrls,
      telegramHandles: [],
    },
    prayer: "It is respectfully prayed that an FIR may be registered under the aforementioned sections of the Bharatiya Nyaya Sanhita (BNS) 2023 and Information Technology Act 2000, and necessary directions be issued to freeze the beneficiary bank accounts / UPI handles to prevent dissipation of defrauded funds.",
    verificationStatement: "I hereby verify and declare that the facts stated in this complaint and accompanying dossier are true to the best of my knowledge and verified digital records, and no material information has been concealed.",
  };
}

/**
 * Generates a formal Bank Section 91 CrPC / Section 94 BNSS Account Freeze & Fraud Recall Notice.
 */
export function generateBankFreezeNotice(params: {
  bankName: string;
  victimAccountNumber?: string;
  transactions: Array<{ amount: string; utrOrRef: string; beneficiaryAccountOrUpi: string; dateTime: string }>;
  complainantName: string;
}): BankFreezeNotice {
  const refCode = `CYB-BNK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return {
    toBankNodalOfficer: `Principal Nodal Officer / Fraud Risk Management Division, ${params.bankName || "Beneficiary Bank"}`,
    bankName: params.bankName || "Concerned Bank",
    noticeReference: refCode,
    subject: `URGENT: Fraudulent transaction alert & immediate lien/freeze request under RBI Cyber Fraud Guidelines and Section 94 BNSS`,
    victimAccountNumber: params.victimAccountNumber || "Disclosed in formal claim",
    disputedTransactions: params.transactions,
    legalBasis: "Reserve Bank of India (RBI) Circular on Limiting Liability of Customers in Unauthorized Electronic Banking Transactions (RBI/2017-18/15) read with Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023.",
    immediateDemands: [
      "Immediate temporary debit freeze / lien marking on the recipient account/wallet to preserve funds.",
      "Transmission of transaction logs, beneficiary KYC name, registered mobile, and IP address to the investigating Cyber Crime Cell.",
      "Issuance of an official acknowledgement receipt with a unique Bank Dispute Tracking Number.",
    ],
    declaration: "The aforementioned transactions were unauthorized and carried out without lawful consent. Immediate preventive measures are requested to halt onward money mule transfers.",
  };
}
