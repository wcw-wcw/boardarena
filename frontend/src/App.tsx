import { useCallback, useEffect, useMemo, useState } from "react";
import { createGame, makeAiMove, makeHumanCellMove, makeHumanMove } from "./api/games";
import { ConnectFourBoard } from "./components/ConnectFourBoard";
import { ReversiBoard } from "./components/ReversiBoard";
import { TicTacToeBoard } from "./components/TicTacToeBoard";
import { gameCatalog, gameName, playableGames } from "./games/registry";
import type { AiMetadata, AiStrategy, GameMode, GameState, GameType } from "./games/connect4/types";
import { difficultyLabel, legalMoveLabel, modeLabel, moveLabel, playerName } from "./lib/gameCopy";

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

const modes: GameMode[] = ["pvp", "pvai", "aivai"];
const difficulties: AiStrategy[] = ["easy", "medium", "hard"];
const speeds: SpectatorSpeed[] = ["slow", "normal", "fast"];

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

function playerDotClass(gameType: GameType, player: 1 | 2): string {
  if (gameType === "connect4") return player === 1 ? "red-dot" : "yellow-dot";
  if (gameType === "reversi") return player === 1 ? "black-dot" : "white-dot";
  return player === 1 ? "x-dot" : "o-dot";
}

function chosenMoveLabel(activeGame: GameType, aiMetadata: AiMetadata | null): string {
  if (
    aiMetadata?.chosen_row !== null &&
    aiMetadata?.chosen_row !== undefined &&
    aiMetadata?.chosen_column !== null &&
    aiMetadata?.chosen_column !== undefined
  ) {
    return moveLabel(activeGame, aiMetadata.chosen_row, aiMetadata.chosen_column);
  }
  if (aiMetadata?.chosen_column !== null && aiMetadata?.chosen_column !== undefined) {
    return moveLabel(activeGame, 0, aiMetadata.chosen_column);
  }
  return "-";
}

export function App() {
  const [activeGame, setActiveGame] = useState<GameType>("connect4");
  const [mode, setMode] = useState<GameMode>("pvai");
  const [difficulty, setDifficulty] = useState<AiStrategy>("medium");
  const [game, setGame] = useState<GameState | null>(null);
  const [aiMessage, setAiMessage] = useState("Choose a game and the AI notes will appear here.");
  const [aiMetadata, setAiMetadata] = useState<AiMetadata | null>(null);
  const [spectatorPaused, setSpectatorPaused] = useState(false);
  const [spectatorSpeed, setSpectatorSpeed] = useState<SpectatorSpeed>("normal");
  const [stats, setStats] = useState<MatchStats>(() => loadStats("connect4"));
  const [recordedGameIds, setRecordedGameIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [setupOpen, setSetupOpen] = useState(true);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const turnSummary = useMemo(() => {
    if (!game) return "Choose your table";
    if (game.winner === 0) return "Draw";
    if (game.winner === 1 || game.winner === 2) {
      const score = game.score ? ` ${game.score[String(game.winner)]}-${game.score[String(game.winner === 1 ? 2 : 1)]}` : "";
      return `${playerName(game.game_type, game.winner)} wins${score}`;
    }
    if (game.pass_turn?.passed) return game.pass_turn.message ?? `${playerName(game.game_type, game.current_player)} to move`;
    return `${playerName(game.game_type, game.current_player)} to move`;
  }, [game]);

  const currentPlayerType = game?.player_types[String(game.current_player)];
  const aiCanMove = game?.status === "in_progress" && currentPlayerType === "ai";
  const isSpectatorMatch = game?.mode === "aivai";

  const startGame = useCallback(async () => {
    setIsBusy(true);
    setError("");
    try {
      const nextGame = await createGame(activeGame, mode, difficulty);
      setGame(nextGame);
      setAiMetadata(null);
      setSpectatorPaused(false);
      setSetupOpen(false);
      setCatalogOpen(false);
      setAiMessage(mode === "pvp" ? "Local two-player game ready." : `${modeLabel(mode)} ready on ${difficultyLabel(difficulty)} difficulty.`);
    } catch (err) {
      setGame(null);
      setError(err instanceof Error ? err.message : "Unable to create a game. Check that the backend is running.");
    } finally {
      setIsBusy(false);
    }
  }, [activeGame, difficulty, mode]);

  const selectGame = useCallback(
    (gameType: GameType) => {
      setActiveGame(gameType);
      setStats(loadStats(gameType));
      setGame(null);
      setAiMetadata(null);
      setAiMessage("Choose a setup and start a match.");
      setError("");
      setSetupOpen(true);
      setCatalogOpen(false);
    },
    [],
  );

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
    setStats(loadStats(activeGame));
  }, [activeGame]);

  useEffect(() => {
    if (!game || isBusy || game.status === "finished") return;
    const playerType = game.player_types[String(game.current_player)];
    if (playerType === "ai" && (game.mode !== "aivai" || !spectatorPaused)) {
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
      <header className="arena-topbar">
        <button className="brand-mark" onClick={() => setCatalogOpen(true)} type="button">
          <span>BoardArena</span>
          <strong>{gameName(activeGame)}</strong>
        </button>
        <nav className="game-tabs" aria-label="Game selection">
          {playableGames.map((item) => (
            <button className={item.id === activeGame ? "selected" : ""} key={item.id} onClick={() => selectGame(item.id)} type="button">
              {item.name}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <button className="secondary-button" onClick={() => setCatalogOpen(true)} type="button">
            Change game
          </button>
          <button className="primary-button" disabled={isBusy} onClick={() => setSetupOpen(true)} type="button">
            {game ? "Change setup" : "Setup match"}
          </button>
        </div>
      </header>

      {catalogOpen ? (
        <section className="catalog-drawer" data-testid="arena-catalog" aria-label="Arena catalog">
          <div className="drawer-heading">
            <div>
              <p className="eyebrow">Choose a table</p>
              <h2>BoardArena catalog</h2>
            </div>
            <button className="ghost-button" onClick={() => setCatalogOpen(false)} type="button">
              Close
            </button>
          </div>
          <div className="catalog-row">
            {gameCatalog.map((item) => (
              <article className={`game-card ${item.id === activeGame ? "selected" : ""}`} data-testid={`game-card-${item.id}`} key={item.id}>
                <span>{item.status}</span>
                <h3>{item.name}</h3>
                <p>{item.summary}</p>
                {item.playable ? (
                  <button
                    className="catalog-button"
                    disabled={item.id === activeGame}
                    onClick={() => selectGame(item.id as GameType)}
                    type="button"
                  >
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
        </section>
      ) : null}

      {!game ? (
        <section className="home-stage">
          <div className="home-copy">
            <p className="eyebrow">Local-first board game tables</p>
            <h1>Pick a table, set the match, and play.</h1>
            <p>
              Backend-owned rules, local stats, move history, and transparent AI decisions are ready for Connect 4, Tic-Tac-Toe, and Reversi.
            </p>
          </div>
          <section className="setup-panel home-setup" aria-label="Match setup">
            <SetupControls
              difficulty={difficulty}
              isBusy={isBusy}
              mode={mode}
              onDifficultyChange={setDifficulty}
              onModeChange={setMode}
              onStart={startGame}
              selectedGameName={gameName(activeGame)}
            />
          </section>
          {error ? <ErrorBanner error={error} onRetry={startGame} isBusy={isBusy} /> : null}
        </section>
      ) : (
        <section className="game-stage" aria-label={`${gameName(activeGame)} active match`}>
          <div className="match-hud">
            <div className="match-title">
              <p className="eyebrow">{modeLabel(game.mode)}</p>
              <h1>{gameName(activeGame)}</h1>
            </div>
            <div className="turn-card" aria-live="polite">
              <span className={`player-dot ${playerDotClass(activeGame, game.current_player)}`} />
              <div>
                <p>{game.status === "finished" ? "Match over" : "Current turn"}</p>
                <strong>{turnSummary}</strong>
              </div>
            </div>
            <div className="score-strip">
              <span className={`player-dot ${playerDotClass(activeGame, 1)}`} />
              <strong>{playerName(activeGame, 1)}</strong>
              {game.score ? <em>{game.score["1"]}</em> : null}
              <span className={`player-dot ${playerDotClass(activeGame, 2)}`} />
              <strong>{playerName(activeGame, 2)}</strong>
              {game.score ? <em>{game.score["2"]}</em> : null}
            </div>
          </div>

          {error ? <ErrorBanner error={error} onRetry={startGame} isBusy={isBusy} /> : null}

          {setupOpen ? (
            <section className="setup-panel setup-popover" aria-label="Game mode">
              <div className="drawer-heading">
                <div>
                  <p className="eyebrow">Applies to next match</p>
                  <h2>Match setup</h2>
                </div>
                <button className="ghost-button" onClick={() => setSetupOpen(false)} type="button">
                  Close
                </button>
              </div>
              <SetupControls
                difficulty={difficulty}
                isBusy={isBusy}
                mode={mode}
                onDifficultyChange={setDifficulty}
                onModeChange={setMode}
                onStart={startGame}
                selectedGameName={gameName(activeGame)}
              />
            </section>
          ) : null}

          <div className="stage-grid">
            <aside className="hud-column left-hud">
              <HistoryPanel game={game} />
              <StatsPanel activeGame={activeGame} stats={stats} />
            </aside>

            <section className="board-stage" aria-label="Game board">
              {activeGame === "connect4" ? (
                <ConnectFourBoard game={game} isBusy={isBusy} onColumnSelect={playColumn} />
              ) : activeGame === "reversi" ? (
                <ReversiBoard game={game} isBusy={isBusy} onCellSelect={playCell} />
              ) : (
                <TicTacToeBoard game={game} isBusy={isBusy} onCellSelect={playCell} />
              )}
            </section>

            <aside className="hud-column right-hud">
              <section className="match-controls hud-panel" aria-label="Match controls">
                <div className="compact-actions">
                  <button className="primary-button" disabled={isBusy} onClick={startGame} type="button">
                    New match
                  </button>
                  <button className="secondary-button" onClick={() => setSetupOpen(true)} type="button">
                    Change setup
                  </button>
                </div>
                {isSpectatorMatch ? (
                  <div className="spectator-controls" aria-label="AI spectator controls">
                    <div className="compact-actions">
                      <button
                        className="secondary-button"
                        disabled={game.status === "finished"}
                        onClick={() => setSpectatorPaused(!spectatorPaused)}
                        type="button"
                      >
                        {spectatorPaused ? "Resume" : "Pause"}
                      </button>
                      <button className="secondary-button" disabled={!aiCanMove || isBusy} onClick={runAiTurn} type="button">
                        Step AI
                      </button>
                    </div>
                    <div className="segmented compact" aria-label="AI speed">
                      {speeds.map((speed) => (
                        <button
                          className={speed === spectatorSpeed ? "selected" : ""}
                          key={speed}
                          onClick={() => setSpectatorSpeed(speed)}
                          type="button"
                        >
                          {speed}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              <AiPanel activeGame={activeGame} aiMessage={aiMessage} aiMetadata={aiMetadata} difficulty={difficulty} mode={mode} />
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}

interface SetupControlsProps {
  difficulty: AiStrategy;
  isBusy: boolean;
  mode: GameMode;
  onDifficultyChange: (difficulty: AiStrategy) => void;
  onModeChange: (mode: GameMode) => void;
  onStart: () => void;
  selectedGameName: string;
}

function SetupControls({ difficulty, isBusy, mode, onDifficultyChange, onModeChange, onStart, selectedGameName }: SetupControlsProps) {
  const showDifficulty = mode !== "pvp";

  return (
    <>
      <div className="setup-summary">
        <span>Selected table</span>
        <strong>{selectedGameName}</strong>
      </div>
      <section className="control-section" aria-label="Game mode">
        <h2>Mode</h2>
        <div className="segmented mode-options">
          {modes.map((item) => (
            <button className={item === mode ? "selected" : ""} key={item} onClick={() => onModeChange(item)} type="button">
              {modeLabel(item)}
            </button>
          ))}
        </div>
      </section>
      {showDifficulty ? (
        <section className="control-section" aria-label="AI difficulty">
          <h2>AI difficulty</h2>
          <div className="segmented compact">
            {difficulties.map((item) => (
              <button className={item === difficulty ? "selected" : ""} key={item} onClick={() => onDifficultyChange(item)} type="button">
                {difficultyLabel(item)}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <p className="setup-note">Local Play uses two human players, so AI difficulty is hidden for this match.</p>
      )}
      <button className="primary-button start-button" disabled={isBusy} onClick={onStart} type="button">
        {isBusy ? "Starting..." : "Start match"}
      </button>
    </>
  );
}

function ErrorBanner({ error, isBusy, onRetry }: { error: string; isBusy: boolean; onRetry: () => void }) {
  return (
    <div className="error-banner" role="alert">
      <div>
        <strong>Action needed</strong>
        <span>{error}</span>
      </div>
      <button className="secondary-button" disabled={isBusy} onClick={onRetry} type="button">
        Retry connection
      </button>
    </div>
  );
}

function HistoryPanel({ game }: { game: GameState }) {
  return (
    <article className="history-panel hud-panel">
      <div className="panel-heading">
        <p className="eyebrow">Timeline</p>
        <h2>Move history</h2>
      </div>
      {game.history.length ? (
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
  );
}

function StatsPanel({ activeGame, stats }: { activeGame: GameType; stats: MatchStats }) {
  return (
    <section className="stats-panel hud-panel" aria-label="Local match stats">
      <div className="panel-heading">
        <p className="eyebrow">Local stats</p>
        <h2>Match record</h2>
      </div>
      <div className="stats-grid">
        <span>Total</span>
        <strong>{stats.totalGames}</strong>
        <span>{playerName(activeGame, 1)} wins</span>
        <strong>{stats.playerWins["1"]}</strong>
        <span>{playerName(activeGame, 2)} wins</span>
        <strong>{stats.playerWins["2"]}</strong>
        <span>Draws</span>
        <strong>{stats.draws}</strong>
        <span>Human vs AI</span>
        <strong>
          {stats.humanWinsVsAi}-{stats.aiWinsVsHuman}
        </strong>
      </div>
      <ul className="recent-results">
        {stats.recentResults.length ? stats.recentResults.map((result, index) => <li key={`${result}-${index}`}>{result}</li>) : <li>No completed local games yet.</li>}
      </ul>
    </section>
  );
}

function AiPanel({
  activeGame,
  aiMessage,
  aiMetadata,
  difficulty,
  mode,
}: {
  activeGame: GameType;
  aiMessage: string;
  aiMetadata: AiMetadata | null;
  difficulty: AiStrategy;
  mode: GameMode;
}) {
  return (
    <section className="ai-panel hud-panel" aria-label="AI explanation">
      <div className="panel-heading">
        <p className="eyebrow">AI explainability</p>
        <h2>Move explanation</h2>
      </div>
      <p>{aiMessage || "Start a game and the AI will explain its moves here."}</p>
      <dl className="metadata-grid">
        <div>
          <dt>Chosen move</dt>
          <dd>{chosenMoveLabel(activeGame, aiMetadata)}</dd>
        </div>
        <div>
          <dt>Strategy</dt>
          <dd>{aiMetadata?.strategy ? difficultyLabel(aiMetadata.strategy) : mode === "pvp" ? "None" : difficultyLabel(difficulty)}</dd>
        </div>
        <div>
          <dt>Reason</dt>
          <dd>{aiMetadata?.reason?.replaceAll("_", " ") ?? "-"}</dd>
        </div>
        <div>
          <dt>Depth</dt>
          <dd>{aiMetadata?.depth ?? "-"}</dd>
        </div>
        <div>
          <dt>Score</dt>
          <dd>{aiMetadata?.score ?? "-"}</dd>
        </div>
        <div>
          <dt>Legal moves</dt>
          <dd>{aiMetadata?.legal_moves_considered?.map((move) => legalMoveLabel(activeGame, move)).join(", ") ?? "-"}</dd>
        </div>
        {activeGame === "reversi" ? (
          <div>
            <dt>Flipped</dt>
            <dd>{aiMetadata?.flipped_cell_count ?? "-"}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
