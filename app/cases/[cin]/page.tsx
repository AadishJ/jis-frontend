"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  buildCreateCasePayload,
  DEFAULT_COURT_SLOTS,
  formatDateTime,
  parseCaseDisplayFields,
  type CaseRegistrationForm,
} from "@/lib/case-details";
import { API, getApiErrorMessage } from "@/lib/api";
import type { Case, Hearing, UpdateCasePayload } from "@/types/case";

const emptyEditForm: CaseRegistrationForm = {
  defendantName: "",
  defendantAddress: "",
  lawyerName: "",
  crimeType: "",
  offenseDate: "",
  offenseLocation: "",
  arrestingOfficer: "",
  arrestDate: "",
  publicProsecutor: "",
  presidingJudge: "",
  trialStartDate: "",
  expectedCompletionDate: "",
};

export default function CasePage() {
  const { cin } = useParams<{ cin: string }>();
  const [data, setData] = useState<Case | null>(null);
  const [editForm, setEditForm] = useState<CaseRegistrationForm>(emptyEditForm);
  const [hearingDate, setHearingDate] = useState("");
  const [courtSlot, setCourtSlot] = useState<string>(DEFAULT_COURT_SLOTS[0]);
  const [hearingId, setHearingId] = useState("");
  const [adjournReason, setAdjournReason] = useState("");
  const [proceedingsSummary, setProceedingsSummary] = useState("");
  const [newHearingDate, setNewHearingDate] = useState("");
  const [judgmentSummary, setJudgmentSummary] = useState("");
  const [lastScheduledHearingId, setLastScheduledHearingId] = useState<
    number | null
  >(null);
  const [loadingAction, setLoadingAction] = useState<
    "none" | "edit" | "schedule" | "adjourn" | "close"
  >("none");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const applyCaseToForm = (caseData: Case) => {
    const parsed = parseCaseDisplayFields(caseData);

    setEditForm({
      defendantName: parsed.defendantName,
      defendantAddress: parsed.defendantAddress,
      lawyerName: parsed.lawyerName,
      crimeType: caseData.crimeType ?? "",
      offenseDate: parsed.offenseDate,
      offenseLocation: parsed.offenseLocation,
      arrestingOfficer: parsed.arrestingOfficer,
      arrestDate: parsed.arrestDate,
      publicProsecutor: parsed.publicProsecutor,
      presidingJudge: parsed.presidingJudge,
      trialStartDate: parsed.trialStartDate,
      expectedCompletionDate: parsed.expectedCompletionDate,
    });

    setJudgmentSummary(caseData.judgmentSummary ?? "");
  };

  const loadCase = useCallback(async () => {
    try {
      setError("");
      const response = await API.get<Case>(`/cases/${cin}`);
      setData(response.data);
      applyCaseToForm(response.data);
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, "Unable to load case"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [cin]);

  useEffect(() => {
    void loadCase();
  }, [loadCase]);

  const updateEditForm = (field: keyof CaseRegistrationForm, value: string) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const saveCaseEdits = async () => {
    if (
      !editForm.defendantName ||
      !editForm.crimeType ||
      !editForm.publicProsecutor
    ) {
      setError(
        "Defendant, crime type, and prosecutor are required to update case",
      );
      return;
    }

    try {
      setLoadingAction("edit");
      setError("");
      setSuccess("");

      const payload = buildCreateCasePayload(editForm);
      const updatePayload: UpdateCasePayload = {
        defendantDetails: payload.defendantDetails,
        crimeType: payload.crimeType,
        arrestInfo: payload.arrestInfo,
        prosecutorDetails: payload.prosecutorDetails,
      };

      const response = await API.put<Case>(`/cases/${cin}`, updatePayload);
      setData(response.data);
      setSuccess("Case details updated successfully");
      applyCaseToForm(response.data);
    } catch (updateError) {
      setError(getApiErrorMessage(updateError, "Unable to update case"));
    } finally {
      setLoadingAction("none");
    }
  };

  const scheduleHearing = async () => {
    if (!hearingDate) {
      setError("Select a hearing date");
      return;
    }

    try {
      setLoadingAction("schedule");
      setError("");
      setSuccess("");

      const response = await API.post<Hearing>("/cases/hearings", {
        cin,
        hearingDate,
        courtSlot,
      });

      setLastScheduledHearingId(response.data.hearingId);
      setHearingId(String(response.data.hearingId));
      setSuccess(
        `Hearing scheduled on ${response.data.hearingDate} (${response.data.courtSlot})`,
      );
      setHearingDate("");
    } catch (scheduleError) {
      setError(getApiErrorMessage(scheduleError, "Unable to schedule hearing"));
    } finally {
      setLoadingAction("none");
    }
  };

  const adjourn = async () => {
    if (!hearingId || Number.isNaN(Number(hearingId))) {
      setError("Enter a valid hearing ID");
      return;
    }

    if (!newHearingDate) {
      setError("Select the new hearing date");
      return;
    }

    const reasonParts = [
      adjournReason.trim() ? `Adjournment Reason: ${adjournReason.trim()}` : "",
      proceedingsSummary.trim()
        ? `Proceedings Summary: ${proceedingsSummary.trim()}`
        : "",
    ].filter(Boolean);

    if (reasonParts.length === 0) {
      setError("Enter an adjournment reason or proceedings summary");
      return;
    }

    try {
      setLoadingAction("adjourn");
      setError("");
      setSuccess("");

      await API.post("/cases/adjournments", {
        hearingId: Number(hearingId),
        reason: reasonParts.join(" | "),
        newHearingDate,
      });

      setSuccess("Adjournment/proceedings recorded and hearing rescheduled");
      setAdjournReason("");
      setProceedingsSummary("");
      setNewHearingDate("");
      await loadCase();
    } catch (adjournError) {
      setError(
        getApiErrorMessage(adjournError, "Unable to record adjournment"),
      );
    } finally {
      setLoadingAction("none");
    }
  };

  const closeCase = async () => {
    if (!judgmentSummary.trim()) {
      setError("Enter judgment summary before closing the case");
      return;
    }

    try {
      setLoadingAction("close");
      setError("");
      setSuccess("");

      const response = await API.post<Case>(`/cases/${cin}/close`, {
        judgmentSummary: judgmentSummary.trim(),
      });

      setData(response.data);
      setSuccess("Case closed successfully");
    } catch (closeError) {
      setError(getApiErrorMessage(closeError, "Unable to close case"));
    } finally {
      setLoadingAction("none");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>{error || "Case not found"}</p>;

  const details = parseCaseDisplayFields(data);
  const isClosed = data.status === "CLOSED";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{cin}</h1>
        <p className="text-sm text-gray-500">UC-02/03/04/05: Case operations</p>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-3">
        <h2 className="font-semibold">Case Overview</h2>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <p>
            <span className="font-medium">Status:</span> {data.status}
          </p>

          <p>
            <span className="font-medium">Case Created:</span>{" "}
            {formatDateTime(data.createdAt)}
          </p>

          <p>
            <span className="font-medium">Defendant:</span>{" "}
            {details.defendantName || "-"}
          </p>

          <p>
            <span className="font-medium">Address:</span>{" "}
            {details.defendantAddress || "-"}
          </p>

          <p>
            <span className="font-medium">Lawyer:</span>{" "}
            {details.lawyerName || "-"}
          </p>

          <p>
            <span className="font-medium">Crime Type:</span>{" "}
            {data.crimeType || "-"}
          </p>

          <p>
            <span className="font-medium">Public Prosecutor:</span>{" "}
            {details.publicProsecutor || "-"}
          </p>

          <p>
            <span className="font-medium">Presiding Judge:</span>{" "}
            {details.presidingJudge || "-"}
          </p>

          <p>
            <span className="font-medium">Offense Date:</span>{" "}
            {details.offenseDate || "-"}
          </p>

          <p>
            <span className="font-medium">Offense Location:</span>{" "}
            {details.offenseLocation || "-"}
          </p>

          <p>
            <span className="font-medium">Arresting Officer:</span>{" "}
            {details.arrestingOfficer || "-"}
          </p>

          <p>
            <span className="font-medium">Arrest Date:</span>{" "}
            {details.arrestDate || "-"}
          </p>
        </div>

        {data.judgmentSummary && (
          <div className="rounded-lg bg-gray-50 border p-3 text-sm">
            <p className="font-medium mb-1">Judgment Summary</p>
            <p>{data.judgmentSummary}</p>
          </div>
        )}
      </div>

      {(error || success) && (
        <div className="rounded-xl border bg-white p-4 text-sm">
          {error && <p className="text-red-600">{error}</p>}
          {success && <p className="text-green-700">{success}</p>}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <h2 className="text-sm font-semibold">UC-02: Edit Case</h2>

        <div className="grid gap-3 md:grid-cols-2 text-sm">
          <label className="space-y-1">
            <span className="font-medium">Defendant Name</span>
            <input
              className="w-full border rounded p-2"
              value={editForm.defendantName}
              onChange={(event) =>
                updateEditForm("defendantName", event.target.value)
              }
            />
          </label>

          <label className="space-y-1">
            <span className="font-medium">Defendant Address</span>
            <input
              className="w-full border rounded p-2"
              value={editForm.defendantAddress}
              onChange={(event) =>
                updateEditForm("defendantAddress", event.target.value)
              }
            />
          </label>

          <label className="space-y-1">
            <span className="font-medium">Lawyer Name</span>
            <input
              className="w-full border rounded p-2"
              value={editForm.lawyerName}
              onChange={(event) =>
                updateEditForm("lawyerName", event.target.value)
              }
            />
          </label>

          <label className="space-y-1">
            <span className="font-medium">Crime Type</span>
            <input
              className="w-full border rounded p-2"
              value={editForm.crimeType}
              onChange={(event) =>
                updateEditForm("crimeType", event.target.value)
              }
            />
          </label>

          <label className="space-y-1">
            <span className="font-medium">Date Of Offense</span>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={editForm.offenseDate}
              onChange={(event) =>
                updateEditForm("offenseDate", event.target.value)
              }
            />
          </label>

          <label className="space-y-1">
            <span className="font-medium">Location Of Offense</span>
            <input
              className="w-full border rounded p-2"
              value={editForm.offenseLocation}
              onChange={(event) =>
                updateEditForm("offenseLocation", event.target.value)
              }
            />
          </label>

          <label className="space-y-1">
            <span className="font-medium">Arresting Officer</span>
            <input
              className="w-full border rounded p-2"
              value={editForm.arrestingOfficer}
              onChange={(event) =>
                updateEditForm("arrestingOfficer", event.target.value)
              }
            />
          </label>

          <label className="space-y-1">
            <span className="font-medium">Date Of Arrest</span>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={editForm.arrestDate}
              onChange={(event) =>
                updateEditForm("arrestDate", event.target.value)
              }
            />
          </label>

          <label className="space-y-1">
            <span className="font-medium">Public Prosecutor</span>
            <input
              className="w-full border rounded p-2"
              value={editForm.publicProsecutor}
              onChange={(event) =>
                updateEditForm("publicProsecutor", event.target.value)
              }
            />
          </label>

          <label className="space-y-1">
            <span className="font-medium">Presiding Judge</span>
            <input
              className="w-full border rounded p-2"
              value={editForm.presidingJudge}
              onChange={(event) =>
                updateEditForm("presidingJudge", event.target.value)
              }
            />
          </label>

          <label className="space-y-1">
            <span className="font-medium">Trial Start Date</span>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={editForm.trialStartDate}
              onChange={(event) =>
                updateEditForm("trialStartDate", event.target.value)
              }
            />
          </label>

          <label className="space-y-1">
            <span className="font-medium">Expected Completion Date</span>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={editForm.expectedCompletionDate}
              onChange={(event) =>
                updateEditForm("expectedCompletionDate", event.target.value)
              }
            />
          </label>
        </div>

        <button
          onClick={saveCaseEdits}
          disabled={loadingAction !== "none" || isClosed}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {loadingAction === "edit" ? "Saving..." : "Save Case Changes"}
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <h2 className="text-sm font-semibold">UC-03: Schedule Hearing</h2>

        <div className="grid gap-3 md:grid-cols-3 text-sm">
          <label className="space-y-1">
            <span className="font-medium">Hearing Date</span>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={hearingDate}
              onChange={(event) => setHearingDate(event.target.value)}
            />
          </label>

          <label className="space-y-1">
            <span className="font-medium">Court Slot</span>
            <select
              className="w-full border rounded p-2"
              value={courtSlot}
              onChange={(event) => setCourtSlot(event.target.value)}
            >
              {DEFAULT_COURT_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-1">
            <span className="font-medium text-sm">
              Vacant Slots (working day)
            </span>
            <p className="rounded border bg-gray-50 p-2 text-xs text-gray-600">
              Select a slot above. For authoritative availability, backend
              validation still applies at submission.
            </p>
          </div>
        </div>

        <button
          onClick={scheduleHearing}
          disabled={loadingAction !== "none" || isClosed}
          className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {loadingAction === "schedule" ? "Scheduling..." : "Schedule Hearing"}
        </button>

        {lastScheduledHearingId && (
          <p className="text-xs text-gray-600">
            Last scheduled hearing ID: {lastScheduledHearingId}
          </p>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <h2 className="text-sm font-semibold">
          UC-04: Record Adjournment / Proceedings
        </h2>

        <div className="grid gap-3 md:grid-cols-3 text-sm">
          <label className="space-y-1">
            <span className="font-medium">Hearing ID</span>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={hearingId}
              onChange={(event) => setHearingId(event.target.value)}
              placeholder="e.g. 2"
            />
          </label>

          <label className="space-y-1">
            <span className="font-medium">New Hearing Date</span>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={newHearingDate}
              onChange={(event) => setNewHearingDate(event.target.value)}
            />
          </label>

          <div className="rounded border bg-gray-50 p-2 text-xs text-gray-600">
            Enter the hearing ID returned by the schedule API response.
          </div>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Adjournment Reason</span>
          <textarea
            className="w-full border rounded p-2 min-h-20"
            value={adjournReason}
            onChange={(event) => setAdjournReason(event.target.value)}
            placeholder="Judge unavailable, witness absent, etc."
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">
            Proceedings Summary (if hearing took place)
          </span>
          <textarea
            className="w-full border rounded p-2 min-h-24"
            value={proceedingsSummary}
            onChange={(event) => setProceedingsSummary(event.target.value)}
            placeholder="Enter hearing proceedings summary before assigning next date"
          />
        </label>

        <button
          onClick={adjourn}
          disabled={loadingAction !== "none" || isClosed}
          className="rounded bg-amber-500 px-4 py-2 text-white disabled:opacity-60"
        >
          {loadingAction === "adjourn"
            ? "Submitting..."
            : "Record Adjournment / Proceedings"}
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <h2 className="text-sm font-semibold">UC-05: Close Case</h2>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Judgment Summary</span>
          <textarea
            className="w-full border rounded p-2 min-h-24"
            value={judgmentSummary}
            onChange={(event) => setJudgmentSummary(event.target.value)}
          />
        </label>

        <button
          onClick={closeCase}
          disabled={loadingAction !== "none" || isClosed}
          className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {isClosed
            ? "Case Already Closed"
            : loadingAction === "close"
              ? "Closing..."
              : "Close Case"}
        </button>
      </div>

      <div className="rounded-xl border bg-white p-4 text-xs text-gray-600">
        Status Query: CIN {data.cin} is currently marked as {data.status}.
      </div>
    </div>
  );
}
