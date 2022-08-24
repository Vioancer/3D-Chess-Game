import { isPiece } from "managers/ChessBoardManager/chessboard-utils";
import { ChessBoardManager } from "managers/ChessBoardManager/ChessBoardManager";
import { PiecesContainer } from "managers/ChessBoardManager/types";
import { Piece } from "objects/Pieces/Piece/Piece";
import { BasicScene } from "scenes/BasicScene/BasicScene";
import { BasicSceneProps } from "scenes/BasicScene/types";
import { Raycaster, Vector2, Vector3 } from "three";

export class ChessScene extends BasicScene {
  chessBoardManager: ChessBoardManager;

  raycaster: Raycaster;
  clickPointer: Vector2;

  constructor(props: BasicSceneProps) {
    super(props);
    this.chessBoardManager = new ChessBoardManager(this.world, this.loader);
  }

  getCoords(event: MouseEvent): { x: number; y: number } {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;

    return { x, y };
  }

  onPointerMove = (event: MouseEvent) => {
    this.movePiece(event);
  };

  onMouseDown = (event: MouseEvent): void => {
    const { x, y } = this.getCoords(event);
    this.clickPointer.x = x;
    this.clickPointer.y = y;

    this.selectPiece();
  };

  onMouseUp = (): void => {
    if (!this.chessBoardManager.selected) {
      return;
    }
    this.world.addBody(this.chessBoardManager.selected.body);
    this.chessBoardManager.setSelected(null);
  };

  setupRaycaster(): void {
    this.raycaster = new Raycaster();
    this.clickPointer = new Vector2();

    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("pointermove", this.onPointerMove);
  }

  setupLights(): void {
    this.setupLight("#FFFFFF", new Vector3(0, 8, -8), 5, new Vector3(0, 0, 0));

    this.setupLight("#FFFFFF", new Vector3(0, 13, 0), 10, new Vector3(0, 0, 0));

    this.setupLight("#FFFFFF", new Vector3(0, 8, 8), 5, new Vector3(0, 0, 0));
  }

  init(): void {
    this.setupLights();
    this.chessBoardManager.init();
    this.setupRaycaster();

    this.setupScene();
  }

  setupPieceSet(set: keyof PiecesContainer): void {
    const pieceSet = this.chessBoardManager.pieces[set];

    for (const pieces of Object.values(pieceSet)) {
      pieces.forEach((el: Piece) => {
        this.add(el);
      });
    }
  }

  setupScene(): void {
    this.add(this.chessBoardManager.chessBoard);
    this.setupPieceSet("white");
    this.setupPieceSet("black");
  }

  movePiece(event: MouseEvent): void {
    if (!this.chessBoardManager.selected) {
      return;
    }

    const { x, y } = this.getCoords(event);

    this.raycaster.setFromCamera({ x, y }, this.camera);

    const intersects = this.raycaster.intersectObjects(this.children);
    const item = intersects.find((el) => el.object.userData.ground);

    this.chessBoardManager.moveSelectedPiece(item.point.x, item.point.z);
  }

  selectPiece(): void {
    this.raycaster.setFromCamera(this.clickPointer, this.camera);

    if (this.chessBoardManager.selected) {
      return;
    }

    const intersects = this.raycaster.intersectObjects(this.children);
    const found = intersects.find((el) => !!el.object.userData.lastParent);
    const { lastParent } = found.object.userData;

    if (!lastParent) {
      return;
    }

    if (!isPiece(lastParent)) {
      return;
    }

    this.world.removeBody(lastParent.body);
    this.chessBoardManager.setSelected(lastParent);
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
