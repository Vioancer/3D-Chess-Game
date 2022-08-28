import { Vec3, World } from "cannon-es";
import { ChessBoard } from "objects/ChessBoard/ChessBoard";
import { Piece } from "objects/Pieces/Piece/Piece";
import { PieceChessPosition } from "objects/Pieces/Piece/types";
import { Object3D, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { getChessNotation, getMatrixPosition } from "./chessboard-utils";
import { convertThreeVector } from "utils/general";
import { Chess, ChessInstance, Move, PieceColor } from "chess.js";
import { PieceSet } from "managers/PiecesManager/types";
import { PiecesManager } from "managers/PiecesManager/PiecesManager";

export class ChessBoardManager {
  private _chessBoard: ChessBoard;
  private piecesManager: PiecesManager;
  private chessEngine: ChessInstance;

  private selectedInitialPosition: Vec3;
  private selected: Piece | null;

  constructor(private world: World, private loader: GLTFLoader) {
    this._chessBoard = new ChessBoard("ChessBoard");
    this.chessEngine = new Chess();
    this.piecesManager = new PiecesManager(
      this._chessBoard,
      this.loader,
      this.world
    );
  }

  private markPossibleFields(chessPosition: PieceChessPosition): void {
    const chessNotation = getChessNotation(chessPosition);
    const possibleMoves = this.chessEngine.moves({
      square: chessNotation,
      verbose: true,
    });
    possibleMoves.forEach((move) => {
      const { row, column } = getMatrixPosition(move.to);

      this._chessBoard.markPlaneAsDroppable(row, column);
    });
  }

  private initChessBoard() {
    const chessBoardBody = this._chessBoard.init();
    this.world.addBody(chessBoardBody);
  }

  private getOppositeColor(color: PieceColor): PieceColor {
    let newColor: PieceColor = "b";

    if (color === "b") {
      newColor = "w";
    }

    return newColor;
  }

  private capturePiece(
    color: PieceColor,
    captured: keyof PieceSet,
    to: string
  ): number | undefined {
    const capturedChessPosition = getMatrixPosition(to);
    const capturedColor = this.getOppositeColor(color);

    return this.piecesManager.removePiece(
      capturedColor,
      captured,
      capturedChessPosition
    );
  }

  private movePieceToField(field: Object3D, piece: Piece): void {
    const { chessPosition } = field.userData;
    const worldPosition = new Vector3();

    field.getWorldPosition(worldPosition);
    worldPosition.y += 0.1;

    piece.changePosition(
      chessPosition,
      convertThreeVector(worldPosition),
      true
    );
  }

  private handleCastling(color: PieceColor, castlingType: "k" | "q"): void {
    const rookRow = color === "w" ? 0 : 7;
    const rookColumn = castlingType === "q" ? 0 : 7;
    const castlingRook = this.piecesManager.getPiece(color, "r", {
      row: rookRow,
      column: rookColumn,
    });

    const rookCastlingColumn = castlingType === "q" ? 3 : 5;
    const castlingField = this.chessBoard.getField(rookRow, rookCastlingColumn);

    this.movePieceToField(castlingField, castlingRook);
  }

  private handleEnPassante(color: PieceColor, droppedField: Object3D): number {
    const { chessPosition } = droppedField.userData;
    const { row, column }: PieceChessPosition = chessPosition;
    const opposite = this.getOppositeColor(color);
    const enPassanteRow = color === "w" ? row - 1 : row + 1;

    return this.piecesManager.removePiece(opposite, "p", {
      row: enPassanteRow,
      column,
    });
  }

  private handleFlags(result: Move, droppedField: Object3D): number[] {
    const { flags, color } = result;
    const removedPiecesIds: number[] = [];

    switch (flags) {
      case "q":
      case "k":
        this.handleCastling(color, flags);
        break;
      case "e":
        removedPiecesIds.push(this.handleEnPassante(color, droppedField));
        break;
    }

    return removedPiecesIds;
  }

  private dropPiece(droppedField: Object3D): number[] {
    const { chessPosition: toPosition } = droppedField.userData;
    const { chessPosition: fromPosition } = this.selected;
    const removedPiecesIds: number[] = [];

    const from = getChessNotation(fromPosition);
    const to = getChessNotation(toPosition);

    const result = this.chessEngine.move(`${from}${to}`, {
      sloppy: true,
    });

    if (result.captured) {
      const { color, captured, to: movedTo } = result;
      const capturedPieceId = this.capturePiece(color, captured, movedTo);
      removedPiecesIds.push(capturedPieceId);
    }

    const specialRemoved = this.handleFlags(result, droppedField);

    this.movePieceToField(droppedField, this.selected);

    return [...removedPiecesIds, ...specialRemoved];
  }

  get chessBoard(): ChessBoard {
    return this._chessBoard;
  }

  isAnySelected(): boolean {
    return !!this.selected;
  }

  select(piece: Piece): void {
    piece.removeMass();
    this.markPossibleFields(piece.chessPosition);

    this.selectedInitialPosition = piece.body.position.clone();
    this.world.removeBody(piece.body);

    this.selected = piece;
  }

  deselect(intersectedField: Object3D): number[] | undefined {
    const { droppable } = intersectedField.userData;
    let removedPiecesIds: number[];

    if (!droppable) {
      const { x, y, z } = this.selectedInitialPosition;
      this.selected.changeWorldPosition(x, y, z);
      this.selectedInitialPosition = null;
    } else {
      removedPiecesIds = this.dropPiece(intersectedField);
    }

    this._chessBoard.clearMarkedPlanes();
    this.selected.resetMass();
    this.world.addBody(this.selected.body);

    this.selected = null;

    return removedPiecesIds;
  }

  getAllPieces(): Piece[] {
    return this.piecesManager.getAllPieces();
  }

  init(): void {
    this.initChessBoard();
    this.piecesManager.initPieces();
  }

  moveSelectedPiece(x: number, z: number): void {
    if (!this.selected) {
      return;
    }

    this.selected.changeWorldPosition(x, 0.8, z);
  }

  update(): void {
    this._chessBoard.update();
    this.piecesManager.updatePieces("b");
    this.piecesManager.updatePieces("w");
  }
}
