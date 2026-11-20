import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Clock, FileCheck2 } from 'lucide-react';
import { ASSESSMENT_QUESTIONS } from '../data/assessments';
import { CURRICULUM_MODULES } from '../data/curriculum';
import { gradeAssessment } from '../engine/gamification';
import type { AssessmentAttempt, AssessmentMode, AssessmentQuestion } from '../types';

interface AssessmentViewProps {
  preselectedModuleId?: number | null;
  onClearPreselected?: () => void;
  onFinishAttempt: (attempt: AssessmentAttempt) => void;
}

export function AssessmentView({
  preselectedModuleId,
  onClearPreselected,
  onFinishAttempt,
}: AssessmentViewProps) {
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>(() =>
    preselectedModuleId ? [preselectedModuleId] : [1, 2, 3]
  );
  const [activeExam, setActiveExam] = useState<{
    mode: AssessmentMode;
    title: string;
    questions: AssessmentQuestion[];
    startedAtMs: number;
  } | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [elapsedSec, setElapsedSec] = useState(0);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedModuleId) {
      setSelectedModuleIds([preselectedModuleId]);
    }
  }, [preselectedModuleId]);

  useEffect(() => {
    if (!activeExam) return;
    const timer = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - activeExam.startedAtMs) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeExam]);

  const startExam = (mode: AssessmentMode) => {
    setValidationMsg(null);
    let questions: AssessmentQuestion[] = [];
    let title = '';

    if (mode === 'cepat') {
      // 6 calibrated questions spanning across core foundations & structures
      const picks = [1, 2, 3, 4, 5, 8];
      questions = picks
        .map((mId) => ASSESSMENT_QUESTIONS.find((q) => q.moduleId === mId))
        .filter((q): q is AssessmentQuestion => Boolean(q));
      title = 'Asesmen Cepat (6 Soal Inti)';
    } else if (mode === 'modul') {
      if (selectedModuleIds.length === 0) {
        setValidationMsg('Pilih minimal 1 modul terlebih dahulu untuk memulai asesmen fokus bab.');
        return;
      }
      questions = ASSESSMENT_QUESTIONS.filter((q) => selectedModuleIds.includes(q.moduleId));
      const labels = selectedModuleIds
        .slice()
        .sort((a, b) => a - b)
        .map((id) => `M${id}`)
        .join(', ');
      title = `Asesmen Fokus Modul (${labels})`;
    } else {
      // 13 comprehensive questions: 1 from every single module 1..13
      questions = CURRICULUM_MODULES.map(
        (m) => ASSESSMENT_QUESTIONS.find((q) => q.moduleId === m.id)!
      ).filter(Boolean);
      title = 'Ujian Komprehensif 13 Modul';
    }

    setAnswers({});
    setCurrentIdx(0);
    setElapsedSec(0);
    setActiveExam({
      mode,
      title,
      questions,
      startedAtMs: Date.now(),
    });
    onClearPreselected?.();
  };

  const toggleModulePick = (id: number) => {
    setValidationMsg(null);
    setSelectedModuleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmitExam = (forceSubmit = false) => {
    if (!activeExam) return;
    const unansweredCount = activeExam.questions.filter((q) => answers[q.id] === undefined).length;
    if (unansweredCount > 0 && !forceSubmit) {
      setValidationMsg(
        `Masih ada ${unansweredCount} soal yang belum dijawab. Lengkapi seluruh soal atau klik "Kumpulkan Sekarang" untuk tetap mengakhiri.`
      );
      return;
    }

    const attempt = gradeAssessment({
      id: `att-${Date.now()}`,
      mode: activeExam.mode,
      title: activeExam.title,
      questions: activeExam.questions,
      selectedIndices: answers,
      durationSeconds: Math.max(1, Math.floor((Date.now() - activeExam.startedAtMs) / 1000)),
      completedAt: new Date().toISOString(),
    });

    setActiveExam(null);
    setValidationMsg(null);
    onFinishAttempt(attempt);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Active Exam Screen
  if (activeExam) {
    const q = activeExam.questions[currentIdx];
    const mod = CURRICULUM_MODULES.find((m) => m.id === q.moduleId);
    const answeredCount = Object.keys(answers).length;
    const isLast = currentIdx === activeExam.questions.length - 1;

    return (
      <section className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">{activeExam.title}</p>
            <h1 className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">
              Soal {currentIdx + 1} dari {activeExam.questions.length}
            </h1>
          </div>

          <div className="flex items-center gap-5 text-sm tabular-nums">
            <span className="text-slate-600">
              Terjawab: <strong className="text-slate-900">{answeredCount}/{activeExam.questions.length}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-slate-800 font-semibold">
              <Clock className="w-4 h-4 text-blue-700" />
              {formatTimer(elapsedSec)}
            </span>
            <button
              type="button"
              onClick={() => setActiveExam(null)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 whitespace-nowrap"
            >
              Batalkan
            </button>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="flex flex-wrap gap-1.5" role="navigation" aria-label="Nomor soal asesmen">
          {activeExam.questions.map((item, idx) => {
            const isAnswered = answers[item.id] !== undefined;
            const isCurrent = idx === currentIdx;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentIdx(idx)}
                aria-label={`Soal nomor ${idx + 1}${isAnswered ? ', sudah dijawab' : ''}`}
                className={`w-9 h-9 rounded-lg text-xs font-semibold tabular-nums border transition-colors ${
                  isCurrent
                    ? 'bg-blue-700 border-blue-700 text-white'
                    : isAnswered
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500">
              Modul {String(q.moduleId).padStart(2, '0')}: {mod?.shortTitle} · Tingkat {q.difficulty}
            </p>
            <h2 className="text-lg font-semibold text-slate-900 leading-relaxed">
              {q.prompt}
            </h2>
          </div>

          {q.code && (
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-sm leading-6 overflow-x-auto">
              {q.code}
            </pre>
          )}

          <div className="space-y-3" role="radiogroup" aria-label="Pilihan jawaban">
            {q.options.map((opt, oIdx) => {
              const chosen = answers[q.id] === oIdx;
              const letter = String.fromCharCode(65 + oIdx);
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  onClick={() => {
                    setAnswers((prev) => ({ ...prev, [q.id]: oIdx }));
                    setValidationMsg(null);
                  }}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm flex items-start gap-3 transition-colors ${
                    chosen
                      ? 'bg-blue-50 border-blue-600 text-blue-950 font-medium'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-slate-400'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                      chosen ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="leading-relaxed">{opt}</span>
                </button>
              );
            })}
          </div>

          {validationMsg && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{validationMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => handleSubmitExam(true)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-amber-700 text-white rounded-lg hover:bg-amber-800 whitespace-nowrap"
              >
                Kumpulkan Sekarang
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              Sebelumnya
            </button>

            {!isLast ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => Math.min(activeExam.questions.length - 1, i + 1))}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap"
              >
                Soal Berikutnya
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmitExam(false)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg whitespace-nowrap"
              >
                <FileCheck2 className="w-4 h-4" />
                Kumpulkan &amp; Lihat Hasil
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Assessment Lobby
  return (
    <section className="space-y-8">
      <div className="space-y-1.5 pb-6 border-b border-slate-200 max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Pusat Asesmen Dasar Pemrograman
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Evaluasi pemahaman sintaks, penelusuran kode (code tracing), struktur data, OOP, dan debugging. Nilai langsung tercatat ke Hasil Asesmen dan Rekap Pembelajaran.
        </p>
      </div>

      {/* 3 Assessment Mode Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mode 1: Kuis Cepat */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-6">
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-blue-700">6 Soal · ~5 Menit · +120 XP</p>
            <h2 className="text-lg font-bold text-slate-900">Asesmen Cepat Inti</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Evaluasi ringkas mencakup algoritma, tipe data, operator, percabangan, perulangan, dan list/tuple. Cocok untuk pemanasan harian.
            </p>
          </div>
          <button
            type="button"
            onClick={() => startExam('cepat')}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
          >
            Mulai Asesmen Cepat
          </button>
        </div>

        {/* Mode 2: Ujian Komprehensif 13 Modul */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-6">
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-emerald-700">13 Soal · ~15 Menit · +260 XP</p>
            <h2 className="text-lg font-bold text-slate-900">Ujian Komprehensif 13 Modul</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Mewakili seluruh 13 materi mata kuliah Dasar Pemrograman dari Modul 01 hingga Modul 13 untuk memetakan penguasaan akhir mahasiswa.
            </p>
          </div>
          <button
            type="button"
            onClick={() => startExam('komprehensif')}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            Mulai Ujian 13 Modul
          </button>
        </div>

        {/* Mode 3: Fokus Modul Pilihan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-5">
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-slate-600">
              {selectedModuleIds.length * 2} Soal Terpilih · Kustom
            </p>
            <h2 className="text-lg font-bold text-slate-900">Asesmen Fokus Modul</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Pilih modul spesifik di bawah untuk melatih topik tertentu sebelum ujian tengah atau akhir semester.
            </p>
          </div>
          <button
            type="button"
            onClick={() => startExam('modul')}
            className="w-full py-2.5 px-4 text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            Mulai Fokus ({selectedModuleIds.length} Modul)
          </button>
        </div>
      </div>

      {/* Module Selector Grid for Focused Mode */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pilih Modul untuk Asesmen Fokus
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap modul menyediakan 2 soal analisis kode &amp; konsep.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setSelectedModuleIds(CURRICULUM_MODULES.map((m) => m.id))}
              className="font-semibold text-blue-700 hover:text-blue-800"
            >
              Pilih Semua
            </button>
            <button
              type="button"
              onClick={() => setSelectedModuleIds([])}
              className="font-medium text-slate-500 hover:text-slate-800"
            >
              Kosongkan
            </button>
          </div>
        </div>

        {validationMsg && (
          <p role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
            {validationMsg}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {CURRICULUM_MODULES.map((mod) => {
            const checked = selectedModuleIds.includes(mod.id);
            return (
              <button
                key={mod.id}
                type="button"
                aria-pressed={checked}
                onClick={() => toggleModulePick(mod.id)}
                className={`text-left px-3.5 py-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-colors ${
                  checked
                    ? 'bg-blue-50 border-blue-500 text-blue-950 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    checked ? 'text-blue-700' : 'text-slate-300'
                  }`}
                />
                <span className="truncate">
                  {String(mod.id).padStart(2, '0')}. {mod.shortTitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
