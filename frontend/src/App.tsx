import { useCallback, useEffect, useMemo, useState } from "react";
import { createGame, makeAiMove, makeHumanMove } from "./api/games";
import { ConnectFourBoard } from "./components/ConnectFourBoard";
import { GameSidebar } from "./components/GameSidebar";
import { gameCatalog } from "./games/connect4/registry";
import type { AiMetadata, AiStrategy, GameMode, GameState } from "./games/connect4/types";
import { modeLabel, winnerText } from "./lib/gameCopy";

type SpectatorSpeed = "slow" | "normal" | "fast";

interface MatchStats {
  totalGames: number;
  playerWins: Record<"1" | "2", number>;
  draws: number;
  humanWinsVsAi: number;
  aiWinsVsHuman: number;
  recentResults: string[];
}

const defaultStats: MatchStats = {
  totalGames: 0,
  playerWins: { "1": 0, "2": 0 },
  draws: 0,
  humanWinsVsAi: 0,
  aiWinsVsHuman: 0,
  recentResults: [],
};

const speedDelay: Record<SpectatorSpeed, number> = {
  slow: 1100,
  normal: 550,
  fast: 180,
};

function loadStats(): MatchStats {
  try {
    const value = window.localStorage.getItem("boardarena:connect4-stats");
    return value ? { ...defaultStats, ...JSON.parse(value) } : defaultStats;
  } catch {
    return defaultStats;
  }
}

function describeResult(game: GameState): string {
  if (game.winner === 0) return `${modeLabel(game.mode)}: draw in ${game.history.length} turns`;
  return `${modeLabel(game.mode)}: ${game.winner === 1 ? "Red" : "Yellow"} won in ${game.history.length} turns`;
}

function applyFinishedGame(stats: MatchStats, game: GameState): MatchStats {
  const next: MatchStats = {
    ...stats,
    totalGames: stats.totalGames + 1,
    playerWins: { ...stats.playerWins },
    recentResults: [describeResult(game), ...stats.recentResults].slice(0, 5),
  };

  if (game.winner === 0) {
    next.draws += 1;
  } else if (game.winner === 1 || game.winner === 2) {
    next.playerWins[String(game.winner) as "1" | "2"] += 1;
    if (game.mode === "pvai") {
      if (game.player_types[String(game.winner)] === "human") {
        next.humanWinsVsAi += 1;
      } else {
        next.aiWinsVsHuman += 1;
      }
    }
  }

  return next;
}

export function App() {
  const [mode, setMode] = useState<GameMode>("pvai");
  const [difficulty, setDifficulty] = useState<AiStrategy>("medium");
  const [game, setGame] = useState<GameState | null>(null);
  const [aiMessage, setAiMessage] = useState("Start a game and AI explanations will appear here.");
  const [aiMetadata, setAiMetadata] = useState<AiMetadata | null>(null);
  const [spectatorPaused, setSpectatorPaused] = useState(false);
  const [spectatorSpeed, setSpectatorSpeed] = useState<SpectatorSpeed>("normal");
  const [stats, setStats] = useState<MatchStats>(() => loadStats());
  const [recordedGameIds, setRecordedGameIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const turnSummary = useMemo(() => {
    if (!game) return "Set a mode and start a new game.";
    if (game.winner !== null) return winnerText(game.winner);
    return `${game.current_player === 1 ? "Red" : "Yellow"} to move`;
  }, [game]);

  const startGame = useCallback(async () => {
    setIsBusy(true);
    setError("");
    try {
      const nextGame = await createGame(mode, difficulty);
      setGame(nextGame);
      setAiMetadata(null);
      setSpectatorPaused(false);
      setAiMessage(mode === "pvp" ? "Local two-player game ready." : `${modeLabel(mode)} ready on ${difficulty} difficulty.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create a game.");
    } finally {
      setIsBusy(false);
    }
  }, [difficulty, mode]);

  const runAiTurn = useCallback(async () => {
    if (!game || game.status === "finished") return;
    setIsBusy(true);
    setError("");
    try {
      const response = await makeAiMove(game.game_id);
      setGame(response.state);
      setAiMessage(response.explanation ?? "The AI made a move.");
      setAiMetadata(response.ai_metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The AI could not move.");
    } finally {
      setIsBusy(false);
    }
  }, [game]);

  const playColumn = useCallback(
    async (column: number) => {
      if (!game || game.status === "finished" || game.player_types[String(game.current_player)] !== "human") return;
      setIsBusy(true);
      setError("");
      try {
        const response = await makeHumanMove(game.game_id, column);
        setGame(response.state);
        setAiMetadata(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "That move did not work.");
      } finally {
        setIsBusy(false);
      }
    },
    [game],
  );

  useEffect(() => {
    void startGame();
  }, [startGame]);

  useEffect(() => {
    if (!game || isBusy || game.status === "finished") return;
    const currentPlayerType = game.player_types[String(game.current_player)];
    if (currentPlayerType === "ai" && (game.mode !== "aivai" || !spectatorPaused)) {
      const timer = window.setTimeout(() => void runAiTurn(), game.mode === "aivai" ? speedDelay[spectatorSpeed] : 450);
      return () => window.clearTimeout(timer);
    }
  }, [game, isBusy, runAiTurn, spectatorPaused, spectatorSpeed]);

  useEffect(() => {
    if (!game || game.status !== "finished" || recordedGameIds.has(game.game_id)) return;
    setRecordedGameIds((current) => new Set(current).add(game.game_id));
    setStats((current) => {
      const next = applyFinishedGame(current, game);
      window.localStorage.setItem("boardarena:connect4-stats", JSON.stringify(next));
      return next;
    });
  }, [game, recordedGameIds]);

  return (
    <main className="app-shell">
      <GameSidebar
        aiMessage={aiMessage}
        aiMetadata={aiMetadata}
        difficulty={difficulty}
        game={game}
        isBusy={isBusy}
        mode={mode}
        onAiTurn={runAiTurn}
        onDifficultyChange={setDifficulty}
        onModeChange={setMode}
        onNewGame={startGame}
        onSpectatorPausedChange={setSpectatorPaused}
        onSpectatorSpeedChange={setSpectatorSpeed}
        spectatorPaused={spectatorPaused}
        spectatorSpeed={spectatorSpeed}
        stats={stats}
      />

      <section className="play-surface">
        <div className="top-bar">
          <div>
            <p className="eyebrow">Current match</p>
            <h2>{turnSummary}</h2>
          </div>
          <div className="score-strip">
            <span className="red-dot" />
            <strong>Red</strong>
            <span className="yellow-dot" />
            <strong>Yellow</strong>
          </div>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}
        <ConnectFourBoard game={game} isBusy={isBusy} onColumnSelect={playColumn} />

        <section className="details-grid" aria-label="Match details">
          <article className="history-panel">
            <div className="panel-heading">
              <p className="eyebrow">Timeline</p>
              <h2>Move history</h2>
            </div>
            {game?.history.length ? (
              <ol className="move-list">
                {game.history.map((move) => (
                  <li key={move.turn}>
                    <span>#{move.turn}</span>
                    <strong>{move.player === 1 ? "Red" : "Yellow"}</strong>
                    <em>Column {move.column + 1}</em>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">No moves yet.</p>
            )}
          </article>

          <article className="catalog-panel">
            <div className="panel-heading">
              <p className="eyebrow">Arena catalog</p>
              <h2>Featured games</h2>
            </div>
            <div className="catalog-row">
              {gameCatalog.map((item) => (
                <article className="game-card" key={item.id}>
                  <span>{item.status}</span>
                  <h3>{item.name}</h3>
                  <p>{item.summary}</p>
                </article>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
