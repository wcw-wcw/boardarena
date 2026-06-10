import { difficultyLabel, modeLabel } from "../lib/gameCopy";
import type { AiMetadata, AiStrategy, GameMode, GameState } from "../games/connect4/types";

type SpectatorSpeed = "slow" | "normal" | "fast";

interface MatchStats {
  totalGames: number;
  playerWins: Record<"1" | "2", number>;
  draws: number;
  humanWinsVsAi: number;
  aiWinsVsHuman: number;
  recentResults: string[];
}

interface GameSidebarProps {
  mode: GameMode;
  difficulty: AiStrategy;
  game: GameState | null;
  aiMessage: string;
  aiMetadata: AiMetadata | null;
  spectatorPaused: boolean;
  spectatorSpeed: SpectatorSpeed;
  stats: MatchStats;
  onModeChange: (mode: GameMode) => void;
  onDifficultyChange: (difficulty: AiStrategy) => void;
  onNewGame: () => void;
  onAiTurn: () => void;
  onSpectatorPausedChange: (paused: boolean) => void;
  onSpectatorSpeedChange: (speed: SpectatorSpeed) => void;
  isBusy: boolean;
}

const modes: GameMode[] = ["pvp", "pvai", "aivai"];
const difficulties: AiStrategy[] = ["easy", "medium", "hard"];
const speeds: SpectatorSpeed[] = ["slow", "normal", "fast"];

export function GameSidebar({
  mode,
  difficulty,
  game,
  aiMessage,
  aiMetadata,
  spectatorPaused,
  spectatorSpeed,
  stats,
  onModeChange,
  onDifficultyChange,
  onNewGame,
  onAiTurn,
  onSpectatorPausedChange,
  onSpectatorSpeedChange,
  isBusy,
}: GameSidebarProps) {
  const currentPlayerType = game?.player_types[String(game.current_player)];
  const aiCanMove = game?.status === "in_progress" && currentPlayerType === "ai";
  const showSpectatorControls = mode === "aivai";

  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div>
          <p className="eyebrow">LLM Game Arena</p>
          <h1>Connect 4 Arena</h1>
          <p className="brand-subtitle">A local-first board game lab for human and AI matchups.</p>
        </div>
        <span className="status-pill">{game?.status === "finished" ? "Finished" : "Live"}</span>
      </div>

      <section className="control-section" aria-label="Game mode">
        <h2>Mode</h2>
        <div className="segmented">
          {modes.map((item) => (
            <button className={item === mode ? "selected" : ""} key={item} onClick={() => onModeChange(item)} type="button">
              {modeLabel(item)}
            </button>
          ))}
        </div>
      </section>

      <section className="control-section" aria-label="AI difficulty">
        <h2>AI</h2>
        <div className="segmented">
          {difficulties.map((item) => (
            <button
              className={item === difficulty ? "selected" : ""}
              disabled={mode === "pvp"}
              key={item}
              onClick={() => onDifficultyChange(item)}
              type="button"
            >
              {difficultyLabel(item)}
            </button>
          ))}
        </div>
      </section>

      <div className="action-row">
        <button className="primary-button" disabled={isBusy} onClick={onNewGame} type="button">
          New match
        </button>
        <button className="secondary-button" disabled={!aiCanMove || isBusy} onClick={onAiTurn} type="button">
          Step AI
        </button>
      </div>

      {showSpectatorControls ? (
        <section className="control-section spectator-card" aria-label="AI spectator controls">
          <h2>Spectator controls</h2>
          <div className="action-row">
            <button className="secondary-button" disabled={game?.status === "finished"} onClick={() => onSpectatorPausedChange(!spectatorPaused)} type="button">
              {spectatorPaused ? "Resume" : "Pause"}
            </button>
            <button className="secondary-button" disabled={!aiCanMove || isBusy} onClick={onAiTurn} type="button">
              Step
            </button>
          </div>
          <div className="segmented compact">
            {speeds.map((speed) => (
              <button className={speed === spectatorSpeed ? "selected" : ""} key={speed} onClick={() => onSpectatorSpeedChange(speed)} type="button">
                {speed}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="ai-panel" aria-label="AI explanation">
        <div className="panel-heading">
          <p className="eyebrow">AI explainability</p>
          <h2>Move explanation</h2>
        </div>
        <p>{aiMessage || "Start a game and the AI will explain its moves here."}</p>
        <dl className="metadata-grid">
          <div>
            <dt>Chosen column</dt>
            <dd>{aiMetadata?.chosen_column !== null && aiMetadata?.chosen_column !== undefined ? aiMetadata.chosen_column + 1 : "-"}</dd>
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
            <dd>{aiMetadata?.legal_moves_considered?.map((move) => move + 1).join(", ") ?? "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="stats-panel" aria-label="Local match stats">
        <div className="panel-heading">
          <p className="eyebrow">Local stats</p>
          <h2>Match record</h2>
        </div>
        <div className="stats-grid">
          <span>Total</span>
          <strong>{stats.totalGames}</strong>
          <span>Red wins</span>
          <strong>{stats.playerWins["1"]}</strong>
          <span>Yellow wins</span>
          <strong>{stats.playerWins["2"]}</strong>
          <span>Draws</span>
          <strong>{stats.draws}</strong>
          <span>Human vs AI</span>
          <strong>{stats.humanWinsVsAi}-{stats.aiWinsVsHuman}</strong>
        </div>
        <ul className="recent-results">
          {stats.recentResults.length ? stats.recentResults.map((result, index) => <li key={`${result}-${index}`}>{result}</li>) : <li>No completed local games yet.</li>}
        </ul>
      </section>
    </aside>
  );
}
