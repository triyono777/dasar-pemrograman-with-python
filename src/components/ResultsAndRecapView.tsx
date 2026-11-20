import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Printer,
  Star,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { ASSESSMENT_QUESTIONS } from '../data/assessments';
import { CURRICULUM_MODULES } from '../data/curriculum';
import { buildModuleRecap, generateRecapCsv } from '../engine/gamification';
import type { AppProgressState } from '../types';

interface ResultsAndRecapViewProps {
  state: AppProgressState;
  initialSubView?: 'hasil' | 'rekap';
  onGoToModule: (moduleId: number) => void;
  onGoToAssessment: () => void;
}

export function ResultsAndRecapView({
  state,
  initialSubView = 'rekap',
  onGoToModule,
  onGoToAssessment,
}: ResultsAndRecapViewProps) {
  const [subView, setSubView] = useState<'hasil' | 'rekap'>(initialSubView);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string>(
    state.assessments[0]?.id ?? ''
  );
  const [exportSuccess, setExportSuccess] = useState(false);

  const activeAttempt =
    state.assessments.find((a) => a.id === selectedAttemptId) ?? state.assessments[0] ?? null;

  const recapRows = useMemo(
    () => buildModuleRecap(state, CURRICULUM_MODULES),
    [state]
  );

  const avgMastery = useMemo(() => {
    const sum = recapRows.reduce((acc, r) => acc + r.masteryPct, 0);
    return Math.round(sum / recapRows.length);
  }, [recapRows]);

  const completedCount = recapRows.filter((r) => r.statusLabel === 'Tuntas').length;
  const averageExamScore =
    state.assessments.length > 0
      ? Math.round(
          state.assessments.reduce((sum, a) => sum + a.score, 0) / state.assessments.length
        )
      : null;

  const weakModules = recapRows
    .filter((r) => r.masteryPct < 75)
    .sort((a, b) => a.masteryPct - b.masteryPct)
    .slice(0, 3);

  const handleDownloadCsv = () => {
    const csv = generateRecapCsv(
      state.profile.name,
      state.profile.nim,
      state.profile.kelas,
      recapRows
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-dasar-pemrograman-${state.profile.nim || 'mahasiswa'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    window.setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <section className="space-y-8">
      {/* Header & View Toggle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Hasil Asesmen &amp; Rekap Pembelajaran
          </h1>
          <p className="text-sm text-slate-600">
            {state.profile.name} · NIM {state.profile.nim} · Kelas {state.profile.kelas}
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit no-print">
          <button
            type="button"
            aria-pressed={subView === 'hasil'}
            onClick={() => setSubView('hasil')}
            className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap ${
              subView === 'hasil'
                ? 'bg-blue-700 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Hasil Asesmen ({state.assessments.length})
          </button>
          <button
            type="button"
            aria-pressed={subView === 'rekap'}
            onClick={() => setSubView('rekap')}
            className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap ${
              subView === 'rekap'
                ? 'bg-blue-700 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Rekap 13 Modul
          </button>
        </div>
      </div>

      {/* SUBVIEW 1: HASIL ASESMEN */}
      {subView === 'hasil' && (
        <div className="space-y-6">
          {!activeAttempt ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Belum Ada Riwayat Asesmen</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Kerjakan Asesmen Cepat, Fokus Modul, atau Ujian 13 Modul terlebih dahulu untuk melihat rincian nilai dan pembahasan soal di sini.
              </p>
              <button
                type="button"
                onClick={onGoToAssessment}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
              >
                Buka Halaman Asesmen
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* History List */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">Riwayat Sesi Asesmen</h2>
                  <button
                    type="button"
                    onClick={onGoToAssessment}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    + Asesmen Baru
                  </button>
                </div>
                <ul className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                  {state.assessments.map((att) => {
                    const isSelected = att.id === activeAttempt.id;
                    return (
                      <li key={att.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedAttemptId(att.id)}
                          className={`w-full text-left px-5 py-3.5 transition-colors flex items-center justify-between gap-3 ${
                            isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {att.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                              {new Date(att.completedAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}{' '}
                              · {att.correctCount}/{att.totalQuestions} benar
                            </p>
                          </div>
                          <div className="text-right tabular-nums shrink-0">
                            <p className="text-base font-bold text-slate-900">{att.score}</p>
                            <p className="text-xs font-semibold text-blue-700">
                              Nilai {att.grade}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Active Attempt Detailed Report */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Laporan Hasil Evaluasi</p>
                      <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                        {activeAttempt.title}
                      </h2>
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="text-3xl font-bold text-blue-700">{activeAttempt.score}</p>
                      <p className="text-xs font-semibold text-slate-600">
                        Predikat {activeAttempt.grade} · +{activeAttempt.xpEarned} XP
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 tabular-nums">
                    <div>
                      <p className="text-xs text-slate-500">Jawaban Benar</p>
                      <p className="text-lg font-bold text-emerald-700 mt-0.5">
                        {activeAttempt.correctCount} / {activeAttempt.totalQuestions}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Durasi Pengerjaan</p>
                      <p className="text-lg font-bold text-slate-900 mt-0.5">
                        {Math.floor(activeAttempt.durationSeconds / 60)}m{' '}
                        {activeAttempt.durationSeconds % 60}d
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Status Kelulusan</p>
                      <p
                        className={`text-lg font-bold mt-0.5 ${
                          activeAttempt.score >= 70 ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {activeAttempt.score >= 70 ? 'Lulus' : 'Perlu Penguatan'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Question-by-question Review */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                  <h3 className="text-base font-bold text-slate-900">
                    Pembahasan Per Soal
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {activeAttempt.answers.map((ans, idx) => {
                      const q = ASSESSMENT_QUESTIONS.find((item) => item.id === ans.questionId);
                      if (!q) return null;
                      const mod = CURRICULUM_MODULES.find((m) => m.id === q.moduleId);
                      return (
                        <div key={ans.questionId} className="py-5 first:pt-0 last:pb-0 space-y-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">
                              {idx + 1}. {q.prompt}
                            </p>
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold shrink-0 ${
                                ans.isCorrect ? 'text-emerald-700' : 'text-red-700'
                              }`}
                            >
                              {ans.isCorrect ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4" /> Benar
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4" /> Salah
                                </>
                              )}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500">
                            Modul {String(q.moduleId).padStart(2, '0')}: {mod?.shortTitle}
                          </p>

                          {q.code && (
                            <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto">
                              {q.code}
                            </pre>
                          )}

                          <div className="text-xs space-y-1">
                            <p className="text-slate-700">
                              Jawaban kamu:{' '}
                              <strong className={ans.isCorrect ? 'text-emerald-700' : 'text-red-700'}>
                                {ans.selectedIndex >= 0
                                  ? q.options[ans.selectedIndex]
                                  : '(Tidak dijawab)'}
                              </strong>
                            </p>
                            {!ans.isCorrect && (
                              <p className="text-slate-700">
                                Kunci jawaban:{' '}
                                <strong className="text-emerald-700">
                                  {q.options[q.correctIndex]}
                                </strong>
                              </p>
                            )}
                            <p className="text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mt-1.5">
                              {q.explanation}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBVIEW 2: REKAP PEMBELAJARAN 13 MODUL */}
      {subView === 'rekap' && (
        <div className="space-y-6">
          {/* Summary KPI row + Export actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 tabular-nums">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs text-slate-500">Indeks Penguasaan</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{avgMastery}%</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs text-slate-500">Modul Tuntas</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  {completedCount} / 13
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs text-slate-500">Rata-rata Asesmen</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {averageExamScore !== null ? averageExamScore : '-'}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs text-slate-500">Total XP &amp; Lencana</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {state.profile.xp} XP
                </p>
              </div>
            </div>
          </div>

          {/* Export Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 no-print">
            <p className="text-xs text-slate-600">
              Transkrip kemajuan belajar seluruh 13 topik mata kuliah Dasar Pemrograman.
            </p>
            <div className="flex items-center gap-2.5">
              {exportSuccess && (
                <span className="text-xs font-medium text-emerald-700">
                  CSV berhasil diunduh
                </span>
              )}
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Rekap CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Transkrip
              </button>
            </div>
          </div>

          {/* Full 13-Module Mastery Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs text-slate-500">
                    <th className="py-3.5 px-4 font-semibold">Modul</th>
                    <th className="py-3.5 px-3 font-semibold text-center">Konsep</th>
                    <th className="py-3.5 px-3 font-semibold text-center">Lab Kode</th>
                    <th className="py-3.5 px-3 font-semibold text-center">Cek</th>
                    <th className="py-3.5 px-3 font-semibold text-center">Mini-Game</th>
                    <th className="py-3.5 px-3 font-semibold text-right">Asesmen</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Penguasaan</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {recapRows.map((row) => (
                    <tr key={row.moduleId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => onGoToModule(row.moduleId)}
                          className="text-left group"
                        >
                          <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {String(row.moduleId).padStart(2, '0')}. {row.title}
                          </p>
                          <p className="text-xs text-slate-500">{row.category}</p>
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-center text-xs">
                        {row.readCompleted ? 'Selesai' : 'Belum'}
                      </td>
                      <td className="py-3.5 px-3 text-center text-xs">
                        {row.labCompleted ? 'Lulus' : 'Belum'}
                      </td>
                      <td className="py-3.5 px-3 text-center text-xs">
                        {row.checkpointPassed ? 'Lulus' : 'Belum'}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-0.5 justify-center">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= row.miniGameStars
                                  ? 'text-amber-500 fill-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-xs text-slate-700">
                        {row.assessmentAccuracyPct !== null ? `${row.assessmentAccuracyPct}%` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                        {row.masteryPct}%
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold">
                        <span
                          className={
                            row.statusLabel === 'Tuntas'
                              ? 'text-emerald-700'
                              : row.statusLabel === 'Sedang Dipelajari'
                                ? 'text-blue-700'
                                : 'text-slate-400'
                          }
                        >
                          {row.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          {weakModules.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 no-print">
              <h2 className="text-base font-bold text-slate-900">
                Rekomendasi Prioritas Belajar Berikutnya
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {weakModules.map((wm) => (
                  <div
                    key={wm.moduleId}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs text-slate-500 tabular-nums">
                        Modul {String(wm.moduleId).padStart(2, '0')} · Penguasaan {wm.masteryPct}%
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{wm.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onGoToModule(wm.moduleId)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
                    >
                      Pelajari Modul Ini
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
