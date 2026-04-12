export interface CaseUser {
  userId: number;
  name: string;
  role: string;
  createdAt?: string;
}

export interface Case {
  cin: string;
  defendantDetails: string;
  crimeType: string;
  arrestInfo: string;
  prosecutorDetails: string;
  status: string;
  judgmentSummary?: string | null;
  createdBy?: CaseUser | number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCasePayload {
  defendantDetails: string;
  crimeType: string;
  arrestInfo: string;
  prosecutorDetails: string;
  createdBy?: number;
}

export interface UpdateCasePayload {
  defendantDetails: string;
  crimeType: string;
  arrestInfo: string;
  prosecutorDetails: string;
}

export interface Hearing {
  hearingId: number;
  hearingDate: string;
  courtSlot: string;
  createdAt?: string;
  caseEntity?: Case;
}

export interface ScheduleHearingPayload {
  cin: string;
  hearingDate: string;
  courtSlot: string;
}

export interface AdjournmentPayload {
  hearingId: number;
  reason: string;
  newHearingDate: string;
}
