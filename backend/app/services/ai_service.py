from __future__ import annotations

from backend.app.services.game_manager import GameSession
from backend.game.ai import choose_ai_move


class AIService:
    def generate_move(self, session: GameSession) -> dict:
        current_player = session.game.current_player
        strategy = session.ai_strategies.get(current_player) or "medium"
        decision = choose_ai_move(session.game, strategy=strategy)

        move = decision["move"]
        if move is None:
            raise ValueError("AI could not generate a move because no legal moves are available.")

        move_result = session.game.make_move(move)
        metadata = decision.get("metadata", {}) | {
            "strategy": strategy,
            "chosen_column": move,
        }
        return {
            "move_result": move_result,
            "explanation": decision.get("explanation"),
            "strategy": strategy,
            "metadata": metadata,
        }


ai_service = AIService()
