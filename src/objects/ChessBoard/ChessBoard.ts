import { GUI } from "dat.gui";
import { BaseGroup } from "objects/BaseGroup/BaseGroup";
import { DroppableField } from "./types";
import { Id } from "global/types";
import { Body, Box, Plane, Vec3 } from "cannon-es";
import {
  convertCannonEsQuaternion,
  convertCannonEsVector,
  convertThreeQuaternion,
  convertThreeVector,
} from "utils/general";
import {
  Box3,
  CircleGeometry,
  FrontSide,
  Mesh,
  MeshLambertMaterial,
  PlaneGeometry,
} from "three";

export class ChessBoard extends BaseGroup {
  boardMatrix: Array<Id[]> = [];
  currentlyDroppable: DroppableField[] = [];
  size = 8;

  constructor(name: string, debugHelper?: GUI) {
    super(name, debugHelper);
  }

  init(): Body {
    this.createBoardMatrix();
    this.centerMiddle();
    this.setInitialDebugPosition(this.position);
    this.createPsychicsBody();

    this.body.position.copy(convertThreeVector(this.position));
    this.body.position.y = -this.size;

    this.quaternion.copy(convertCannonEsQuaternion(this.body.quaternion));

    return this.body;
  }

  createBoardMatrix(): void {
    this.boardMatrix = [];
    let colorBlack = true;

    for (let i = 0; i < this.size; i++) {
      this.boardMatrix.push([]);
      colorBlack = !colorBlack;

      for (let j = 0; j < this.size; j++) {
        const geometry = new PlaneGeometry(1, 1);
        const material = new MeshLambertMaterial({
          color: colorBlack ? "#000000" : "#FFFFFF",
          side: FrontSide,
        });
        const plane = new Mesh(geometry, material);

        plane.position.setX(j * 1);
        plane.position.setZ(i * 1);
        plane.rotation.x = -Math.PI / 2;

        this.boardMatrix[i].push(plane.id);

        this.add(plane);

        colorBlack = !colorBlack;
      }
    }
  }

  createDropCircle() {
    const geometry = new CircleGeometry(0.3, 16);
    const material = new MeshLambertMaterial({ color: "orange" });
    const circle = new Mesh(geometry, material);

    return circle;
  }

  markPlaneAsDroppable(row: number, column: number) {
    const planeId = this.boardMatrix[row][column];

    if (!planeId) {
      throw Error("There is no plane with specified row and column");
    }

    const plane = this.getObjectById(planeId) as Mesh;

    if (!plane) {
      throw Error("There is no plane with specified id");
    }

    const dropCircle = this.createDropCircle();
    dropCircle.position.copy(plane.position);
    dropCircle.rotation.copy(plane.rotation);
    dropCircle.position.setY(0.01);

    this.add(dropCircle);
    this.currentlyDroppable.push({ planeId, circleId: dropCircle.id });
  }

  createPsychicsBody() {
    this.body = new Body({
      mass: 0,
      shape: new Box(new Vec3(this.size, this.size, this.size)),
    });
  }

  centerMiddle(): void {
    new Box3().setFromObject(this).getCenter(this.position).multiplyScalar(-1);
  }

  update() {
    const clonedPosition = this.body.position.clone();
    clonedPosition.y = clonedPosition.y + this.size;

    this.position.copy(convertCannonEsVector(clonedPosition));
    this.quaternion.copy(convertCannonEsQuaternion(this.body.quaternion));
  }
}
