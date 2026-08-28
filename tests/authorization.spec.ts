import { expect, test, type APIRequestContext } from "@playwright/test";

const userAHeaders = {
  "x-test-user-id": "user-alpha-001",
  "x-test-user-email": "citizen.alpha@example.com",
  "Authorization": "Bearer mock-token-user-alpha-001",
};

const userBHeaders = {
  "x-test-user-id": "user-beta-002",
  "x-test-user-email": "citizen.beta@example.com",
  "Authorization": "Bearer mock-token-user-beta-002",
};

async function createCaseForUserA(request: APIRequestContext) {
  const response = await request.post("/api/cases", {
    headers: userAHeaders,
    data: {
      incidentType: "Bank Impersonation KYC Fraud",
      description: "Received a fake KYC SMS claiming account suspension, followed by an unauthorized debit.",
      urgency: "high",
    },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  return body.case.id as string;
}

test.describe("Multi-User Authorization and Workspace Isolation", () => {
  test("User A creates and owns a private incident case", async ({ request }) => {
    const response = await request.post("/api/cases", {
      headers: userAHeaders,
      data: {
        incidentType: "User A Incident",
        description: "Private case created by Citizen Alpha.",
        urgency: "medium",
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.case).toBeDefined();
    expect(body.case.isDemo).toBe(false);
    expect(body.case.role).toBe("owner");
  });

  test("User A can retrieve their own case and case list", async ({ request }) => {
    const caseId = await createCaseForUserA(request);

    // 1. List cases
    const listRes = await request.get("/api/cases", { headers: userAHeaders });
    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.cases.some((c: any) => c.id === caseId)).toBe(true);

    // 2. Fetch case detail
    const detailRes = await request.get(`/api/cases/${caseId}`, { headers: userAHeaders });
    expect(detailRes.status()).toBe(200);
    const detailBody = await detailRes.json();
    expect(detailBody.case.id).toBe(caseId);
    expect(detailBody.case.description).toContain("fake KYC SMS");
  });

  test("User B CANNOT see User A's case in their case list", async ({ request }) => {
    const caseId = await createCaseForUserA(request);

    const listRes = await request.get("/api/cases", { headers: userBHeaders });
    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.cases.some((c: any) => c.id === caseId)).toBe(false);
  });

  test("User B CANNOT fetch User A's case details (fails closed with 404/403)", async ({ request }) => {
    const caseId = await createCaseForUserA(request);

    const response = await request.get(`/api/cases/${caseId}`, { headers: userBHeaders });
    expect([403, 404]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test("User B CANNOT upload evidence to User A's case", async ({ request }) => {
    const caseId = await createCaseForUserA(request);

    const boundary = "---------------------------974767299852498929531610575";
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="category"',
      "",
      "transaction",
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="malicious.txt"',
      "Content-Type: text/plain",
      "",
      "Unauthorized debit ₹50,000",
      `--${boundary}--`,
    ].join("\r\n");

    const response = await request.post(`/api/cases/${caseId}/evidence/upload`, {
      headers: {
        ...userBHeaders,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      data: body,
    });

    expect(response.status()).toBe(404);
    const result = await response.json();
    expect(result.error).toContain("Case not found");
  });

  test("User B CANNOT extract evidence or modify timeline for User A's case", async ({ request }) => {
    const caseId = await createCaseForUserA(request);

    const response = await request.post(`/api/cases/${caseId}/evidence/extract`, {
      headers: userBHeaders,
      data: {
        evidence: {
          id: "fake-evidence-id",
          type: "Transaction / payment",
          filename: "fake.txt",
          source: "Hacker upload",
          description: "Fake description",
          candidateFields: [],
          verificationStatus: "candidate",
        },
      },
    });

    expect(response.status()).toBe(404);
  });

  test("User B CANNOT verify facts or update timeline for User A's case", async ({ request }) => {
    const caseId = await createCaseForUserA(request);

    const response = await request.post(`/api/cases/${caseId}/evidence/verify`, {
      headers: userBHeaders,
      data: {
        interpretation: {
          incident_type: "Hacked",
          possible_method: null,
          amount: null,
          urgency: "high",
          mentioned_evidence: [],
          missing_information: [],
          uncertainties: [],
        },
        evidence: {
          id: "fake-evidence-id",
          type: "Transaction / payment",
          filename: "fake.txt",
          source: "Citizen",
          description: "Fake description",
          candidateFields: [],
          verificationStatus: "confirmed",
        },
      },
    });

    expect(response.status()).toBe(404);
  });

  test("User B CANNOT submit a report on User A's case", async ({ request }) => {
    const caseId = await createCaseForUserA(request);

    const response = await request.post(`/api/cases/${caseId}/reports/submit`, {
      headers: userBHeaders,
      data: {
        complaintText: "Unauthorized attempt by user B to alter user A's case report dossier.",
      },
    });

    expect(response.status()).toBe(404);
  });

  test("legacy demo mutation endpoints reject authenticated requests", async ({ request }) => {
    const response = await request.post("/api/reports/submit", {
      headers: userAHeaders,
      data: {
        interpretation: {
          incident_type: "Online financial fraud",
          possible_method: "UPI impersonation",
          amount: "18500",
          urgency: "high",
          mentioned_evidence: [],
          missing_information: [],
          uncertainties: [],
        },
        evidence: null,
        complaintText: "Authenticated users must not mutate the public synthetic demo through a legacy endpoint.",
      },
    });

    expect(response.status()).toBe(403);
  });

  test("case APIs return a non-enumerating 404 for malformed case identifiers", async ({ request }) => {
    const response = await request.get("/api/cases/not-a-uuid", { headers: userAHeaders });
    expect(response.status()).toBe(404);
    expect((await response.json()).error).toBe("Case not found.");
  });

  test("Unauthenticated requests to protected case APIs fail closed (401)", async ({ request }) => {
    const caseId = await createCaseForUserA(request);

    const listRes = await request.get("/api/cases");
    expect(listRes.status()).toBe(401);

    const getRes = await request.get(`/api/cases/${caseId}`);
    expect(getRes.status()).toBe(401);

    const postRes = await request.post("/api/cases", {
      data: { description: "Unauthenticated case" },
    });
    expect(postRes.status()).toBe(401);
  });

  test("production deployment ignores forged test identity headers", async ({ request }) => {
    test.skip(!process.env.CYBERDESK_PRODUCTION_BASE_URL, "Set CYBERDESK_PRODUCTION_BASE_URL to run against a separately started production server.");
    const response = await request.get(`${process.env.CYBERDESK_PRODUCTION_BASE_URL}/api/cases`, {
      headers: {
        "x-test-user-id": "user-alpha-001",
        "x-test-user-email": "citizen.alpha@example.com",
        Authorization: "Bearer mock-token-user-alpha-001",
      },
    });
    expect(response.status()).toBe(401);
  });

  test("User B is shown Access Denied in UI when navigating to User A's workspace URL", async ({ page, request }) => {
    const caseId = await createCaseForUserA(request);

    // 1. Log in as User B
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as Citizen Beta \(User B\)/i }).click();
    await expect(page).toHaveURL("/cases");

    // 2. Try navigating directly to User A's private case workspace URL
    await page.goto(`/cases/${caseId}`);
    await expect(page.getByRole("heading", { name: /Access Denied/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/You do not have access to this case workspace/i)).toBeVisible();
  });
});
