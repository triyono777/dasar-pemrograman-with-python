import { useState } from 'react';
import { Gamepad2, Play, Star } from 'lucide-react';
import { CURRICULUM_MODULES } from '../data/curriculum';
import { MINI_GAMES } from '../data/minigames';
import type { MiniGameEngineType, MiniGameRecord, MiniGameSpec } from '../types';
import { MiniGamePlayer } from './MiniGamePlayer';

interface MiniGameHubProps {
  records: Record<string, MiniGameRecord>;
  initialGameId?: string | null;
  onClearInitialGame?: () => void;
  onCompleteGame: (result: {
    gameId: string;
    moduleId: number;
    score: number;
    maxScore: number;
    stars: number;
    xpEarned: number;
  }) => void;
}

const ENGINE_LABELS: Record<MiniGameEngineType, string> = {
  char_move: 'Karakter Bergerak',
  char_action: 'Karakter + Tombol Aksi',
  sequencer: 'Susun Algoritma',
  classifier: 'Klasifikasi Cepat',
  branch_sim: 'Simulator Alur',
  function_forge: 'Pabrik Fungsi',
  collection_vault: 'Brankas Koleksi',
  algo_arena: 'Arena Algoritma',
  oop_debug_lab: 'Lab OOP & Debug',
};

export function MiniGameHub({
  records,
  initialGameId,
  onClearInitialGame,
  onCompleteGame,
}: MiniGameHubProps) {
  const [activeGame, setActiveGame] = useState<MiniGameSpec | null>(() =>
    initialGameId ? MINI_GAMES.find((g) => g.id === initialGameId) ?? null : null
  );
  const [filterEngine, setFilterEngine] = useState<'semua' | MiniGameEngineType>('semua');

  const totalStars = Object.values(records).reduce((s, r) => s + r.stars, 0);
  const maxPossibleStars = MINI_GAMES.length * 3;
  const completedCount = Object.values(records).filter((r) => r.stars > 0).length;

  const filteredGames =
    filterEngine === 'semua'
      ? [
          ...MINI_GAMES.filter((g) => g.engine === 'char_move' || g.engine === 'char_action'),
          ...MINI_GAMES.filter((g) => g.engine !== 'char_move' && g.engine !== 'char_action'),
        ]
      : MINI_GAMES.filter((g) => g.engine === filterEngine);

  if (activeGame) {
    return (
      <section className="max-w-4xl mx-auto">
        <MiniGamePlayer
          game={activeGame}
          onComplete={onCompleteGame}
          onExit={() => {
            setActiveGame(null);
            onClearInitialGame?.();
          }}
        />
      </section>
    );
  }

  return (
    <section className="space-y-8">
      {/* Header summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Arena Mini-Game Dasar Pemrograman
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {MINI_GAMES.length} permainan interaktif — termasuk mini-game karakter 2D yang dapat digerakkan, mini-game karakter dengan tombol aksi (Lompat, Dash, Saring, Tembak Patch, Perisai, Debug Pulse), hingga simulasi algoritma Python.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm tabular-nums shrink-0">
          <div>
            <p className="text-xs text-slate-500">Total Bintang</p>
            <p className="text-lg font-bold text-slate-900">
              {totalStars} / {maxPossibleStars}
            </p>
          </div>
          <div className="h-8 w-px bg-slate-200" aria-hidden="true" />
          <div>
            <p className="text-xs text-slate-500">Tantangan Tuntas</p>
            <p className="text-lg font-bold text-slate-900">
              {completedCount} / {MINI_GAMES.length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setFilterEngine('semua')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            filterEngine === 'semua'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua ({MINI_GAMES.length})
        </button>
        {(Object.keys(ENGINE_LABELS) as MiniGameEngineType[]).map((eng) => (
          <button
            key={eng}
            type="button"
            onClick={() => setFilterEngine(eng)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterEngine === eng
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {ENGINE_LABELS[eng]}
          </button>
        ))}
      </div>

      {/* Mini-game grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGames.map((game) => {
          const rec = records[game.id];
          const mod = CURRICULUM_MODULES.find((m) => m.id === game.moduleId);
          const stars = rec?.stars ?? 0;

          return (
            <article
              key={game.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-5 hover:border-blue-300 transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    Modul {String(game.moduleId).padStart(2, '0')} · {ENGINE_LABELS[game.engine]}
                  </span>
                  <span className="font-mono text-amber-700 font-medium tabular-nums">
                    +{game.xpReward} XP
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900 leading-snug">
                  {game.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {game.subtitle}
                </p>
                {mod && (
                  <p className="text-xs text-slate-400">
                    Topik: {mod.shortTitle}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1" aria-label={`${stars} dari 3 bintang`}>
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= stars ? 'text-amber-500 fill-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                  {rec && (
                    <span className="ml-1.5 text-xs text-slate-500 tabular-nums">
                      {rec.bestScore}/{rec.maxScore}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGame(game)}
                  aria-label={`Mainkan ${game.title}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  {rec ? <Gamepad2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {rec ? 'Main Lagi' : 'Mainkan'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
