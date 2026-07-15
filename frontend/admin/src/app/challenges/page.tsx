"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiRequestError, type Challenge } from "@/lib/api";

const CATEGORY_ORDER: Challenge["category"][] = [
  "growth_enrollment",
  "people",
  "academic_wellbeing",
  "reputation_marketing",
  "operations_finance",
];

const CATEGORY_LABELS: Record<Challenge["category"], string> = {
  growth_enrollment: "Growth & Enrollment",
  people: "People",
  academic_wellbeing: "Academic & Wellbeing",
  reputation_marketing: "Reputation & Marketing",
  operations_finance: "Operations & Finance",
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState<Challenge[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api
      .getChallenges()
      .then(setChallenges)
      .catch((err) =>
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Failed to load challenges",
        ),
      )
      .finally(() => setIsLoading(false));
  }, []);

  const grouped = useMemo(() => {
    if (!challenges) return [];
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: challenges.filter((c) => c.category === category),
    })).filter((group) => group.items.length > 0);
  }, [challenges]);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleContinue() {
    setIsSubmitting(true);
    setError(null);
    try {
      const selected = await api.getSelectedChallenges(Array.from(selectedIds));
      setConfirmed(selected);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Failed to continue with selected challenges",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Got it.
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          We&apos;ll build a targeted assessment around these {confirmed.length}{" "}
          {confirmed.length === 1 ? "priority" : "priorities"}:
        </p>
        <ul className="mt-6 space-y-3">
          {confirmed.map((challenge) => (
            <li
              key={challenge.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {challenge.displayName}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {challenge.description}
              </p>
            </li>
          ))}
        </ul>
        <button
          onClick={() => setConfirmed(null)}
          className="mt-8 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          ← Change selection
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 pb-32">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        What&apos;s worrying you right now?
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Pick the challenges that are on your mind. We&apos;ll turn them into a
        focused assessment instead of a long survey.
      </p>

      {isLoading && (
        <p className="mt-8 text-sm text-zinc-500">Loading challenges...</p>
      )}
      {error && <p className="mt-8 text-sm text-red-600">{error}</p>}

      {!isLoading && !error && (
        <div className="mt-10 space-y-10">
          {grouped.map((group) => (
            <section key={group.category}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {CATEGORY_LABELS[group.category]}
              </h2>
              <div className="mt-3 space-y-2">
                {group.items.map((challenge) => {
                  const isSelected = selectedIds.has(challenge.id);
                  return (
                    <label
                      key={challenge.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                        isSelected
                          ? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(challenge.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium text-zinc-900 dark:text-zinc-50">
                          {challenge.displayName}
                        </span>
                        <span className="mt-0.5 block text-sm text-zinc-500">
                          {challenge.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {!isLoading && !error && (
        <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-black/95">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <span className="text-sm text-zinc-500">
              {selectedIds.size === 0
                ? "Select at least one challenge"
                : `${selectedIds.size} selected`}
            </span>
            <button
              onClick={handleContinue}
              disabled={selectedIds.size === 0 || isSubmitting}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isSubmitting ? "Continuing..." : "Continue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
