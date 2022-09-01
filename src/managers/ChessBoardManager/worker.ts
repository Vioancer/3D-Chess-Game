import { ChessAiManager } from "managers/ChessAiManager/ChessAiManager";
import { WebWorkerEvent } from "./types";

let chessAiManager: ChessAiManager;

addEventListener("message", (e: WebWorkerEvent) => {
  const type = e.data.type;

  switch (type) {
    case "init":
      chessAiManager = new ChessAiManager(e.data.fen);
      chessAiManager.init(e.data.color);
      break;
    case "aiMove":
      chessAiManager.updateBoardWithPlayerMove(e.data.playerMove);
      postMessage({
        type: "aiMovePerformed",
        aiMove: chessAiManager.calcAiMove(),
      });
      break;
    default:
      return;
  }
});