import { Body, Box, Vec3 } from "cannon-es";
import { BLACK_COLOR_PIECE, WHITE_COLOR_PIECE } from "constants/colors";
import { BaseObject } from "objects/BaseObject/BaseObject";
import { Color, Mesh, MeshPhongMaterial, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
  convertCannonEsQuaternion,
  convertCannonEsVector,
  convertThreeVector,
} from "utils/general";
import { PieceChessPosition, PieceColor, PieceOptions } from "./types";

export abstract class Piece extends BaseObject {
  chessPosition: PieceChessPosition;
  color: PieceColor;

  constructor(name: string, model: string | null, options: PieceOptions) {
    super(name, model);

    const { initialChessPosition, color } = options;

    this.chessPosition = initialChessPosition;
    this.color = color;
  }

  init(initialPosition: Vector3, loader: GLTFLoader): Body {
    this.initModel(loader).then(() => {
      this.changeMaterial();
    });

    this.createPsychicsBody(initialPosition);

    this.position.copy(initialPosition);
    this.scale.set(15, 15, 15);

    return this.body;
  }

  changeMaterial(): void {
    this.model.scene.traverse((o: Mesh) => {
      if (!o.isMesh) {
        return;
      }

      o.castShadow = true;
      o.receiveShadow = true;

      const color = new Color(
        this.color === PieceColor.BLACK ? BLACK_COLOR_PIECE : WHITE_COLOR_PIECE
      );

      color.convertSRGBToLinear();
      o.material = new MeshPhongMaterial({
        color,
      });
    });
  }

  createPsychicsBody(initialPosition: Vector3): void {
    this.body = new Body({
      mass: 0.1,
      position: new Vec3().copy(convertThreeVector(initialPosition)),
      shape: new Box(new Vec3(1, 0.01, 1)),
    });
  }

  update(): void {
    this.position.copy(convertCannonEsVector(this.body.position));
    this.quaternion.copy(convertCannonEsQuaternion(this.body.quaternion));
  }
}
