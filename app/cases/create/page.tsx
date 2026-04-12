"use client";

import Link from "next/link";
import { getApiErrorMessage } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  buildCreateCasePayload,
  type CaseRegistrationForm,
} from "@/lib/case-details";
import { useState } from "react";
import { API } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Case } from "@/types/case";

const initialForm: CaseRegistrationForm = {
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

export default function CreateCase() {
  const [form, setForm] = useState<CaseRegistrationForm>(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdCin, setCreatedCin] = useState("");
  const [checkingUser, setCheckingUser] = useState(true);
  const [isRegistrar, setIsRegistrar] = useState(false);
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const user = await getUser();

      if (!isMounted) {
        return;
      }

      const registrar = user?.role === "REGISTRAR";
      setIsRegistrar(registrar);
      setUserId(user?.userId);
      setCheckingUser(false);
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateForm = (field: keyof CaseRegistrationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateForm = () => {
    const requiredFields: Array<[keyof CaseRegistrationForm, string]> = [
      ["defendantName", "Defendant name"],
      ["defendantAddress", "Defendant address"],
      ["lawyerName", "Lawyer name"],
      ["crimeType", "Crime type"],
      ["offenseDate", "Date of offense"],
      ["offenseLocation", "Location of offense"],
      ["arrestingOfficer", "Arresting officer"],
      ["arrestDate", "Date of arrest"],
      ["publicProsecutor", "Public prosecutor"],
      ["presidingJudge", "Presiding judge"],
      ["trialStartDate", "Trial start date"],
      ["expectedCompletionDate", "Expected completion date"],
    ];

    const firstMissing = requiredFields.find(([field]) => !form[field].trim());

    if (!firstMissing) {
      return "";
    }

    return `${firstMissing[1]} is required`;
  };

  const submit = async () => {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const payload = buildCreateCasePayload(form, userId);
      const response = await API.post<Case>("/cases", payload);
      const cin = response.data.cin;

      setCreatedCin(cin);
      setSuccess(`Case created successfully${cin ? `: ${cin}` : ""}`);
      setForm(initialForm);
    } catch (createError) {
      setError(getApiErrorMessage(createError, "Unable to create case"));
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingUser) {
    return <p className="text-sm text-gray-600">Verifying role...</p>;
  }

  if (!isRegistrar) {
    return (
      <div className="rounded-xl border bg-white p-6 max-w-2xl space-y-2">
        <h1 className="text-xl font-semibold">Create Case</h1>
        <p className="text-sm text-red-600">
          Only registrars can create new court cases.
        </p>

        <button
          onClick={() => router.push("/")}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Go To Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create Case</h1>
        <p className="text-sm text-gray-500">
          UC-01: Register a case with all required trial metadata
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 space-y-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Defendant Name</span>
            <input
              className="w-full border p-2 rounded"
              value={form.defendantName}
              onChange={(event) =>
                updateForm("defendantName", event.target.value)
              }
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Defendant Address</span>
            <input
              className="w-full border p-2 rounded"
              value={form.defendantAddress}
              onChange={(event) =>
                updateForm("defendantAddress", event.target.value)
              }
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Lawyer Name</span>
            <input
              className="w-full border p-2 rounded"
              value={form.lawyerName}
              onChange={(event) => updateForm("lawyerName", event.target.value)}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Crime Type</span>
            <input
              className="w-full border p-2 rounded"
              value={form.crimeType}
              onChange={(event) => updateForm("crimeType", event.target.value)}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Date Of Offense</span>
            <input
              type="date"
              className="w-full border p-2 rounded"
              value={form.offenseDate}
              onChange={(event) =>
                updateForm("offenseDate", event.target.value)
              }
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Location Of Offense</span>
            <input
              className="w-full border p-2 rounded"
              value={form.offenseLocation}
              onChange={(event) =>
                updateForm("offenseLocation", event.target.value)
              }
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Arresting Officer</span>
            <input
              className="w-full border p-2 rounded"
              value={form.arrestingOfficer}
              onChange={(event) =>
                updateForm("arrestingOfficer", event.target.value)
              }
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Date Of Arrest</span>
            <input
              type="date"
              className="w-full border p-2 rounded"
              value={form.arrestDate}
              onChange={(event) => updateForm("arrestDate", event.target.value)}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Public Prosecutor</span>
            <input
              className="w-full border p-2 rounded"
              value={form.publicProsecutor}
              onChange={(event) =>
                updateForm("publicProsecutor", event.target.value)
              }
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Presiding Judge</span>
            <input
              className="w-full border p-2 rounded"
              value={form.presidingJudge}
              onChange={(event) =>
                updateForm("presidingJudge", event.target.value)
              }
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Trial Start Date</span>
            <input
              type="date"
              className="w-full border p-2 rounded"
              value={form.trialStartDate}
              onChange={(event) =>
                updateForm("trialStartDate", event.target.value)
              }
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Expected Completion Date</span>
            <input
              type="date"
              className="w-full border p-2 rounded"
              value={form.expectedCompletionDate}
              onChange={(event) =>
                updateForm("expectedCompletionDate", event.target.value)
              }
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={submit}
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Case"}
          </button>

          <button
            onClick={() => router.push("/cases/pending")}
            className="border px-4 py-2 rounded"
          >
            View Pending Cases
          </button>

          {createdCin && (
            <Link
              href={`/cases/${createdCin}`}
              className="border px-4 py-2 rounded bg-gray-50"
            >
              Open {createdCin}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
