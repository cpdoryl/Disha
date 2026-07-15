"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiRequestError, type Staff } from "@/lib/api";

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function StaffPage() {
  const { user, token } = useAuth();
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !token || !user.schoolId) {
      setIsLoading(false);
      return;
    }
    api
      .getStaffBySchool(user.schoolId, token)
      .then(setStaff)
      .catch((err) =>
        setError(
          err instanceof ApiRequestError ? err.message : "Failed to load staff",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [user, token]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Staff
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Active staff members at your school.
      </p>

      {isLoading && <p className="mt-6 text-sm text-zinc-500">Loading...</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!isLoading && !error && staff && staff.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">No staff found.</p>
      )}

      {!isLoading && !error && staff && staff.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <Th>Employee #</Th>
                <Th>Name</Th>
                <Th>Position</Th>
                <Th>Subject / Grade</Th>
                <Th>Contact</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {staff.map((member) => (
                <tr key={member.id}>
                  <Td>{member.employeeId}</Td>
                  <Td>
                    {member.firstName} {member.lastName}
                  </Td>
                  <Td>{formatLabel(member.position)}</Td>
                  <Td>
                    {member.subjectTaught ?? "—"}
                    {member.gradeLevel ? ` (Grade ${member.gradeLevel})` : ""}
                  </Td>
                  <Td>
                    {member.email ?? "—"}
                    {member.phone ? ` · ${member.phone}` : ""}
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
