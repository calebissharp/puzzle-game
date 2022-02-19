import { mat4 } from "gl-matrix";

export class Camera {
  x: number;
  y: number;
  zoom: number;
  projection: mat4;

  constructor(width: number, height: number) {
    this.x = width / 2;
    this.y = height / 2;
    this.zoom = 2;
    this.projection = mat4.create();

    this.updateProjection(width, height);
  }

  updateProjection(width: number, height: number) {
    mat4.ortho(
      this.projection,
      this.x - (width / 2) * this.zoom,
      this.x + (width / 2) * this.zoom,
      this.y + (height / 2) * this.zoom,
      this.y - (height / 2) * this.zoom,
      -1,
      1
    );
  }
}
