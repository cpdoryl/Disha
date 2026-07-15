"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiRequestError } from "@/lib/api";

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [metrics, setMetrics] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !token || !user.schoolId) {
      setIsLoading(false);
      return;
    }
    api
      .getSchoolMetrics(user.schoolId, token)
      .then(setMetrics)
      .catch((err) =>
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Failed to load metrics",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [user, token]);

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Welcome, {user?.firstName}
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Here&apos;s a snapshot of your school.
      </p>

      <div className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          School metrics
        </h3>
        {isLoading && (
          <p className="mt-2 text-sm text-zinc-500">Loading...</p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {!isLoading && !error && (
          <pre className="mt-2 overflow-x-auto text-xs text-zinc-600 dark:text-zinc-400">
            {JSON.stringify(metrics, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
