"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

const inputClass =
  "w-full rounded-lg border border-grey-light bg-grey-lightest px-3 py-2.5 text-sm outline-none transition focus:border-black focus:bg-pure-white";

function AcceptForm() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const invalidLink = !email || !token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not activate your account");
      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not activate your account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-2xl border border-grey-light bg-pure-white p-8">
      <div className="flex flex-col items-center text-center">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green font-heading text-sm font-extrabold text-pure-white">
          TC
        </span>
        <h1 className="font-heading text-xl font-semibold tracking-tight">Set your password</h1>
        <p className="mt-1 text-sm text-grey-dark">{email ? `Activating ${email}` : "Admin invite"}</p>
      </div>

      {invalidLink ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          This invite link is missing information. Ask an admin to re-send it.
        </p>
      ) : (
        <>
          <div>
            <label htmlFor="pw" className="mb-1.5 block text-sm font-medium">New password</label>
            <input id="pw" type="password" autoComplete="new-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <div>
            <label htmlFor="pw2" className="mb-1.5 block text-sm font-medium">Confirm password</label>
            <input id="pw2" type="password" autoComplete="new-password" className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-pure-white transition hover:bg-black-off disabled:opacity-60"
          >
            {loading ? "Activating…" : "Activate account"}
          </button>
        </>
      )}
    </form>
  );
}

export default function AdminInviteAcceptPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-grey-lightest px-4 py-16">
      <Suspense fallback={<div className="text-sm text-grey-dark">Loading…</div>}>
        <AcceptForm />
      </Suspense>
    </div>
  );
}
