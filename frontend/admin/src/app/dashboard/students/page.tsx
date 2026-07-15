"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiRequestError, type Student } from "@/lib/api";

export default function StudentsPage() {
  const { user, token } = useAuth();
  const [students, setStudents] = useState<Student[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !token || !user.schoolId) {
      setIsLoading(false);
      return;
    }
    api
      .getStudentsBySchool(user.schoolId, token)
      .then(setStudents)
      .catch((err) =>
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Failed to load students",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [user, token]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Students
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Active students enrolled at your school.
      </p>

      {isLoading && (
        <p className="mt-6 text-sm text-zinc-500">Loading...</p>
      )}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!isLoading && !error && students && students.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">No students found.</p>
      )}

      {!isLoading && !error && students && students.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <Th>Enrollment #</Th>
                <Th>Name</Th>
                <Th>Grade</Th>
                <Th>Gender</Th>
                <Th>Guardian</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {students.map((student) => (
                <tr key={student.id}>
                  <Td>{student.enrollmentNumber}</Td>
                  <Td>
                    {student.firstName} {student.lastName}
                  </Td>
                  <Td>
                    {student.gradeLevel ?? "—"}
                    {student.classSection ? `-${student.classSection}` : ""}
                  </Td>
                  <Td className="capitalize">{student.gender ?? "—"}</Td>
                  <Td>
                    {student.guardianName ?? "—"}
                    {student.guardianPhone ? ` (${student.guardianPhone})` : ""}
                  </Td>
                  <Td className="capitalize">{student.status}</Td>
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
