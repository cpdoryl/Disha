"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Disha Admin
          </p>
          <p className="text-xs text-zinc-500">
            {user.firstName} {user.lastName} · {user.role}
          </p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          Sign out
        </button>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
