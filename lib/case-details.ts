import type { Case, CreateCasePayload } from "@/types/case";

export const DEFAULT_COURT_SLOTS = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
] as const;

export type CaseRegistrationForm = {
  defendantName: string;
  defendantAddress: string;
  lawyerName: string;
  crimeType: string;
  offenseDate: string;
  offenseLocation: string;
  arrestingOfficer: string;
  arrestDate: string;
  publicProsecutor: string;
  presidingJudge: string;
  trialStartDate: string;
  expectedCompletionDate: string;
};

function clean(input: string) {
  return input.trim();
}

export function buildCreateCasePayload(
  form: CaseRegistrationForm,
  createdBy?: number,
): CreateCasePayload {
  const defendantName = clean(form.defendantName);
  const defendantAddress = clean(form.defendantAddress);
  const lawyerName = clean(form.lawyerName);
  const offenseDate = clean(form.offenseDate);
  const offenseLocation = clean(form.offenseLocation);
  const arrestingOfficer = clean(form.arrestingOfficer);
  const arrestDate = clean(form.arrestDate);
  const publicProsecutor = clean(form.publicProsecutor);
  const presidingJudge = clean(form.presidingJudge);
  const trialStartDate = clean(form.trialStartDate);
  const expectedCompletionDate = clean(form.expectedCompletionDate);

  return {
    defendantDetails: [
      defendantName,
      `Address: ${defendantAddress}`,
      `Lawyer: ${lawyerName}`,
    ].join(" | "),
    crimeType: clean(form.crimeType),
    arrestInfo: [
      `Officer: ${arrestingOfficer}`,
      `Arrest Date: ${arrestDate}`,
      `Offense Date: ${offenseDate}`,
      `Offense Location: ${offenseLocation}`,
    ].join(" | "),
    prosecutorDetails: [
      `Public Prosecutor: ${publicProsecutor}`,
      `Presiding Judge: ${presidingJudge}`,
      `Trial Start: ${trialStartDate}`,
      `Expected Completion: ${expectedCompletionDate}`,
    ].join(" | "),
    createdBy,
  };
}

function splitParts(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function getLabeledPart(
  value: string | null | undefined,
  label: string,
): string {
  const loweredLabel = `${label.toLowerCase()}:`;

  for (const part of splitParts(value)) {
    if (part.toLowerCase().startsWith(loweredLabel)) {
      return part.slice(loweredLabel.length).trim();
    }
  }

  return "";
}

export function getLeadPart(value: string | null | undefined): string {
  const [first] = splitParts(value);
  return first ?? "";
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function parseCaseDisplayFields(caseItem: Case) {
  return {
    defendantName: getLeadPart(caseItem.defendantDetails),
    defendantAddress: getLabeledPart(caseItem.defendantDetails, "Address"),
    lawyerName: getLabeledPart(caseItem.defendantDetails, "Lawyer"),
    arrestingOfficer: getLabeledPart(caseItem.arrestInfo, "Officer"),
    arrestDate: getLabeledPart(caseItem.arrestInfo, "Arrest Date"),
    offenseDate: getLabeledPart(caseItem.arrestInfo, "Offense Date"),
    offenseLocation: getLabeledPart(caseItem.arrestInfo, "Offense Location"),
    publicProsecutor: getLabeledPart(
      caseItem.prosecutorDetails,
      "Public Prosecutor",
    ),
    presidingJudge: getLabeledPart(
      caseItem.prosecutorDetails,
      "Presiding Judge",
    ),
    trialStartDate: getLabeledPart(caseItem.prosecutorDetails, "Trial Start"),
    expectedCompletionDate: getLabeledPart(
      caseItem.prosecutorDetails,
      "Expected Completion",
    ),
  };
}
