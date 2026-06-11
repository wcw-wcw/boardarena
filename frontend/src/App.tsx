import { useCallback, useEffect, useMemo, useState } from "react";
import { createGame, makeAiMove, makeHumanCellMove, makeHumanMove } from "./api/games";
import { ConnectFourBoard } from "./components/ConnectFourBoard";
import { GameSidebar } from "./components/GameSidebar";
import { ReversiBoard } from "./components/ReversiBoard";
import { TicTacToeBoard } from "./components/TicTacToeBoard";
import { gameCatalog, gameName } from "./games/registry";
import type { AiMetadata, AiStrategy, GameMode, GameState, GameType } from "./games/connect4/types";
import { modeLabel, moveLabel, playerName } from "./lib/gameCopy";

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

function statsKey(gameType: GameType): string {
  return `boardarena:${gameType}-stats`;
}

function loadStats(gameType: GameType): MatchStats {
  try {
    const value = window.localStorage.getItem(statsKey(gameType));
    return value ? { ...defaultStats, ...JSON.parse(value) } : defaultStats;
  } catch {
    return defaultStats;
  }
}

function describeResult(game: GameState): string {
  if (game.winner === 0) return `${modeLabel(game.mode)}: draw in ${game.history.length} turns`;
  return `${modeLabel(game.mode)}: ${playerName(game.game_type, game.winner === 1 ? 1 : 2)} won in ${game.history.length} turns`;
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
  const [activeGame, setActiveGame] = useState<GameType>("connect4");
  const [mode, setMode] = useState<GameMode>("pvai");
  const [difficulty, setDifficulty] = useState<AiStrategy>("medium");
  const [game, setGame] = useState<GameState | null>(null);
  const [aiMessage, setAiMessage] = useState("Start a game and AI explanations will appear here.");
  const [aiMetadata, setAiMetadata] = useState<AiMetadata | null>(null);
  const [spectatorPaused, setSpectatorPaused] = useState(false);
  const [spectatorSpeed, setSpectatorSpeed] = useState<SpectatorSpeed>("normal");
  const [stats, setStats] = useState<MatchStats>(() => loadStats("connect4"));
  const [recordedGameIds, setRecordedGameIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState("");
  const [hasStartedOnce, setHasStartedOnce] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const turnSummary = useMemo(() => {
    if (!game) return "Set a mode and start a new game.";
    if (game.winner === 0) return "Draw";
    if (game.winner === 1 || game.winner === 2) {
      const score = game.score ? ` ${game.score[String(game.winner)]}-${game.score[String(game.winner === 1 ? 2 : 1)]}` : "";
      return `${playerName(game.game_type, game.winner)} wins${score}`;
    }
    if (game.pass_turn?.passed) return game.pass_turn.message ?? `${playerName(game.game_type, game.current_player)} to move`;
    return `${playerName(game.game_type, game.current_player)} to move`;
  }, [game]);

  const startGame = useCallback(async () => {
    setIsBusy(true);
    setError("");
    try {
      const nextGame = await createGame(activeGame, mode, difficulty);
      setGame(nextGame);
      setAiMetadata(null);
      setSpectatorPaused(false);
      setHasStartedOnce(true);
      setAiMessage(mode === "pvp" ? "Local two-player game ready." : `${modeLabel(mode)} ready on ${difficulty} difficulty.`);
    } catch (err) {
      setGame(null);
      setError(err instanceof Error ? err.message : "Unable to create a game. Check that the backend is running.");
    } finally {
      setIsBusy(false);
    }
  }, [activeGame, difficulty, mode]);

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

  const playCell = useCallback(
    async (row: number, column: number) => {
      if (!game || game.status === "finished" || game.player_types[String(game.current_player)] !== "human") return;
      setIsBusy(true);
      setError("");
      try {
        const response = await makeHumanCellMove(game.game_id, row, column);
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
    setStats(loadStats(activeGame));
  }, [activeGame]);

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
      window.localStorage.setItem(statsKey(game.game_type), JSON.stringify(next));
      return next;
    });
  }, [game, recordedGameIds]);

  return (
    <main className="app-shell" data-testid="app-shell">
      <GameSidebar
        activeGame={activeGame}
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
            <span className={`player-dot ${activeGame === "connect4" ? "red-dot" : activeGame === "reversi" ? "black-dot" : "x-dot"}`} />
            <strong>{playerName(activeGame, 1)}</strong>
            {game?.score ? <em>{game.score["1"]}</em> : null}
            <span className={`player-dot ${activeGame === "connect4" ? "yellow-dot" : activeGame === "reversi" ? "white-dot" : "o-dot"}`} />
            <strong>{playerName(activeGame, 2)}</strong>
            {game?.score ? <em>{game.score["2"]}</em> : null}
          </div>
        </div>

        {error ? (
          <div className="error-banner" role="alert">
            <strong>Action needed</strong>
            <span>{error}</span>
          </div>
        ) : null}
        {!game && (isBusy || !hasStartedOnce || error) ? (
          <section className={`empty-state ${error ? "offline-state" : ""}`} aria-live="polite">
            <p className="eyebrow">{error ? "Backend connection" : "Preparing match"}</p>
            <h2>{error ? "The arena is waiting for the API." : "Setting up the board..."}</h2>
            <p>
              {error
                ? "Run the FastAPI backend on 127.0.0.1:8000 or set VITE_API_BASE_URL to your deployed API, then start a new match."
                : "BoardArena is creating a local session with backend-owned rule validation."}
            </p>
            {error ? (
              <button className="primary-button inline-action" disabled={isBusy} onClick={startGame} type="button">
                Retry connection
              </button>
            ) : null}
          </section>
        ) : activeGame === "connect4" ? (
          <ConnectFourBoard game={game} isBusy={isBusy} onColumnSelect={playColumn} />
        ) : activeGame === "reversi" ? (
          <ReversiBoard game={game} isBusy={isBusy} onCellSelect={playCell} />
        ) : (
          <TicTacToeBoard game={game} isBusy={isBusy} onCellSelect={playCell} />
        )}

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
                    <strong>{playerName(game.game_type, move.player)}</strong>
                    <em>{moveLabel(game.game_type, move.row, move.column)}</em>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">No moves yet.</p>
            )}
          </article>

          <article className="catalog-panel" data-testid="arena-catalog">
            <div className="panel-heading">
              <p className="eyebrow">Arena catalog</p>
              <h2>Choose a table</h2>
            </div>
            <div className="catalog-row">
              {gameCatalog.map((item) => (
                <article className={`game-card ${item.id === activeGame ? "selected" : ""}`} data-testid={`game-card-${item.id}`} key={item.id}>
                  <span>{item.status}</span>
                  <h3>{item.name}</h3>
                  <p>{item.summary}</p>
                  {item.playable ? (
                    <button className="catalog-button" disabled={item.id === activeGame} onClick={() => setActiveGame(item.id as GameType)} type="button">
                      {item.id === activeGame ? "Selected" : `Play ${gameName(item.id as GameType)}`}
                    </button>
                  ) : (
                    <button className="catalog-button" disabled type="button">
                      Coming soon
                    </button>
                  )}
                </article>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
