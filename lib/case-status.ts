import type { DemoCase } from "./types";

export const CASE_STATUS_LABELS: Record<DemoCase["status"], string> = {
  draft: "Not submitted",
  submitted: "Submitted",
  information_received: "Information received",
  under_review: "Under review",
};

export const CASE_STATUS_DETAILS: Record<DemoCase["status"], string> = {
  draft: "The synthetic report has not been submitted.",
  submitted: "The synthetic report was created.",
  information_received: "Synthetic details and evidence were accepted by the prototype.",
  under_review: "The prototype shows the synthetic package as being reviewed.",
};

export const STATUS_ORDER: Array<Exclude<DemoCase["status"], "draft">> = [
  "submitted",
  "information_received",
  "under_review",
];

export function statusLabel(status: DemoCase["status"]): string {
  return CASE_STATUS_LABELS[status];
}

export function statusProgress(status: DemoCase["status"]) {
  const currentIndex = STATUS_ORDER.indexOf(status as (typeof STATUS_ORDER)[number]);
  return STATUS_ORDER.map((item, index) => ({
    status: item,
    label: CASE_STATUS_LABELS[item],
    detail: CASE_STATUS_DETAILS[item],
    done: currentIndex >= 0 && index < currentIndex,
    active: currentIndex >= 0 && index === currentIndex,
  }));
}
