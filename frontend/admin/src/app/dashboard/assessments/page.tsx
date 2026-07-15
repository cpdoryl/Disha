"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiRequestError, type Assessment } from "@/lib/api";

const STATUS_STYLES: Record<Assessment["status"], string> = {
  draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  active: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  closed: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  archived: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AssessmentsPage() {
  const { user, token } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !token || !user.schoolId) {
      setIsLoading(false);
      return;
    }
    api
      .getAssessmentsBySchool(user.schoolId, token)
      .then(setAssessments)
      .catch((err) =>
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Failed to load assessments",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [user, token]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Assessments
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Challenge assessment cycles for your school.
      </p>

      {isLoading && (
        <p className="mt-6 text-sm text-zinc-500">Loading...</p>
      )}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!isLoading && !error && assessments && assessments.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">
          No assessment cycles have been created yet.
        </p>
      )}

      {!isLoading && !error && assessments && assessments.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <Th>Cycle</Th>
                <Th>Status</Th>
                <Th>Start</Th>
                <Th>End</Th>
                <Th>Description</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {assessments.map((assessment) => (
                <tr key={assessment.id}>
                  <Td>{assessment.cycleName}</Td>
                  <Td>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[assessment.status]}`}
                    >
                      {assessment.status}
                    </span>
                  </Td>
                  <Td>{formatDate(assessment.startDate)}</Td>
                  <Td>{formatDate(assessment.endDate)}</Td>
                  <Td className="max-w-xs truncate">
                    {assessment.description ?? "—"}
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

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-2 text-zinc-700 dark:text-zinc-300 ${className}`}>
      {children}
    </td>
  );
}
