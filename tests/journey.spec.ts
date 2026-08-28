import { expect, test, type Page } from "@playwright/test";

const interpretation = {
  incident_type: "Online financial fraud",
  possible_method: "Bank impersonation and a suspicious KYC link",
  amount: 35000,
  urgency: "high",
  mentioned_evidence: ["Caller details", "KYC link", "Debit notification"],
  missing_information: [],
  uncertainties: [],
};

const evidence = {
  id: "evidence-test-transaction",
  type: "Transaction notification",
  filename: "synthetic-transaction-notification.txt",
  source: "Synthetic transaction notification",
  description: "A fictional debit alert for the demo.",
  candidateFields: [
    { label: "Amount", value: "₹35,000", source: "Synthetic transaction notification" },
    { label: "Time", value: "14:32 IST", source: "Synthetic transaction notification" },
    { label: "Reference", value: "TXN-DEMO-84A21", source: "Synthetic transaction notification" },
  ],
  verificationStatus: "confirmed",
};

const complaintText = "I am reporting a synthetic online financial fraud incident involving bank impersonation and a suspicious KYC link. A fictional debit is shown in the demo evidence.";

const uploadedEvidence = {
  id: "evidence-upload-test",
  type: "Transaction / payment",
  category: "transaction",
  filename: "upi-alert.txt",
  source: "Citizen uploaded file",
  description: "A transaction / payment file selected for this synthetic prototype.",
  mimeType: "text/plain",
  storageReference: null,
  uploadStatus: "uploaded",
  extractionStatus: "not_started",
  isDemo: true,
  candidateFields: [],
  verificationStatus: "candidate",
};

const extractedEvidence = {
  ...uploadedEvidence,
  extractionStatus: "complete",
  candidateFields: [
    { id: "evidence-upload-test-transactionAmount", fieldKey: "transactionAmount", label: "Amount", value: "₹18,500", source: "AI suggestion", evidenceId: "evidence-upload-test", confidence: "high", verificationStatus: "candidate" },
    { id: "evidence-upload-test-transactionReference", fieldKey: "transactionReference", label: "Transaction reference", value: "UTR-DEMO-18500", source: "AI suggestion", evidenceId: "evidence-upload-test", confidence: "medium", verificationStatus: "candidate" },
    { id: "evidence-upload-test-eventTime", fieldKey: "eventTime", label: "Approximate time", value: "14:32 IST", source: "AI suggestion", evidenceId: "evidence-upload-test", confidence: "high", verificationStatus: "candidate" },
  ],
};

async function reachReview(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Start with what happened/i }).click();
  await page.getByRole("button", { name: /Use the seeded demo understanding/i }).click();
  await page.getByRole("button", { name: /Confirm & see next steps/i }).click();
  await page.getByRole("button", { name: /Continue to evidence/i }).click();
  await page.getByRole("button", { name: /Add synthetic transaction notification/i }).click();
  await page.getByRole("button", { name: /Confirm verified details/i }).click();
  await page.getByRole("button", { name: /Review demo report/i }).click();
}

async function reachEvidence(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Start with what happened/i }).click();
  await page.getByRole("button", { name: /Use the seeded demo understanding/i }).click();
  await page.getByRole("button", { name: /Confirm & see next steps/i }).click();
  await page.getByRole("button", { name: /Continue to evidence/i }).click();
}

test("completes the synthetic citizen journey with a labeled demo AI fallback", async ({ page }) => {
  await reachReview(page);
  await expect(page.getByRole("heading", { name: /Review your demo report/i })).toBeVisible();
  await page.getByRole("button", { name: /Submit demo report/i }).click();
  await expect(page.getByRole("heading", { name: /No government report was filed/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /See case status/i }).click();
  await expect(page.getByRole("heading", { name: "Under review", exact: true })).toBeVisible();
  await expect(page.locator(".status-timeline")).not.toContainText("Not submitted");
  await page.getByRole("button", { name: /Explain this to me/i }).click();
  await expect(page.locator(".explain-card")).toContainText(/Demo explanation/i, { timeout: 15_000 });
  await expect(page.locator(".explain-card")).toContainText(/Deterministic demo fallback/i, { timeout: 15_000 });
  await expect(page.locator(".error-box")).toHaveCount(0);
});

test("supports field correction and completed-step back navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Start with what happened/i }).click();
  await page.getByRole("button", { name: /Use the seeded demo understanding/i }).click();
  await page.getByRole("button", { name: /Edit details/i }).click();
  await page.getByLabel("Edit Looks like").fill("Synthetic online financial fraud");
  await page.getByRole("button", { name: /Save corrections/i }).click();
  await expect(page.getByText("Synthetic online financial fraud", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Back$/i }).click();
  await expect(page.getByLabel("What happened?")).toHaveValue(/Someone called saying they were from my bank/);
  const understandNav = page.getByRole("button", { name: /Understand$/i });
  if (await understandNav.count()) await understandNav.click();
  else await page.getByRole("button", { name: /Continue to understanding/i }).click();
  await expect(page.getByText("Synthetic online financial fraud", { exact: true })).toBeVisible();
});

test("submission is idempotent and returns one authoritative under-review case", async ({ request }) => {
  const first = await request.post("/api/reports/submit", { data: { interpretation, evidence, complaintText } });
  const second = await request.post("/api/reports/submit", { data: { interpretation, evidence, complaintText } });
  expect(first.ok()).toBeTruthy();
  expect(second.ok()).toBeTruthy();
  const firstCase = await first.json();
  const secondCase = await second.json();
  expect(firstCase.caseId).toBe(secondCase.caseId);
  expect(firstCase.status).toBe("under_review");
  expect(firstCase.statusLabel).toBe("Under review");
  expect(secondCase.status).toBe("under_review");
  expect(secondCase.statusLabel).toBe("Under review");
});

test("case tracking remains available after a refresh in the same browser session", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /See a demo case/i }).click();
  await expect(page.getByRole("heading", { name: "Under review", exact: true })).toBeVisible({ timeout: 15_000 });
  await page.reload();
  await expect(page.getByRole("heading", { name: /Understand your case status/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Under review", exact: true })).toBeVisible();
});

test("keeps the landing page inside the viewport at 390 and 412 pixels", async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 412, height: 915 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const metrics = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport);
    expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewport);
    await expect(page.getByRole("button", { name: /Start with what happened/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Start with what happened/i })).toHaveCSS("width", /px/);
  }
});

test("rejects unsupported evidence files with a citizen-friendly validation message", async ({ page }) => {
  await reachEvidence(page);
  await page.getByLabel("Upload evidence file").setInputFiles({
    name: "passwords.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("password,otp\nnot-for-upload,123456"),
  });
  await expect(page.locator(".upload-error")).toContainText("That file type isn't supported yet");
  await expect(page.getByText("Choose a file")).toBeVisible();
});

test("rejects evidence files larger than 5 MB with a citizen-friendly validation message", async ({ page }) => {
  await reachEvidence(page);
  await page.getByLabel("Upload evidence file").setInputFiles({
    name: "large-evidence.txt",
    mimeType: "text/plain",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1, "x"),
  });
  await expect(page.locator(".upload-error")).toContainText("That file is too large");
  await expect(page.getByText("Choose a file")).toBeVisible();
});

test("shows upload and processing stages, then renders the OpenAI evidence suggestions", async ({ page }) => {
  await reachEvidence(page);
  await page.route("**/api/evidence/upload", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ evidence: uploadedEvidence, storageMessage: "Stored in the private demo evidence vault." }) });
  });
  await page.route("**/api/evidence/extract", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ evidence: extractedEvidence, extraction: { source: "openai" } }) });
  });

  const upload = page.getByLabel("Upload evidence file");
  await upload.setInputFiles({ name: "upi-alert.txt", mimeType: "text/plain", buffer: Buffer.from("INR 18500 UTR-DEMO-18500") });
  await expect(page.getByText("Uploading your evidence…")).toBeVisible();
  await expect(page.getByText("Looking for useful details…")).toBeVisible();
  await expect(page.getByText("AI found possible details.").first()).toBeVisible();
  await expect(page.getByText("₹18,500", { exact: true })).toBeVisible();
  await expect(page.getByText("AI suggestion", { exact: true }).first()).toBeVisible();
});

test("accepts, edits and rejects candidate fields before the verified timeline update", async ({ page }) => {
  await reachEvidence(page);
  await page.route("**/api/evidence/upload", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ evidence: uploadedEvidence, storageMessage: "Stored in the private demo evidence vault." }) });
  });
  await page.route("**/api/evidence/extract", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ evidence: extractedEvidence, extraction: { source: "openai" } }) });
  });
  await page.route("**/api/evidence/verify", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ evidence: extractedEvidence, persisted: true }) });
  });

  await page.getByLabel("Upload evidence file").setInputFiles({ name: "upi-alert.txt", mimeType: "text/plain", buffer: Buffer.from("INR 18500") });
  await expect(page.getByText("₹18,500", { exact: true })).toBeVisible();

  const amountCard = page.locator(".evidence-field-card").filter({ hasText: "Amount" }).first();
  await amountCard.getByRole("button", { name: "Accept" }).click();
  await expect(amountCard).toContainText("You confirmed this detail.");

  await amountCard.getByRole("button", { name: "Edit" }).click();
  await amountCard.getByLabel("Edit Amount").fill("₹18,250");
  await amountCard.getByRole("button", { name: "Save" }).click();
  await expect(amountCard).toContainText("₹18,250");

  const referenceCard = page.locator(".evidence-field-card").filter({ hasText: "Transaction reference" }).first();
  await referenceCard.getByRole("button", { name: "Remove" }).click();
  await expect(referenceCard).toContainText("This suggestion was removed");

  await page.getByRole("button", { name: /Confirm verified details/i }).click();
  await expect(page.getByRole("heading", { name: /Your incident, in order/i })).toBeVisible();
  await expect(page.locator(".timeline")).toContainText("Evidence-derived");
  await expect(page.locator(".timeline")).toContainText("₹18,250");
  await page.reload();
  await expect(page.getByRole("heading", { name: /Your incident, in order/i })).toBeVisible();
  await expect(page.locator(".timeline")).toContainText("₹18,250");
});

test("uses the deterministic extraction fallback when OpenAI is unavailable", async ({ page }) => {
  await reachEvidence(page);
  await page.getByLabel("Upload evidence file").setInputFiles("tests/fixtures/demo-evidence.txt");
  await expect(page.getByText("AI extraction unavailable — showing the demo extraction.")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("₹18,500", { exact: true })).toBeVisible();
  await expect(page.getByText("UTR-DEMO-18500", { exact: true })).toBeVisible();
});

test("evidence extraction API returns structured deterministic fields when OpenAI is unavailable", async ({ request }) => {
  const response = await request.post("/api/evidence/extract", {
    data: {
      evidence: uploadedEvidence,
      content: {
        kind: "text",
        data: "UPI debit alert: INR 18,500 on 12 Aug 2026 at 14:32 IST. Transaction reference: UTR-DEMO-18500.",
        mimeType: "text/plain",
      },
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.extraction.source).toBe("demo_fallback");
  expect(body.evidence.candidateFields).toEqual(expect.arrayContaining([
    expect.objectContaining({ fieldKey: "transactionAmount", value: "₹18,500", verificationStatus: "candidate" }),
    expect.objectContaining({ fieldKey: "transactionReference", value: "UTR-DEMO-18500", verificationStatus: "candidate" }),
  ]));
});

test("evidence verification is idempotent for the same evidence and field keys", async ({ request }) => {
  const confirmedEvidence = {
    ...extractedEvidence,
    verificationStatus: "confirmed",
    candidateFields: extractedEvidence.candidateFields.map((field) => ({ ...field, verificationStatus: "confirmed" })),
  };
  const first = await request.post("/api/evidence/verify", { data: { interpretation, evidence: confirmedEvidence } });
  const second = await request.post("/api/evidence/verify", { data: { interpretation, evidence: confirmedEvidence } });
  expect(first.ok()).toBeTruthy();
  expect(second.ok()).toBeTruthy();
  const firstResult = await first.json();
  const secondResult = await second.json();
  expect(firstResult.incidentId).toBe(secondResult.incidentId);
  expect(firstResult.confirmedFieldCount).toBe(3);
  expect(secondResult.confirmedFieldCount).toBe(3);
});

test("keeps the evidence workspace within 390px and 412px viewports", async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 412, height: 915 }]) {
    const viewportPage = await page.context().newPage();
    await viewportPage.setViewportSize(viewport);
    await reachEvidence(viewportPage);
    const metrics = await viewportPage.evaluate(() => ({ viewport: window.innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport);
    expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewport);
    await viewportPage.close();
  }
});

test("renders the privacy policy page with prototype boundary disclosure", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy Policy", exact: true })).toBeVisible();
  await expect(page.getByText("What Information We Collect")).toBeVisible();
  await expect(page.getByText("Prototype Boundary")).toBeVisible();
  await expect(page.locator("#main-content")).toBeVisible();
});

test("renders the terms of use page with critical disclaimers", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Terms of Use", exact: true })).toBeVisible();
  await expect(page.getByText("What CyberDesk Cannot Do")).toBeVisible();
  await expect(page.getByText("Critical Prototype Disclaimer")).toBeVisible();
  await expect(page.locator("#main-content")).toBeVisible();
});

test("renders custom 404 page with official 1930 guidance for unknown routes", async ({ page }) => {
  await page.goto("/some-nonexistent-page-url");
  await expect(page.getByRole("heading", { name: "Page not found", exact: true })).toBeVisible();
  await expect(page.locator("a[href='tel:1930']").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "← Return home" })).toBeVisible();
});

test("provides accessible skip link navigating to #main-content", async ({ page }) => {
  await page.goto("/");
  const skipLink = page.locator("a.skip-link");
  await expect(skipLink).toBeAttached();
  await expect(skipLink).toHaveAttribute("href", "#main-content");
  await expect(page.locator("#main-content")).toBeAttached();
});

