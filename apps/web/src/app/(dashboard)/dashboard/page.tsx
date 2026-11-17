"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stat {
  label: string;
  value: string;
  href?: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stat[]>([
    { label: "Students", value: "…", href: "/students" },
    { label: "Classes", value: "…" },
    { label: "Attendance today", value: "…", href: "/attendance" },
    { label: "Outstanding fees", value: "…", href: "/fees" },
  ]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const studentsRes = await fetch("/api/v1/students?school=greenwood", {
          credentials: "include",
        });
        const students = await studentsRes.json().catch(() => ({ data: [] }));
        const count = Array.isArray(students?.data) ? students.data.length : 0;
        setStats((prev) =>
          prev.map((s) => (s.label === "Students" ? { ...s, value: String(count) } : s)),
        );
      } catch {
        // keep placeholder
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Overview of your school at a glance.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{s.value}</div>
            {s.href && loaded && (
              <Link
                href={s.href}
                className="mt-3 inline-block text-xs font-medium text-[var(--brand)] hover:underline"
              >
                View →
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Getting started</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Set up classes and sections in the academics module.</li>
          <li>Add students and guardians under Students.</li>
          <li>Mark daily attendance; parents receive alerts.</li>
          <li>Generate fee invoices and record payments; receipts are issued automatically.</li>
        </ul>
      </div>
    </div>
  );
}
