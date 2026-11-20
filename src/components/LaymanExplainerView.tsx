import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Gamepad2,
  Lightbulb,
  Play,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  calculateLaymanProgress,
  filterLaymanGuides,
  getExplanationByTone,
  LAYMAN_MODULE_GUIDES,
} from '../data/laymanExplanations';
import { runPythonCode } from '../engine/pythonRunner';
import type { CurriculumModule, LaymanTone, PythonExecutionResult } from '../types';

interface LaymanExplainerViewProps {
  understoodModuleIds: number[];
  onMarkUnderstood: (moduleId: number) => void;
  onGoToCurriculumModule: (moduleId: number) => void;
  onGoToMiniGames: () => void;
}

const CATEGORIES: ('Semua' | CurriculumModule['category'])[] = [
  'Semua',
  'Fondasi',
  'Alur Kontrol',
  'Modularisasi',
  'Struktur Data & Algoritma',
  'OOP & Kualitas Kode',
];

const SHORT_CATEGORY_LABELS: Record<'Semua' | CurriculumModule['category'], string> = {
  Semua: 'Semua',
  Fondasi: 'Fondasi',
  'Alur Kontrol': 'Alur Kontrol',
  Modularisasi: 'Modularisasi',
  'Struktur Data & Algoritma': 'Koleksi & Algo',
  'OOP & Kualitas Kode': 'OOP & Debug',
};

export function LaymanExplainerView({
  understoodModuleIds,
  onMarkUnderstood,
  onGoToCurriculumModule,
  onGoToMiniGames,
}: LaymanExplainerViewProps) {
  const [tone, setTone] = useState<LaymanTone>('bayi');
  const [selectedModuleId, setSelectedModuleId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | CurriculumModule['category']>('Semua');
  const [runResult, setRunResult] = useState<PythonExecutionResult | null>(null);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);

  const filteredGuides = useMemo(
    () => filterLaymanGuides(LAYMAN_MODULE_GUIDES, searchQuery, categoryFilter),
    [searchQuery, categoryFilter]
  );

  const activeGuide = useMemo(
    () =>
      LAYMAN_MODULE_GUIDES.find((g) => g.moduleId === selectedModuleId) ??
      LAYMAN_MODULE_GUIDES[0],
    [selectedModuleId]
  );

  const activeStory = getExplanationByTone(activeGuide, tone);
  const isUnderstood = understoodModuleIds.includes(activeGuide.moduleId);
  const progress = calculateLaymanProgress(understoodModuleIds, LAYMAN_MODULE_GUIDES.length);

  const handleSelectModule = (moduleId: number) => {
    setSelectedModuleId(moduleId);
    setRunResult(null);
    setSelectedQuizOption(null);
  };

  const handleRunSample = () => {
    const res = runPythonCode(activeGuide.sampleCode, activeGuide.sampleInputs ?? []);
    setRunResult(res);
  };

  const handleAnswerQuickCheck = (optionIndex: number) => {
    setSelectedQuizOption(optionIndex);
    if (optionIndex === activeGuide.quickCheck.correctIndex) {
      onMarkUnderstood(activeGuide.moduleId);
    }
  };

  const currentIndex = LAYMAN_MODULE_GUIDES.findIndex((g) => g.moduleId === activeGuide.moduleId);
  const prevGuide = currentIndex > 0 ? LAYMAN_MODULE_GUIDES[currentIndex - 1] : null;
  const nextGuide =
    currentIndex < LAYMAN_MODULE_GUIDES.length - 1
      ? LAYMAN_MODULE_GUIDES[currentIndex + 1]
      : null;

  return (
    <div className="space-y-8">
      {/* Page Header & Tone Switcher */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <p className="text-xs font-medium text-blue-700">
              Panduan Anti-Pusing · 13 Topik Python · Tanpa Istilah Rumit
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              Penjelasan Bahasa Bayi &amp; Orang Awam
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Baru pertama kali menyentuh koding? Pilih gaya bahasa paling santai di samping—setiap materi dijelaskan lewat cerita sehari-hari, terjemahan kode baris-per-baris, dan contoh yang bisa langsung kamu klik jalankan.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-3 shrink-0">
            <div className="text-xs text-slate-500 tabular-nums">
              Progres Paham Santai:{' '}
              <strong className="text-slate-900 font-semibold">
                {progress.understoodCount} / {progress.totalCount} Topik
              </strong>{' '}
              ({progress.percent}%)
            </div>

            {/* Interactive Tone Segmented Control */}
            <div
              role="group"
              aria-label="Pilih gaya bahasa penjelasan"
              className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200"
            >
              <button
                type="button"
                onClick={() => setTone('bayi')}
                aria-pressed={tone === 'bayi'}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  tone === 'bayi'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mode Bahasa Bayi
              </button>
              <button
                type="button"
                onClick={() => setTone('awam')}
                aria-pressed={tone === 'awam'}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  tone === 'awam'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mode Orang Awam
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Split: Topic Navigator + Friendly Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
        {/* Left Sidebar: Search, Category Filter & 13 Topics */}
        <aside className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 lg:sticky lg:top-20">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Pilih Topik (13 Modul)</h2>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {filteredGuides.length}/13
              </span>
            </div>

            {/* Search input */}
            <div className="relative">
              <label htmlFor="layman-search-input" className="sr-only">
                Cari topik atau istilah Python
              </label>
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="layman-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari istilah, mis. variabel, OOP..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const active = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {SHORT_CATEGORY_LABELS[cat]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic list */}
          {filteredGuides.length === 0 ? (
            <div className="py-8 text-center space-y-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Tidak ada topik yang cocok dengan kata “{searchQuery}”.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('Semua');
                }}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Reset pencarian
              </button>
            </div>
          ) : (
            <ul className="space-y-1 border-t border-slate-100 pt-3 max-h-[540px] overflow-y-auto pr-1">
              {filteredGuides.map((guide) => {
                const isSelected = guide.moduleId === activeGuide.moduleId;
                const done = understoodModuleIds.includes(guide.moduleId);
                return (
                  <li key={guide.moduleId}>
                    <button
                      type="button"
                      onClick={() => handleSelectModule(guide.moduleId)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-2.5 transition-colors ${
                        isSelected
                          ? 'bg-blue-50 text-blue-950 ring-1 ring-blue-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {done ? (
                        <CheckCircle2
                          className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                          aria-label="Sudah paham"
                        />
                      ) : (
                        <Circle
                          className="w-4 h-4 text-slate-300 shrink-0 mt-0.5"
                          aria-label="Belum ditandai paham"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">
                          {String(guide.moduleId).padStart(2, '0')}. {guide.moduleShortTitle}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {guide.analogyTitle}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Right Main Reader Area */}
        <article className="space-y-6 min-w-0">
          {/* 1. Core Story Card (Bahasa Bayi / Orang Awam) */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-blue-700">
                    Topik {String(activeGuide.moduleId).padStart(2, '0')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeGuide.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeGuide.analogyEmojiLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {tone === 'bayi' ? 'Gaya: Bahasa Bayi' : 'Gaya: Orang Awam'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {activeGuide.moduleShortTitle}: {activeGuide.analogyTitle}
                </h2>
                <p className="text-sm text-slate-600">{activeGuide.oneLineHook}</p>
              </div>

              <button
                type="button"
                onClick={() => onMarkUnderstood(activeGuide.moduleId)}
                disabled={isUnderstood}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  isUnderstood
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isUnderstood ? 'Sudah Paham' : 'Tandai Paham (+15 XP)'}
              </button>
            </div>

            {/* Active Tone Narrative */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">{activeStory.headline}</h3>
              <div className="space-y-3 text-[15px] text-slate-700 leading-relaxed max-w-[70ch]">
                {activeStory.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              {/* Golden Rule Takeaway Box (subtle all-around border, no thick left stripe) */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-amber-900">
                    Ingat Satu Kalimat Ini Saja
                  </p>
                  <p className="text-sm text-amber-950">{activeStory.rememberRule}</p>
                </div>
              </div>
            </div>

            {/* 3-Step Visual Mapping: Dunia Nyata -> Python */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-slate-900">
                Peta Sederhana: Dari Dunia Nyata ke Python
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {activeGuide.visualSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-blue-700">{step.stepLabel}</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{step.realLife}</p>
                    </div>
                    <div className="pt-2.5 border-t border-slate-200">
                      <p className="text-[11px] text-slate-400 mb-1">Bentuk di Python:</p>
                      <code className="block text-xs font-mono font-semibold text-slate-900 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 overflow-x-auto">
                        {step.inPython}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 2. Side-by-Side Human Code Translator + Live Mini Runner */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Kalau Kode Python Dibaca Seperti Kalimat Biasa
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap baris kode diterjemahkan ke bahasa manusia agar tidak ada yang terasa asing.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunSample}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  Jalankan Contoh Ini
                </button>
                {runResult && (
                  <button
                    type="button"
                    onClick={() => setRunResult(null)}
                    aria-label="Bersihkan hasil eksekusi"
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
              {activeGuide.codeTranslations.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-2 bg-white"
                >
                  <div className="px-4 py-3 bg-slate-950 text-sky-200 font-mono text-xs overflow-x-auto flex items-center">
                    <code>{row.code}</code>
                  </div>
                  <div className="px-4 py-3 text-xs sm:text-sm text-slate-700 flex items-center">
                    {row.humanMeaning}
                  </div>
                </div>
              ))}
            </div>

            {/* Live Friendly Execution Result */}
            {runResult && (
              <div
                data-testid="layman-run-output"
                className={`rounded-xl p-4 border space-y-1.5 ${
                  runResult.success
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <p
                  className={`text-xs font-bold ${
                    runResult.success ? 'text-emerald-900' : 'text-red-900'
                  }`}
                >
                  {runResult.success
                    ? 'Jawaban Komputer Saat Contoh Dijalankan:'
                    : 'Terjadi Kesalahan:'}
                </p>
                <pre className="text-xs font-mono text-slate-900 bg-white/90 border border-slate-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                  {runResult.success
                    ? runResult.output.join('\n')
                    : runResult.errorMessage}
                </pre>
              </div>
            )}
          </section>

          {/* 3. Mini Glossary ("Kamus Anti-Pusing") + Quick Check */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Kamus Istilah Anti-Pusing */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Kamus Istilah Anti-Pusing
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Arti kata-kata teknis di topik ini dalam satu kalimat santai.
                </p>
              </div>

              <dl className="divide-y divide-slate-100">
                {activeGuide.glossary.map((item) => (
                  <div key={item.term} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <dt className="text-xs font-bold font-mono text-blue-800">{item.term}</dt>
                    <dd className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.plainMeaning}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Cek Paham Santai */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Cek Paham Santai (1 Pertanyaan)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Jawab benar untuk otomatis menandai topik ini paham dan meraih +15 XP.
                  </p>
                </div>

                <p className="text-sm font-medium text-slate-900 leading-relaxed">
                  {activeGuide.quickCheck.question}
                </p>

                <div className="space-y-2">
                  {activeGuide.quickCheck.options.map((opt, idx) => {
                    const isPicked = selectedQuizOption === idx;
                    const isCorrect = idx === activeGuide.quickCheck.correctIndex;
                    let btnStyle =
                      'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';
                    if (selectedQuizOption !== null) {
                      if (isPicked && isCorrect) {
                        btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold';
                      } else if (isPicked && !isCorrect) {
                        btnStyle = 'bg-red-50 border-red-300 text-red-950';
                      } else if (isCorrect) {
                        btnStyle = 'bg-emerald-50/50 border-emerald-200 text-emerald-900';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAnswerQuickCheck(idx)}
                        className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border transition-colors ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {selectedQuizOption !== null && (
                  <div
                    role="status"
                    className={`rounded-xl p-3.5 text-xs leading-relaxed border ${
                      selectedQuizOption === activeGuide.quickCheck.correctIndex
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    {selectedQuizOption === activeGuide.quickCheck.correctIndex
                      ? activeGuide.quickCheck.feedback
                      : 'Belum tepat, yuk coba pilih jawaban lainnya! Baca lagi aturan emas di atas ya.'}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* 4. Bottom Navigation & Bridge to Full Curriculum / Mini-Games */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onGoToCurriculumModule(activeGuide.moduleId)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-4 h-4" />
                Buka Modul {String(activeGuide.moduleId).padStart(2, '0')} di Kurikulum
              </button>
              <button
                type="button"
                onClick={onGoToMiniGames}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Gamepad2 className="w-4 h-4" />
                Latihan di Mini-Game
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!prevGuide}
                onClick={() => prevGuide && handleSelectModule(prevGuide.moduleId)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={!nextGuide}
                onClick={() => nextGuide && handleSelectModule(nextGuide.moduleId)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0"
              >
                Selanjutnya
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
