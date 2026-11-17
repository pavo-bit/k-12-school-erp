"use client";

import { useEffect, useState } from "react";
import { Download, FileText, GraduationCap } from "lucide-react";

interface Term {
  id: string;
  name: string;
}
interface Exam {
  id: string;
  termId: string;
  name: string;
  type: string;
  status: string;
}
interface StudentOption {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
}
interface ReportCardRow {
  id: string;
  examId: string;
  studentId: string;
  status: string;
  createdAt: string;
}

export default function ExamsPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [cards, setCards] = useState<ReportCardRow[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function loadStudents() {
    const res = await fetch("/api/v1/students?school=greenwood", { credentials: "include" });
    const body = await res.json().catch(() => ({ data: [] }));
    setStudents(Array.isArray(body?.data) ? body.data : []);
  }

  useEffect(() => {
    (async () => {
      const termsRes = await fetch("/api/v1/exams/terms?school=greenwood", {
        credentials: "include",
      });
      const termsBody = await termsRes.json().catch(() => ({ data: [] }));
      const termsList: Term[] = termsBody?.data ?? [];
      setTerms(termsList);
      loadStudents();
      if (termsList[0]) {
        setSelectedTermId(termsList[0].id);
        const examsRes = await fetch(`/api/v1/exams?school=greenwood&termId=${termsList[0].id}`, {
          credentials: "include",
        });
        const examsBody = await examsRes.json().catch(() => ({ data: [] }));
        const examsList: Exam[] = examsBody?.data ?? [];
        setExams(examsList);
        if (examsList[0]) setSelectedExamId(examsList[0].id);
      }
    })();
  }, []);

  async function loadExams(termId: string) {
    const res = await fetch(`/api/v1/exams?school=greenwood&termId=${termId}`, {
      credentials: "include",
    });
    const body = await res.json().catch(() => ({ data: [] }));
    const list: Exam[] = body?.data ?? [];
    setExams(list);
    setSelectedExamId(list[0]?.id ?? "");
  }

  async function loadCards() {
    const url = selectedExamId
      ? `/api/v1/exams/report-cards?school=greenwood&examId=${selectedExamId}`
      : "/api/v1/exams/report-cards?school=greenwood";
    const res = await fetch(url, { credentials: "include" });
    const body = await res.json().catch(() => ({ data: [] }));
    setCards(Array.isArray(body?.data) ? body.data : []);
  }

  useEffect(() => {
    loadCards();
  }, [selectedExamId]);

  async function generate() {
    if (!selectedExamId || !selectedStudentId) {
      setMessage("Select an exam and a student first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/v1/exams/report-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ examId: selectedExamId, studentId: selectedStudentId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Failed to generate report card.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "report-card.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage("Report card generated and downloaded.");
      loadCards();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to generate report card.");
    } finally {
      setBusy(false);
    }
  }

  const studentName = (id: string) => {
    const s = students.find((s) => s.id === id);
    return s ? `${s.firstName} ${s.lastName} (${s.admissionNumber})` : id;
  };

  return (
    <div className="p-8">
      <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
        <GraduationCap className="text-[var(--brand)]" size={28} />
        Exams &amp; Report Cards
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Term-wise exams and one-click report card generation for any student.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <FileText size={16} /> Generate report card
          </h2>

          <label className="mt-4 block text-sm font-medium text-slate-700">Term</label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={selectedTermId}
            onChange={(e) => {
              setSelectedTermId(e.target.value);
              loadExams(e.target.value);
            }}
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-medium text-slate-700">Exam</label>
          {exams.length === 0 ? (
            <p className="mt-1 text-sm text-slate-400">No exams in this term yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {exams.map((exam) => (
                <label
                  key={exam.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                    selectedExamId === exam.id
                      ? "border-[var(--brand)] bg-[var(--brand)]/5"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="exam"
                    checked={selectedExamId === exam.id}
                    onChange={() => setSelectedExamId(exam.id)}
                  />
                  <span>
                    <span className="font-medium text-slate-900">{exam.name}</span>
                    <span className="ml-2 text-xs uppercase text-slate-400">
                      {exam.type} · {exam.status}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}

          <label className="mt-4 block text-sm font-medium text-slate-700">Student</label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            <option value="">Select student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} — {s.admissionNumber}
              </option>
            ))}
          </select>

          <button
            onClick={generate}
            disabled={busy || exams.length === 0}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:opacity-60"
          >
            <Download size={18} />
            {busy ? "Generating…" : "Generate & download PDF"}
          </button>
          {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Generated report cards</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Generated</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-slate-400">
                    No report cards generated for this exam yet.
                  </td>
                </tr>
              ) : (
                cards.map((card) => (
                  <tr key={card.id} className="border-t border-slate-100">
                    <td className="px-5 py-3">{studentName(card.studentId)}</td>
                    <td className="px-5 py-3">
                      {new Date(card.createdAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
                    </td>
                    <td className="px-5 py-3 capitalize">{card.status}</td>
                    <td className="px-5 py-3 text-right">
                      <a
                        href={`/api/v1/exams/report-cards/${card.id}`}
                        download
                        className="inline-flex items-center gap-1 font-medium text-[var(--brand)] hover:underline"
                      >
                        <Download size={14} /> Download
                      </a>
                    </td>
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
