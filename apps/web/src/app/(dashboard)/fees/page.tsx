"use client";

import { useEffect, useState } from "react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  totalPaise: number;
  paidPaise: number;
  status: string;
  dueDate?: string;
}

function rupees(paise: number) {
  return "₹" + (paise / 100).toFixed(2);
}

export default function FeesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/fees/invoices?school=greenwood", { credentials: "include" });
      const body = await res.json().catch(() => ({ data: [] }));
      setInvoices(Array.isArray(body?.data) ? body.data : []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Fees</h1>
      <p className="mt-1 text-sm text-slate-500">Invoices and collections.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Paid</th>
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
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No invoices yet. Generate one via the API.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">{rupees(inv.totalPaise)}</td>
                  <td className="px-4 py-3">{rupees(inv.paidPaise)}</td>
                  <td className="px-4 py-3 capitalize">{inv.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
