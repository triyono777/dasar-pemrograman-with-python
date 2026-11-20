import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  RotateCcw,
  Star,
  XCircle,
  ArrowLeftRight,
} from 'lucide-react';
import { calculateStars } from '../engine/gamification';
import type { MiniGameSpec } from '../types';
import { CharacterArcadeGame } from './CharacterArcadeGame';

interface MiniGamePlayerProps {
  game: MiniGameSpec;
  onComplete: (result: {
    gameId: string;
    moduleId: number;
    score: number;
    maxScore: number;
    stars: number;
    xpEarned: number;
  }) => void;
  onExit: () => void;
}

function deterministicShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed + 17;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  // Ensure it's not accidentally identical to sorted order if length > 1
  if (copy.length > 1 && copy.every((val, idx) => val === arr[idx])) {
    [copy[0], copy[1]] = [copy[1], copy[0]];
  }
  return copy;
}

export function MiniGamePlayer({ game, onComplete, onExit }: MiniGamePlayerProps) {
  const [finished, setFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalMaxScore, setFinalMaxScore] = useState(1);
  const [earnedXp, setEarnedXp] = useState(0);
  const [playNonce, setPlayNonce] = useState(0);

  useEffect(() => {
    setFinished(false);
    setFinalScore(0);
    setFinalMaxScore(1);
    setEarnedXp(0);
  }, [game.id, playNonce]);

  const finishGame = (score: number, maxScore: number) => {
    const stars = calculateStars(score, maxScore);
    const ratio = maxScore > 0 ? score / maxScore : 0;
    const xp = Math.max(25, Math.round(game.xpReward * ratio));
    setFinalScore(score);
    setFinalMaxScore(maxScore);
    setEarnedXp(xp);
    setFinished(true);
    onComplete({
      gameId: game.id,
      moduleId: game.moduleId,
      score,
      maxScore,
      stars,
      xpEarned: xp,
    });
  };

  if (finished) {
    const stars = calculateStars(finalScore, finalMaxScore);
    const pct = finalMaxScore > 0 ? Math.round((finalScore / finalMaxScore) * 100) : 0;

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 max-w-2xl mx-auto text-center space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium text-blue-700">
            Mini-Game Selesai · Modul {game.moduleId}
          </p>
          <h2 className="text-2xl font-bold text-slate-900">{game.title}</h2>
        </div>

        <div className="flex items-center justify-center gap-2" aria-label={`Perolehan ${stars} dari 3 bintang`}>
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`w-10 h-10 ${
                s <= stars ? 'text-amber-500 fill-amber-400' : 'text-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 border-y border-slate-100 py-5 tabular-nums">
          <div>
            <p className="text-xs text-slate-500">Skor Benar</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {finalScore}/{finalMaxScore}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Akurasi</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{pct}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">XP Diperoleh</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">+{earnedXp} XP</p>
          </div>
        </div>

        <p className="text-sm text-slate-600">
          {stars === 3
            ? 'Sangat presisi! Penguasaan materi modul ini sudah sangat matang.'
            : stars === 2
              ? 'Bagus! Ulangi sekali lagi untuk meraih 3 bintang penuh.'
              : 'Terus berlatih! Pelajari kembali konsep di modul lalu coba tantangannya lagi.'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPlayNonce((n) => n + 1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            Main Lagi
          </button>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
          >
            Selesai &amp; Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <p className="text-xs text-slate-500">
            Modul {game.moduleId} · Estimasi {game.estimatedMinutes} menit · Hadiah hingga +{game.xpReward} XP
          </p>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">{game.title}</h2>
          <p className="text-sm text-slate-600 mt-0.5">{game.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Keluar Permainan
        </button>
      </div>

      {game.engine === 'sequencer' && game.sequencerRounds && (
        <SequencerEngine key={playNonce} rounds={game.sequencerRounds} onFinish={finishGame} />
      )}
      {game.engine === 'classifier' && game.classifierItems && game.classifierCategories && (
        <ClassifierEngine
          key={playNonce}
          categories={game.classifierCategories}
          items={game.classifierItems}
          onFinish={finishGame}
        />
      )}
      {game.engine === 'branch_sim' && game.branchScenarios && (
        <BranchSimEngine key={playNonce} scenarios={game.branchScenarios} onFinish={finishGame} />
      )}
      {game.engine === 'function_forge' && game.functionRounds && (
        <FunctionForgeEngine key={playNonce} rounds={game.functionRounds} onFinish={finishGame} />
      )}
      {game.engine === 'collection_vault' && game.collectionRounds && (
        <CollectionVaultEngine key={playNonce} rounds={game.collectionRounds} onFinish={finishGame} />
      )}
      {game.engine === 'algo_arena' && game.algoStages && (
        <AlgoArenaEngine key={playNonce} stages={game.algoStages} onFinish={finishGame} />
      )}
      {game.engine === 'oop_debug_lab' && game.oopDebugRounds && (
        <OopDebugEngine key={playNonce} rounds={game.oopDebugRounds} onFinish={finishGame} />
      )}
      {(game.engine === 'char_move' || game.engine === 'char_action') && game.arcadeVariant && (
        <CharacterArcadeGame
          key={`${game.id}-${playNonce}`}
          variant={game.arcadeVariant}
          title={game.title}
          onFinish={finishGame}
        />
      )}
    </div>
  );
}

/* ==================== ENGINE 1: SEQUENCER ==================== */
function SequencerEngine({
  rounds,
  onFinish,
}: {
  rounds: NonNullable<MiniGameSpec['sequencerRounds']>;
  onFinish: (score: number, max: number) => void;
}) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const current = rounds[roundIdx];

  const [order, setOrder] = useState<string[]>(() =>
    deterministicShuffle(current.correctSteps, roundIdx)
  );
  const [checked, setChecked] = useState<boolean | null>(null);

  useEffect(() => {
    setOrder(deterministicShuffle(rounds[roundIdx].correctSteps, roundIdx));
    setChecked(null);
  }, [roundIdx, rounds]);

  const moveItem = (idx: number, dir: -1 | 1) => {
    if (checked !== null) return;
    const target = idx + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
  };

  const handleCheck = () => {
    const isCorrect = order.every((step, i) => step === current.correctSteps[i]);
    setChecked(isCorrect);
    if (isCorrect) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (roundIdx + 1 < rounds.length) {
      setRoundIdx((i) => i + 1);
    } else {
      onFinish(score, rounds.length);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
        <span>Ronde {roundIdx + 1} dari {rounds.length}</span>
        <span>Skor sementara: {score}</span>
      </div>

      <p className="text-base font-semibold text-slate-900">{current.prompt}</p>

      <ol className="space-y-2.5">
        {order.map((step, idx) => {
          const isMatch = checked !== null && step === current.correctSteps[idx];
          const isWrong = checked !== null && step !== current.correctSteps[idx];
          return (
            <li
              key={`${roundIdx}-${step}`}
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors ${
                isMatch
                  ? 'bg-emerald-50 border-emerald-300'
                  : isWrong
                    ? 'bg-red-50 border-red-300'
                    : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-semibold text-slate-500 tabular-nums w-6">
                  {idx + 1}.
                </span>
                <code className="text-sm font-mono text-slate-900 whitespace-pre overflow-x-auto">
                  {step}
                </code>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={checked !== null || idx === 0}
                  onClick={() => moveItem(idx, -1)}
                  aria-label={`Pindahkan baris ${idx + 1} ke atas`}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-35"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={checked !== null || idx === order.length - 1}
                  onClick={() => moveItem(idx, 1)}
                  aria-label={`Pindahkan baris ${idx + 1} ke bawah`}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-35"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {checked !== null && (
        <div
          className={`p-4 rounded-xl border text-sm space-y-1.5 ${
            checked
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <p className="font-semibold flex items-center gap-2">
            {checked ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {checked ? 'Urutan Tepat!' : 'Urutan Belum Sesuai'}
          </p>
          <p className="text-xs leading-relaxed">{current.explanation}</p>
          {!checked && (
            <div className="pt-2">
              <p className="text-xs font-semibold mb-1">Urutan yang benar:</p>
              <pre className="text-xs font-mono bg-white/80 p-2.5 rounded-lg border border-red-200">
                {current.correctSteps.join('\n')}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        {checked === null ? (
          <button
            type="button"
            onClick={handleCheck}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
          >
            Periksa Urutan
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            {roundIdx + 1 < rounds.length ? 'Ronde Berikutnya' : 'Lihat Hasil'}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ==================== ENGINE 2: CLASSIFIER ==================== */
function ClassifierEngine({
  categories,
  items,
  onFinish,
}: {
  categories: string[];
  items: NonNullable<MiniGameSpec['classifierItems']>;
  onFinish: (score: number, max: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const current = items[idx];

  const handlePick = (cat: string) => {
    if (picked !== null) return;
    setPicked(cat);
    if (cat === current.correctCategory) {
      setScore((s) => s + 1);
      setCombo((c) => c + 1);
    } else {
      setCombo(0);
    }
  };

  const handleNext = () => {
    if (idx + 1 < items.length) {
      setIdx((i) => i + 1);
      setPicked(null);
    } else {
      onFinish(score, items.length);
    }
  };

  const isCorrect = picked === current.correctCategory;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
        <span>Kartu {idx + 1} dari {items.length}</span>
        <span>Benar: {score} · Kombo Beruntun: {combo}x</span>
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-700 transition-all duration-200"
          style={{ width: `${((idx + (picked ? 1 : 0)) / items.length) * 100}%` }}
        />
      </div>

      <div className="py-8 px-6 bg-slate-950 rounded-xl text-center space-y-2">
        {current.promptHint && (
          <p className="text-xs text-slate-400">{current.promptHint}</p>
        )}
        <code className="text-2xl sm:text-3xl font-mono font-semibold text-white">
          {current.expression}
        </code>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categories.map((cat) => {
          let btnClass = 'bg-white border-slate-200 text-slate-800 hover:border-blue-500 hover:bg-blue-50/40';
          if (picked !== null) {
            if (cat === current.correctCategory) {
              btnClass = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold';
            } else if (cat === picked) {
              btnClass = 'bg-red-50 border-red-400 text-red-900';
            } else {
              btnClass = 'bg-slate-50 border-slate-200 text-slate-400';
            }
          }
          return (
            <button
              key={cat}
              type="button"
              disabled={picked !== null}
              onClick={() => handlePick(cat)}
              className={`px-4 py-3.5 text-sm font-mono font-medium rounded-xl border transition-colors ${btnClass}`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-start gap-2.5 text-sm">
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-slate-900">
                {isCorrect ? 'Benar!' : `Jawaban tepat: ${current.correctCategory}`}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">{current.explanation}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap"
          >
            {idx + 1 < items.length ? 'Kartu Berikutnya' : 'Lihat Hasil'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ==================== ENGINE 3: BRANCH SIMULATOR ==================== */
function BranchSimEngine({
  scenarios,
  onFinish,
}: {
  scenarios: NonNullable<MiniGameSpec['branchScenarios']>;
  onFinish: (score: number, max: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const current = scenarios[idx];

  const handleSelect = (branchIdx: number) => {
    if (selected !== null) return;
    setSelected(branchIdx);
    if (branchIdx === current.correctBranchIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (idx + 1 < scenarios.length) {
      setIdx((i) => i + 1);
      setSelected(null);
    } else {
      onFinish(score, scenarios.length);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-6 bg-slate-950 text-slate-100 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Skenario {idx + 1} dari {scenarios.length}</span>
          <span className="font-mono text-amber-300">
            Input: {current.inputLabel} = {current.inputValue}
          </span>
        </div>
        <pre className="font-mono text-sm leading-6 overflow-x-auto text-slate-100">
          {current.code}
        </pre>
      </div>

      <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">
            Dengan nilai input <code className="font-mono text-blue-700">{current.inputValue}</code>, cabang mana yang akan dieksekusi?
          </p>

          <div className="space-y-2.5">
            {current.branches.map((branch, bIdx) => {
              let cls = 'bg-white border-slate-200 hover:border-blue-500 text-slate-800';
              if (selected !== null) {
                if (bIdx === current.correctBranchIndex) {
                  cls = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold';
                } else if (bIdx === selected) {
                  cls = 'bg-red-50 border-red-400 text-red-900';
                } else {
                  cls = 'bg-slate-50 border-slate-200 text-slate-400';
                }
              }
              return (
                <button
                  key={branch}
                  type="button"
                  disabled={selected !== null}
                  onClick={() => handleSelect(bIdx)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${cls}`}
                >
                  {branch}
                </button>
              );
            })}
          </div>
        </div>

        {selected !== null && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-slate-900">
                Hasil: <code className="font-mono text-emerald-700">{current.expectedOutput}</code>
              </p>
              <p>{current.explanation}</p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
              >
                {idx + 1 < scenarios.length ? 'Skenario Berikutnya' : 'Lihat Hasil'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== ENGINE 4: FUNCTION FORGE ==================== */
function FunctionForgeEngine({
  rounds,
  onFinish,
}: {
  rounds: NonNullable<MiniGameSpec['functionRounds']>;
  onFinish: (score: number, max: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const current = rounds[idx];
  const [choices, setChoices] = useState<string[]>(() => current.slots.map(() => ''));
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    setChoices(rounds[idx].slots.map(() => ''));
    setVerified(null);
  }, [idx, rounds]);

  const renderedCode = useMemo(() => {
    let text = current.codeTemplate;
    current.slots.forEach((_, sIdx) => {
      const placeholder = `[SLOT_${sIdx + 1}]`;
      text = text.replace(placeholder, choices[sIdx] || `___SLOT_${sIdx + 1}___`);
    });
    return text;
  }, [current, choices]);

  const handleVerify = () => {
    const ok = current.slots.every((s, sIdx) => choices[sIdx] === s.correct);
    setVerified(ok);
    if (ok) setScore((sc) => sc + 1);
  };

  const handleNext = () => {
    if (idx + 1 < rounds.length) setIdx((i) => i + 1);
    else onFinish(score, rounds.length);
  };

  const allSelected = choices.every((c) => c.length > 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
        <span>Rakit Fungsi {idx + 1} dari {rounds.length}</span>
        <span>Target uji: <code className="font-mono text-slate-800">{current.sampleCall} -&gt; {current.expectedResult}</code></span>
      </div>

      <p className="text-base font-semibold text-slate-900">{current.prompt}</p>

      <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-sm leading-6 overflow-x-auto">
        {renderedCode}
      </pre>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {current.slots.map((slot, sIdx) => (
          <div key={slot.label} className="space-y-2">
            <p className="text-xs font-semibold text-slate-700">{slot.label}</p>
            <div className="flex flex-col gap-2">
              {slot.options.map((opt) => {
                const isSelected = choices[sIdx] === opt;
                let style = isSelected
                  ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400';
                if (verified !== null) {
                  if (opt === slot.correct) style = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold';
                  else if (isSelected) style = 'bg-red-50 border-red-400 text-red-900';
                }
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={verified !== null}
                    onClick={() => {
                      const next = [...choices];
                      next[sIdx] = opt;
                      setChoices(next);
                    }}
                    className={`text-left px-3.5 py-2.5 rounded-lg border font-mono text-xs transition-colors ${style}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {verified !== null && (
        <div
          className={`p-4 rounded-xl border text-xs space-y-1 ${
            verified ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <p className="font-semibold text-sm">
            {verified ? 'Fungsi Terakit Sempurna!' : 'Kombinasi Slot Belum Tepat'}
          </p>
          <p>{current.explanation}</p>
        </div>
      )}

      <div className="flex justify-end">
        {verified === null ? (
          <button
            type="button"
            disabled={!allSelected}
            onClick={handleVerify}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-40 rounded-lg"
          >
            Uji Fungsi
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
          >
            {idx + 1 < rounds.length ? 'Ronde Berikutnya' : 'Lihat Hasil'}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ==================== ENGINE 5: COLLECTION VAULT ==================== */
function CollectionVaultEngine({
  rounds,
  onFinish,
}: {
  rounds: NonNullable<MiniGameSpec['collectionRounds']>;
  onFinish: (score: number, max: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const current = rounds[idx];

  const handlePick = (optIdx: number) => {
    if (selected !== null) return;
    setSelected(optIdx);
    if (optIdx === current.correctIndex) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (idx + 1 < rounds.length) {
      setIdx((i) => i + 1);
      setSelected(null);
    } else {
      onFinish(score, rounds.length);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 tabular-nums">
        <span>Tantangan {idx + 1} dari {rounds.length} · Struktur: {current.collectionType}</span>
        <span>Skor: {score}</span>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">{current.prompt}</h3>
        <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-700">
          Memori Awal: {current.initialVisual}
        </div>
        <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-sm leading-6 overflow-x-auto">
          {current.codeSnippet}
        </pre>
      </div>

      <p className="text-sm font-medium text-slate-800">{current.question}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {current.options.map((opt, oIdx) => {
          let cls = 'bg-white border-slate-200 text-slate-800 hover:border-blue-500';
          if (selected !== null) {
            if (oIdx === current.correctIndex) cls = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold';
            else if (oIdx === selected) cls = 'bg-red-50 border-red-400 text-red-900';
            else cls = 'bg-slate-50 border-slate-200 text-slate-400';
          }
          return (
            <button
              key={opt}
              type="button"
              disabled={selected !== null}
              onClick={() => handlePick(oIdx)}
              className={`text-left px-4 py-3 rounded-xl border text-sm font-mono transition-colors ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-700 flex-1">{current.explanation}</p>
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap"
          >
            {idx + 1 < rounds.length ? 'Tantangan Berikutnya' : 'Lihat Hasil'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ==================== ENGINE 6: ALGO ARENA (BUBBLE SORT + BINARY SEARCH) ==================== */
function AlgoArenaEngine({
  stages,
  onFinish,
}: {
  stages: NonNullable<MiniGameSpec['algoStages']>;
  onFinish: (score: number, max: number) => void;
}) {
  const [stageIdx, setStageIdx] = useState(0);
  const [correctDecisions, setCorrectDecisions] = useState(0);
  const [totalDecisions, setTotalDecisions] = useState(0);
  const stage = stages[stageIdx];

  // Bubble sort state
  const [arr, setArr] = useState<number[]>(() => [...stage.initialArray]);
  const [pass, setPass] = useState(0);
  const [cursor, setCursor] = useState(0);

  // Binary search state
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(stage.initialArray.length - 1);

  const [feedback, setFeedback] = useState<string>('');
  const [stageComplete, setStageComplete] = useState(false);

  useEffect(() => {
    const s = stages[stageIdx];
    setArr([...s.initialArray]);
    setPass(0);
    setCursor(0);
    setLow(0);
    setHigh(s.initialArray.length - 1);
    setFeedback('');
    setStageComplete(false);
  }, [stageIdx, stages]);

  const handleBubbleAction = (shouldSwap: boolean) => {
    if (stageComplete) return;
    const needsSwap = arr[cursor] > arr[cursor + 1];
    const isRight = shouldSwap === needsSwap;
    setTotalDecisions((t) => t + 1);
    if (isRight) setCorrectDecisions((c) => c + 1);

    const nextArr = [...arr];
    if (needsSwap) {
      [nextArr[cursor], nextArr[cursor + 1]] = [nextArr[cursor + 1], nextArr[cursor]];
    }
    setArr(nextArr);
    setFeedback(
      isRight
        ? needsSwap
          ? `Tepat! ${arr[cursor]} > ${arr[cursor + 1]} sehingga ditukar.`
          : `Tepat! ${arr[cursor]} <= ${arr[cursor + 1]} sudah berurutan.`
        : needsSwap
          ? `Kurang tepat — ${arr[cursor]} > ${arr[cursor + 1]} seharusnya ditukar (otomatis dikoreksi).`
          : `Kurang tepat — ${arr[cursor]} <= ${arr[cursor + 1]} tidak perlu ditukar.`
    );

    const limit = nextArr.length - pass - 2;
    if (cursor < limit) {
      setCursor(cursor + 1);
    } else {
      const nextPass = pass + 1;
      // Check if sorted or finished passes
      const isSorted = nextArr.every((val, i) => i === 0 || nextArr[i - 1] <= val);
      if (isSorted || nextPass >= nextArr.length - 1) {
        setStageComplete(true);
      } else {
        setPass(nextPass);
        setCursor(0);
      }
    }
  };

  const handleBinaryClick = (clickedIdx: number) => {
    if (stageComplete || stage.target === undefined) return;
    const mid = Math.floor((low + high) / 2);
    setTotalDecisions((t) => t + 1);

    if (clickedIdx !== mid) {
      setFeedback(
        `Indeks tengah pada rentang [${low}..${high}] adalah indeks ${mid} (nilai ${arr[mid]}), bukan indeks ${clickedIdx}.`
      );
      return;
    }

    setCorrectDecisions((c) => c + 1);
    const val = arr[mid];
    if (val === stage.target) {
      setFeedback(`Target ${stage.target} ditemukan tepat di indeks ${mid}!`);
      setStageComplete(true);
    } else if (val < stage.target) {
      setFeedback(`arr[${mid}] = ${val} < ${stage.target}. Geser batas kiri ke ${mid + 1}.`);
      setLow(mid + 1);
    } else {
      setFeedback(`arr[${mid}] = ${val} > ${stage.target}. Geser batas kanan ke ${mid - 1}.`);
      setHigh(mid - 1);
    }
  };

  const handleNextStage = () => {
    if (stageIdx + 1 < stages.length) {
      setStageIdx((s) => s + 1);
    } else {
      onFinish(correctDecisions, Math.max(1, totalDecisions));
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 tabular-nums">
        <span>{stage.title} ({stageIdx + 1}/{stages.length})</span>
        <span>Keputusan Tepat: {correctDecisions}/{totalDecisions}</span>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed">{stage.description}</p>

      {/* Interactive Array Stage */}
      {stage.mode === 'bubble_sort' ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-center gap-3 py-6 bg-slate-50 rounded-xl border border-slate-200 px-4">
            {arr.map((val, i) => {
              const isActivePair = !stageComplete && (i === cursor || i === cursor + 1);
              const isLocked = stageComplete || i >= arr.length - pass;
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-14 sm:w-16 rounded-t-lg flex items-end justify-center pb-2 font-mono font-bold text-sm transition-colors ${
                      isLocked
                        ? 'bg-emerald-600 text-white'
                        : isActivePair
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-200 text-slate-800'
                    }`}
                    style={{ height: `${Math.max(48, val * 3.5)}px` }}
                  >
                    {val}
                  </div>
                  <span className="text-xs font-mono text-slate-500">[{i}]</span>
                </div>
              );
            })}
          </div>

          {!stageComplete && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleBubbleAction(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Tukar ({arr[cursor]} &amp; {arr[cursor + 1]})
              </button>
              <button
                type="button"
                onClick={() => handleBubbleAction(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
              >
                Lewati (Sudah Urut)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-mono text-slate-600 flex flex-wrap gap-4 justify-center">
            <span>Target: <strong className="text-blue-700">{stage.target}</strong></span>
            <span>kiri = {low}</span>
            <span>kanan = {high}</span>
            <span>Rumus: mid = (kiri + kanan) // 2</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 py-6 px-4 bg-slate-50 rounded-xl border border-slate-200">
            {arr.map((val, i) => {
              const inRange = i >= low && i <= high;
              const isFound = stageComplete && val === stage.target;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!inRange || stageComplete}
                  onClick={() => handleBinaryClick(i)}
                  className={`w-14 h-16 rounded-xl border font-mono flex flex-col items-center justify-center transition-colors ${
                    isFound
                      ? 'bg-emerald-600 border-emerald-700 text-white'
                      : inRange
                        ? 'bg-white border-slate-300 text-slate-900 hover:border-blue-600 hover:bg-blue-50'
                        : 'bg-slate-100 border-slate-200 text-slate-300'
                  }`}
                >
                  <span className="text-base font-bold">{val}</span>
                  <span className="text-[11px] opacity-75">idx {i}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {feedback && (
        <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-center">
          {feedback}
        </p>
      )}

      {stageComplete && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleNextStage}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
          >
            {stageIdx + 1 < stages.length ? 'Lanjut ke Tahap 2 (Binary Search)' : 'Selesaikan Arena'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ==================== ENGINE 7: OOP & DEBUG LAB ==================== */
function OopDebugEngine({
  rounds,
  onFinish,
}: {
  rounds: NonNullable<MiniGameSpec['oopDebugRounds']>;
  onFinish: (score: number, max: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const current = rounds[idx];

  const handlePick = (oIdx: number) => {
    if (selected !== null) return;
    setSelected(oIdx);
    if (oIdx === current.correctIndex) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (idx + 1 < rounds.length) {
      setIdx((i) => i + 1);
      setSelected(null);
    } else {
      onFinish(score, rounds.length);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
        <span>Kasus {idx + 1} dari {rounds.length}</span>
        <span>Terpecahkan: {score}</span>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">{current.title}</h3>
        <p className="text-sm text-slate-600">{current.scenario}</p>
      </div>

      <div className="rounded-xl bg-slate-950 p-4 font-mono text-sm overflow-x-auto space-y-0.5">
        {current.codeLines.map((line, lIdx) => {
          const isBugLine = current.bugLineIndex === lIdx;
          return (
            <div
              key={lIdx}
              className={`flex items-start gap-4 px-2 py-0.5 rounded ${
                isBugLine ? 'bg-amber-500/15 text-amber-200' : 'text-slate-100'
              }`}
            >
              <span className="text-slate-500 select-none w-5 text-right tabular-nums">
                {lIdx + 1}
              </span>
              <span className="whitespace-pre">{line}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-2.5">
        {current.options.map((opt, oIdx) => {
          let cls = 'bg-white border-slate-200 text-slate-800 hover:border-blue-500';
          if (selected !== null) {
            if (oIdx === current.correctIndex) cls = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold';
            else if (oIdx === selected) cls = 'bg-red-50 border-red-400 text-red-900';
            else cls = 'bg-slate-50 border-slate-200 text-slate-400';
          }
          return (
            <button
              key={opt}
              type="button"
              disabled={selected !== null}
              onClick={() => handlePick(oIdx)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-700 flex-1 leading-relaxed">{current.explanation}</p>
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap"
          >
            {idx + 1 < rounds.length ? 'Kasus Berikutnya' : 'Lihat Hasil'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
