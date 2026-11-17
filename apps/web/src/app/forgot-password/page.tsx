"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Response is intentionally identical whether the email exists or not.
    await fetch("/api/v1/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      credentials: "include",
    }).catch(() => {});
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <main className="min-h-screen grid place-items-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--brand)] text-2xl font-bold text-white">
            S
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Reset password</h1>
          <p className="text-sm text-slate-500">We will send a reset link if the account exists.</p>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <p className="font-semibold text-emerald-800">Check your inbox</p>
            <p className="mt-1 text-sm text-emerald-700">
              If an account exists for <b>{email}</b>, a reset link is on its way (valid 30
              minutes).
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm font-medium text-[var(--brand)] hover:underline"
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@greenwood.local"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-[var(--brand)] px-4 py-2.5 font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <Link
              href="/login"
              className="mt-4 block text-center text-sm font-medium text-[var(--brand)] hover:underline"
            >
              ← Back to sign in
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
