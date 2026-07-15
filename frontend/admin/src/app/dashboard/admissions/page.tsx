"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiRequestError, type Admission } from "@/lib/api";

const STATUS_STYLES: Record<Admission["status"], string> = {
  inquiry: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  application: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  applied: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  interviewed:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  offered: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  waitlisted:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  admitted:
    "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  declined: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdmissionsPage() {
  const { user, token } = useAuth();
  const [admissions, setAdmissions] = useState<Admission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !token || !user.schoolId) {
      setIsLoading(false);
      return;
    }
    api
      .getAdmissionsBySchool(user.schoolId, token)
      .then(setAdmissions)
      .catch((err) =>
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Failed to load admissions",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [user, token]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Admissions
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Admissions pipeline for your school.
      </p>

      {isLoading && (
        <p className="mt-6 text-sm text-zinc-500">Loading...</p>
      )}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!isLoading && !error && admissions && admissions.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">
          No admissions pipeline entries yet.
        </p>
      )}

      {!isLoading && !error && admissions && admissions.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <Th>Applicant</Th>
                <Th>Grade Applied</Th>
                <Th>Status</Th>
                <Th>Source</Th>
                <Th>Applied On</Th>
                <Th>Guardian</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {admissions.map((admission) => (
                <tr key={admission.id}>
                  <Td>{admission.studentName}</Td>
                  <Td>{admission.gradeApplied}</Td>
                  <Td>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[admission.status]}`}
                    >
                      {formatLabel(admission.status)}
                    </span>
                  </Td>
                  <Td>{formatLabel(admission.sourceOfInquiry)}</Td>
                  <Td>{formatDate(admission.admissionDate)}</Td>
                  <Td>
                    {admission.guardianName ?? "—"}
                    {admission.guardianPhone
                      ? ` (${admission.guardianPhone})`
                      : ""}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left font-medium text-zinc-500">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{children}</td>
  );
}
