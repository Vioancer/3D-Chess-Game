import { PieceColor } from "chess.js";
import { isPiece } from "managers/ChessBoardManager/chessboard-utils";
import { ChessBoardManager } from "managers/ChessBoardManager/ChessBoardManager";
import { Piece } from "objects/Pieces/Piece/Piece";
import { BasicScene } from "scenes/BasicScene/BasicScene";
import { BasicSceneProps } from "scenes/BasicScene/types";
import { Raycaster, Vector2, Vector3 } from "three";

export class ChessScene extends BasicScene {
  private chessBoardManager: ChessBoardManager;
  private raycaster: Raycaster;
  private clickPointer: Vector2;

  constructor(props: BasicSceneProps) {
    super(props);
    this.chessBoardManager = new ChessBoardManager(this.world, this.loader);
  }

  private getCoords(event: MouseEvent): { x: number; y: number } {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;

    return { x, y };
  }

  private onPointerMove = (event: MouseEvent) => {
    this.movePiece(event);
  };

  private onMouseDown = (event: MouseEvent): void => {
    const { x, y } = this.getCoords(event);
    this.clickPointer.x = x;
    this.clickPointer.y = y;

    this.selectPiece();
  };

  private onMouseUp = (): void => {
    if (!this.chessBoardManager.isAnySelected()) {
      return;
    }
    const intersects = this.raycaster.intersectObjects(this.children);
    const item = intersects.find((el) => el.object.userData.ground);

    const removedPiecesIds = this.chessBoardManager.deselect(item.object);
    this.removePiecesFromScene(removedPiecesIds);
  };

  private setupRaycaster(): void {
    this.raycaster = new Raycaster();
    this.clickPointer = new Vector2();

    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("pointermove", this.onPointerMove);
  }

  private setupLights(): void {
    this.setupLight("#FFFFFF", new Vector3(0, 8, -8), 3, new Vector3(0, 0, 0));

    this.setupLight("#FFFFFF", new Vector3(0, 13, 0), 8, new Vector3(0, 0, 0));

    this.setupLight("#FFFFFF", new Vector3(0, 8, 8), 3, new Vector3(0, 0, 0));
  }

  private setupPieces(): void {
    const pieces = this.chessBoardManager.getAllPieces();
    pieces.forEach((el: Piece) => {
      this.add(el);
    });
  }

  private setupScene(): void {
    this.add(this.chessBoardManager.chessBoard);
    this.setupPieces();
  }

  private movePiece(event: MouseEvent): void {
    if (!this.chessBoardManager.isAnySelected()) {
      return;
    }

    const { x, y } = this.getCoords(event);

    this.raycaster.setFromCamera({ x, y }, this.camera);

    const intersects = this.raycaster.intersectObjects(this.children);
    const item = intersects.find((el) => el.object.userData.ground);

    if (!item) {
      return;
    }

    this.chessBoardManager.moveSelectedPiece(item.point.x, item.point.z);
  }

  private selectPiece(): void {
    this.raycaster.setFromCamera(this.clickPointer, this.camera);

    if (this.chessBoardManager.isAnySelected()) {
      return;
    }

    const intersects = this.raycaster.intersectObjects(this.children);
    const found = intersects.find((el) => !!el.object.userData.lastParent);

    if (!found) {
      return;
    }

    const { lastParent } = found.object.userData;

    if (!lastParent || !isPiece(lastParent)) {
      return;
    }

    this.chessBoardManager.select(lastParent);
  }

  private setCameraPosition(playerStartingSide: PieceColor): void {
    const z = playerStartingSide === "w" ? -8 : 8;
    this.camera.position.set(0, 11, z);
    this.camera.lookAt(0, 0, 0);
  }

  removePiecesFromScene = (piecesIds: number[]) => {
    piecesIds.forEach((id) => {
      const pieceToRemove = this.getObjectById(id);
      this.remove(pieceToRemove);
    });
  };

  init(): void {
    const playerStartingSide = this.chessBoardManager.init(
      this.removePiecesFromScene
    );
    this.setCameraPosition(playerStartingSide);
    this.setupLights();
    this.setupRaycaster();

    this.setupScene();
  }

  update(): void {
    this.chessBoardManager.update();
    super.update();
  }

  cleanup(): void {
    window.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("pointermove", this.onPointerMove);
  }
}
