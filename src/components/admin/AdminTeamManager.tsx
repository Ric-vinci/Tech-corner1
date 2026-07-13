"use client";

import { useState } from "react";
import type { AdminUser } from "@/lib/admin/admins";

type Props = { ownerEmail: string; currentEmail: string; initialAdmins: AdminUser[] };

const inputClass =
  "w-full rounded-lg border border-grey-light bg-grey-lightest px-3 py-2.5 text-sm outline-none transition focus:border-black focus:bg-pure-white";

const formatDate = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function AdminTeamManager({ ownerEmail, currentEmail, initialAdmins }: Props) {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [emailed, setEmailed] = useState(false);

  async function refresh() {
    const res = await fetch("/api/admin/admins");
    if (res.ok) setAdmins((await res.json()).admins ?? []);
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInviteUrl(null);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send invite");
      setInviteUrl(data.inviteUrl);
      setEmailed(Boolean(data.emailed));
      setEmail("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send invite");
    } finally {
      setLoading(false);
    }
  }

  async function revoke(admin: AdminUser) {
    if (!window.confirm(`Remove ${admin.email}? They will lose admin access.`)) return;
    const res = await fetch(`/api/admin/admins/${admin.id}`, { method: "DELETE" });
    if (res.ok) setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
  }

  return (
    <div className="space-y-8">
      <form onSubmit={invite} className="rounded-2xl border border-grey-light bg-pure-white p-5">
        <h2 className="mb-1 font-heading text-lg font-semibold">Invite an admin</h2>
        <p className="mb-4 text-sm text-grey-dark">
          They&apos;ll get an email with a link to set their own password. The invite link expires in 3 days.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            className={inputClass}
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-pure-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send invite"}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            {error}
          </p>
        )}

        {inviteUrl && (
          <div className="mt-3 rounded-lg bg-green/10 px-3 py-3 text-sm ring-1 ring-inset ring-green/30">
            <p className="font-medium text-black">
              {emailed ? "Invite emailed." : "Invite created — email isn't configured, so share this link:"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input readOnly value={inviteUrl} className="w-full truncate rounded border border-grey-light bg-pure-white px-2 py-1.5 text-xs" onFocus={(e) => e.target.select()} />
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(inviteUrl)}
                className="shrink-0 rounded border border-grey-light px-3 py-1.5 text-xs font-medium hover:bg-grey-lightest"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </form>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">Admins</h2>
        <div className="overflow-hidden rounded-2xl border border-grey-light bg-pure-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-grey-light bg-grey-lightest text-left text-xs uppercase tracking-wide text-grey-dark">
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Invited by</th>
                <th className="px-3 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-grey-light">
                <td className="px-5 py-4">
                  <span className="font-medium text-black">{ownerEmail}</span>
                  {ownerEmail === currentEmail && <span className="ml-2 text-xs text-grey-dark">(you)</span>}
                </td>
                <td className="px-3 py-4"><Badge kind="owner" /></td>
                <td className="px-3 py-4 text-grey-dark">—</td>
                <td className="px-3 py-4 text-grey-dark">—</td>
                <td className="px-5 py-4 text-right text-xs text-grey-dark">Built-in</td>
              </tr>
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-grey-light last:border-0">
                  <td className="px-5 py-4">
                    <span className="font-medium text-black">{a.email}</span>
                    {a.email === currentEmail && <span className="ml-2 text-xs text-grey-dark">(you)</span>}
                  </td>
                  <td className="px-3 py-4"><Badge kind={a.status} /></td>
                  <td className="px-3 py-4 text-grey-dark">{a.invited_by ?? "—"}</td>
                  <td className="px-3 py-4 text-grey-dark">{formatDate(a.accepted_at)}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => revoke(a)}
                      className="rounded border border-grey-light px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      {a.status === "invited" ? "Cancel" : "Remove"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Badge({ kind }: { kind: "owner" | "invited" | "active" }) {
  const map = {
    owner: { label: "Owner", cls: "bg-black text-pure-white" },
    active: { label: "Active", cls: "bg-green/15 text-green" },
    invited: { label: "Invite pending", cls: "bg-amber-100 text-amber-700" },
  } as const;
  const { label, cls } = map[kind];
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span>;
}
