import { useEffect, useState } from 'react';
import { CheckCircle2, HelpCircle, Play, RotateCcw, Terminal, AlertTriangle, Sparkles } from 'lucide-react';
import { runPythonCode } from '../engine/pythonRunner';
import type { LabChallenge, PythonExecutionResult } from '../types';

interface PythonLabProps {
  moduleId: number;
  starterCode: string;
  defaultInputs?: string[];
  challenge: LabChallenge;
  isLabCompleted: boolean;
  onCompleteChallenge: () => void;
}

export function PythonLab({
  moduleId,
  starterCode,
  defaultInputs = [],
  challenge,
  isLabCompleted,
  onCompleteChallenge,
}: PythonLabProps) {
  const [mode, setMode] = useState<'sandbox' | 'challenge'>('sandbox');
  const [code, setCode] = useState(starterCode);
  const [mockInputText, setMockInputText] = useState(defaultInputs.join('\n'));
  const [result, setResult] = useState<PythonExecutionResult | null>(null);
  const [challengeStatus, setChallengeStatus] = useState<{
    passed: boolean;
    feedback: string;
  } | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setMode('sandbox');
    setCode(starterCode);
    setMockInputText((defaultInputs ?? []).join('\n'));
    setResult(null);
    setChallengeStatus(null);
    setShowHint(false);
  }, [moduleId, starterCode]);

  const switchMode = (nextMode: 'sandbox' | 'challenge') => {
    setMode(nextMode);
    setResult(null);
    setChallengeStatus(null);
    setShowHint(false);
    if (nextMode === 'sandbox') {
      setCode(starterCode);
      setMockInputText((defaultInputs ?? []).join('\n'));
    } else {
      setCode(challenge.starterCode);
      setMockInputText((challenge.mockInputs ?? []).join('\n'));
    }
  };

  const execute = () => {
    const inputs = mockInputText
      .split('\n')
      .map((s) => s.trim())
      .filter((s, idx, arr) => s.length > 0 || idx < arr.length - 1);
    const res = runPythonCode(code, inputs);
    setResult(res);
    return res;
  };

  const handleRun = () => {
    setChallengeStatus(null);
    execute();
  };

  const handleVerifyChallenge = () => {
    const res = execute();
    if (!res.success) {
      setChallengeStatus({
        passed: false,
        feedback: `Kode masih menghasilkan ${res.errorType}: ${res.errorMessage}`,
      });
      return;
    }

    const joinedOutput = res.output.join('\n');
    const missingOutput = (challenge.expectedOutputIncludes ?? []).find(
      (expected) => !joinedOutput.includes(expected)
    );
    if (missingOutput) {
      setChallengeStatus({
        passed: false,
        feedback: `Output program belum memuat nilai yang diharapkan ("${missingOutput}"). Cek kembali perhitungan dan perintah print().`,
      });
      return;
    }

    if (challenge.expectedVariables) {
      for (const [varName, expectedVal] of Object.entries(challenge.expectedVariables)) {
        const found = res.variables.find((v) => v.name === varName);
        if (!found) {
          setChallengeStatus({
            passed: false,
            feedback: `Variabel '${varName}' belum ditemukan di memori program.`,
          });
          return;
        }
        const expectedRepr =
          typeof expectedVal === 'boolean'
            ? expectedVal
              ? 'True'
              : 'False'
            : String(expectedVal);
        const matchesNum =
          typeof expectedVal === 'number' && Number(found.value) === expectedVal;
        if (found.value !== expectedRepr && !matchesNum) {
          setChallengeStatus({
            passed: false,
            feedback: `Nilai variabel '${varName}' adalah ${found.value}, seharusnya ${expectedRepr}.`,
          });
          return;
        }
      }
    }

    setChallengeStatus({
      passed: true,
      feedback: 'Tantangan Lab lulus! Output dan nilai variabel sesuai spesifikasi.',
    });
    onCompleteChallenge();
  };

  const lineCount = Math.max(8, code.split('\n').length);

  return (
    <div className="space-y-6">
      {/* Mode switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => switchMode('sandbox')}
            className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              mode === 'sandbox'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Eksplorasi Bebas
          </button>
          <button
            type="button"
            onClick={() => switchMode('challenge')}
            className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              mode === 'challenge'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tantangan Lab {isLabCompleted ? '(Lulus)' : ''}
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>Interpreter Python Lokal</span>
          <span aria-hidden="true">·</span>
          <span>Inspektor Memori Langsung</span>
        </div>
      </div>

      {/* Challenge Brief */}
      {mode === 'challenge' && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 sm:p-5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">{challenge.title}</h3>
            {isLabCompleted && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Tantangan Selesai (+60 XP)
              </span>
            )}
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{challenge.instruction}</p>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button
              type="button"
              onClick={() => setShowHint((h) => !h)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {showHint ? 'Sembunyikan Petunjuk' : 'Lihat Petunjuk'}
            </button>
            <button
              type="button"
              onClick={() => setCode(challenge.solutionCode)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 whitespace-nowrap"
            >
              Muat Contoh Solusi
            </button>
          </div>
          {showHint && (
            <p className="text-xs text-slate-700 bg-white border border-blue-100 rounded-lg px-3.5 py-2.5">
              Petunjuk: {challenge.hint}
            </p>
          )}
          {challengeStatus && (
            <div
              role="status"
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                challengeStatus.passed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {challengeStatus.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {challengeStatus.passed ? 'Verifikasi Berhasil' : 'Belum Sesuai Spesifikasi'}
                </p>
                <p className="mt-0.5 leading-relaxed">{challengeStatus.feedback}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Two-zone Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Code Editor */}
        <div className="lg:col-span-7 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
            <label htmlFor={`py-editor-${moduleId}`} className="text-xs font-semibold text-slate-700 font-mono">
              main.py
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCode(mode === 'sandbox' ? starterCode : challenge.starterCode);
                  setResult(null);
                  setChallengeStatus(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleRun}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5" />
                Jalankan Kode
              </button>
              {mode === 'challenge' && (
                <button
                  type="button"
                  onClick={handleVerifyChallenge}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Periksa Solusi
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-1 bg-slate-950 text-slate-100 font-mono text-sm min-h-[260px]">
            <div
              aria-hidden="true"
              className="select-none py-4 px-3 text-right text-slate-500 bg-slate-900/80 border-r border-slate-800 leading-6 tabular-nums"
            >
              {Array.from({ length: lineCount }, (_, idx) => (
                <div key={idx}>{idx + 1}</div>
              ))}
            </div>
            <textarea
              id={`py-editor-${moduleId}`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 p-4 bg-transparent text-slate-100 focus:outline-none resize-none leading-6 font-mono tracking-normal"
              rows={Math.min(18, lineCount + 1)}
            />
          </div>

          {(code.includes('input(') || mockInputText.length > 0) && (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 space-y-1.5">
              <label
                htmlFor={`py-stdin-${moduleId}`}
                className="block text-xs font-medium text-slate-700"
              >
                Simulasi Masukan input() — pisahkan tiap input dengan baris baru
              </label>
              <textarea
                id={`py-stdin-${moduleId}`}
                value={mockInputText}
                onChange={(e) => setMockInputText(e.target.value)}
                rows={2}
                placeholder="Contoh:&#10;Rina&#10;85"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}
        </div>

        {/* Right: Output Console + Variable Inspector */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Output panel */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                Output Konsol
              </span>
              {result && (
                <span className="text-xs text-slate-500 tabular-nums">
                  {result.success ? 'Sukses' : 'Gagal'} · {result.executionMs} ms
                </span>
              )}
            </div>

            <div
              data-testid="python-console-output"
              className="p-4 font-mono text-sm flex-1 min-h-[120px] bg-white"
            >
              {!result ? (
                <p className="text-slate-400 text-xs font-sans">
                  Tekan &ldquo;Jalankan Kode&rdquo; untuk melihat keluaran print() dan isi memori variabel secara langsung.
                </p>
              ) : (
                <div className="space-y-2">
                  {result.output.length > 0 ? (
                    <pre className="whitespace-pre-wrap text-slate-900 leading-relaxed">
                      {result.output.join('\n')}
                    </pre>
                  ) : result.success ? (
                    <p className="text-slate-400 text-xs font-sans">
                      Program selesai tanpa output print().
                    </p>
                  ) : null}

                  {!result.success && (
                    <div
                      role="alert"
                      className="mt-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs space-y-1 font-sans"
                    >
                      <div className="flex items-center gap-1.5 font-semibold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                          {result.errorType}
                          {result.errorLine ? ` (Baris ${result.errorLine})` : ''}
                        </span>
                      </div>
                      <p>{result.errorMessage}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Live Variable Memory Inspector */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Inspektor Memori Variabel
              </span>
              <span className="text-xs text-slate-500 tabular-nums">
                {result ? `${result.variables.length} simbol` : '0 simbol'}
              </span>
            </div>

            {!result || result.variables.length === 0 ? (
              <div className="p-4 text-xs text-slate-400">
                Variabel yang didefinisikan saat eksekusi akan muncul beserta tipe datanya di sini.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-48">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500">
                      <th className="py-2 px-4 font-medium">Nama</th>
                      <th className="py-2 px-3 font-medium">Nilai</th>
                      <th className="py-2 px-4 font-medium">Tipe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {result.variables.map((v) => (
                      <tr key={v.name}>
                        <td className="py-2 px-4 font-medium text-slate-900">{v.name}</td>
                        <td className="py-2 px-3 text-slate-700 break-all">{v.value}</td>
                        <td className="py-2 px-4 text-blue-700">{v.pyType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
