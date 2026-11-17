"use client";

import { useEffect, useState } from "react";

interface Session {
  id: string;
  sectionId: string;
  date: string;
  sessionType: string;
  status: string;
}

export default function AttendancePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [form, setForm] = useState({
    sectionId: "",
    date: new Date().toISOString().slice(0, 10),
    sessionType: "daily",
  });
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/v1/attendance/sessions?school=greenwood", {
        credentials: "include",
      });
      const body = await res.json().catch(() => ({ data: [] }));
      setSessions(Array.isArray(body?.data) ? body.data : []);
    } catch {
      setSessions([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/v1/attendance/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...form, school: "greenwood" }),
    });
    if (res.ok) {
      setMessage("Attendance session created.");
      setForm({ sectionId: "", date: new Date().toISOString().slice(0, 10), sessionType: "daily" });
      load();
    } else {
      const body = await res.json().catch(() => null);
      setMessage(body?.error?.message ?? "Failed to create session.");
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
      <p className="mt-1 text-sm text-slate-500">Record daily attendance by section.</p>

      <form
        onSubmit={createSession}
        className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4"
      >
        <input
          required
          placeholder="Section ID"
          value={form.sectionId}
          onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Session type"
          value={form.sessionType}
          onChange={(e) => setForm({ ...form, sessionType: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
        >
          Create session
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  No sessions yet.
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{s.date}</td>
                  <td className="px-4 py-3">{s.sessionType}</td>
                  <td className="px-4 py-3 capitalize">{s.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
