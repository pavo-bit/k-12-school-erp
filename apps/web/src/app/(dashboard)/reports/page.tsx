"use client";

import { useEffect, useState } from "react";

interface AttendanceSummary {
  id: string;
  sectionId: string;
  date: string;
  presentCount: number;
  absentCount: number;
  totalCount: number;
}

interface FeeSummary {
  id: string;
  date: string;
  collectedPaise: number;
  outstandingPaise: number;
  invoiceCount: number;
}

function rupees(paise: number) {
  return "₹" + (paise / 100).toFixed(2);
}

export default function ReportsPage() {
  const [attendance, setAttendance] = useState<AttendanceSummary[]>([]);
  const [fees, setFees] = useState<FeeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/reports/summaries?school=greenwood&type=all", {
          credentials: "include",
        });
        const body = await res.json().catch(() => ({ data: {} }));
        setAttendance(body?.data?.attendance ?? []);
        setFees(body?.data?.fees ?? []);
      } catch {
        setAttendance([]);
        setFees([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
      <p className="mt-1 text-sm text-slate-500">Attendance and fee summary reports.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="font-semibold text-slate-900">Attendance Summary</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Present</th>
                <th className="px-4 py-3">Absent</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No summaries yet. Compute via the API.
                  </td>
                </tr>
              ) : (
                attendance.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{s.date}</td>
                    <td className="px-4 py-3">{s.presentCount}</td>
                    <td className="px-4 py-3">{s.absentCount}</td>
                    <td className="px-4 py-3">{s.totalCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="font-semibold text-slate-900">Fee Collection Summary</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Collected</th>
                <th className="px-4 py-3">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : fees.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    No summaries yet.
                  </td>
                </tr>
              ) : (
                fees.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{s.date}</td>
                    <td className="px-4 py-3">{rupees(s.collectedPaise)}</td>
                    <td className="px-4 py-3">{rupees(s.outstandingPaise)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
