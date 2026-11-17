"use client";

import { useEffect, useState } from "react";

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  status: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    admissionNumber: "",
    firstName: "",
    lastName: "",
    gender: "female",
    dateOfBirth: "2014-06-01",
  });
  const [message, setMessage] = useState("");
  const [csvText, setCsvText] = useState("");
  const [importResult, setImportResult] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/students?school=greenwood", { credentials: "include" });
      const body = await res.json().catch(() => ({ data: [] }));
      setStudents(Array.isArray(body?.data) ? body.data : []);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/v1/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...form, school: "greenwood" }),
    });
    if (res.ok) {
      setMessage("Student added.");
      setForm({
        admissionNumber: "",
        firstName: "",
        lastName: "",
        gender: "female",
        dateOfBirth: "2014-06-01",
      });
      load();
    } else {
      const body = await res.json().catch(() => null);
      setMessage(body?.error?.message ?? "Failed to add student.");
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="mt-1 text-sm text-slate-500">Manage student records.</p>
        </div>
      </div>

      <form
        onSubmit={onAdd}
        className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5"
      >
        <input
          required
          placeholder="Admission No"
          value={form.admissionNumber}
          onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="First name"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="Last name"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
        >
          Add
        </button>
      </form>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Bulk import (CSV)</h2>
        <p className="mt-1 text-xs text-slate-500">
          Columns: admission_number,first_name,last_name,date_of_birth,gender. Date as YYYY-MM-DD.
        </p>
        <textarea
          rows={4}
          placeholder={
            "admission_number,first_name,last_name,date_of_birth,gender\nSTU001,Aarav,Sharma,2014-06-01,male"
          }
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={async () => {
              const res = await fetch("/api/v1/students/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ csv: csvText, dryRun: true }),
              });
              const body = await res.json().catch(() => null);
              setImportResult(
                body?.data ? JSON.stringify(body.data) : (body?.error?.message ?? "Import failed"),
              );
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Validate
          </button>
          <button
            type="button"
            onClick={async () => {
              const res = await fetch("/api/v1/students/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ csv: csvText, dryRun: false }),
              });
              const body = await res.json().catch(() => null);
              setImportResult(
                body?.data ? JSON.stringify(body.data) : (body?.error?.message ?? "Import failed"),
              );
              load();
            }}
            className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
          >
            Import
          </button>
          <a
            href="/api/v1/students/export?school=greenwood"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </a>
        </div>
        {importResult && (
          <pre className="mt-2 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
            {importResult}
          </pre>
        )}
      </div>

      {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Admission</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No students yet.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono">{s.admissionNumber}</td>
                  <td className="px-4 py-3">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="px-4 py-3 capitalize">{s.gender}</td>
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
