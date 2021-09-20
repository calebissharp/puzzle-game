import { mat4, vec3 } from "gl-matrix";
import * as Stats from "stats.js";
import { Camera } from "./camera";
import { getPieceShaderProgram, getTextureInfo, Piece } from "./piece";
import { genPuzzlePieceTextures } from "./pieceGen";
import { clamp, loadImage } from "./util";

export class PuzzleGame {
  gl: WebGLRenderingContext;

  PUZZLE_WIDTH: number;
  PUZZLE_HEIGHT: number;

  camera: Camera;

  imageUrl: string;
  image: HTMLImageElement;

  startTime: number;
  elapsedTime: number;
  lastTime: number;

  dragging = false;

  pieces: Piece[] = [];
  activePiece?: Piece;

  stats: Stats;

  constructor(imageUrl: string, puzzleWidth: number, puzzleHeight: number) {
    this.PUZZLE_WIDTH = puzzleWidth;
    this.PUZZLE_HEIGHT = puzzleHeight;
    this.imageUrl = imageUrl;

    const canvas = document.querySelector<HTMLCanvasElement>("#game");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.log("Failed to load WebGL context");

      return;
    }

    this.gl = gl;

    gl.enable(gl.BLEND);

    this.camera = new Camera(this.gl.canvas.width, this.gl.canvas.height);

    this.stats = new Stats();
    this.stats.showPanel(0);

    window.addEventListener("resize", () => {});
  }

  async load() {
    const program = getPieceShaderProgram(this.gl);

    this.image = await loadImage(this.imageUrl);

    const pieceTextures = await genPuzzlePieceTextures({
      image: this.image,
      puzzleWidth: this.PUZZLE_WIDTH,
      puzzleHeight: this.PUZZLE_HEIGHT,
      pieceBorder: true,
    });

    for (let j = 0; j < this.PUZZLE_WIDTH; j++) {
      for (let k = 0; k < this.PUZZLE_HEIGHT; k++) {
        const textureInfo = getTextureInfo(
          this.gl,
          pieceTextures.find((pt) => pt.j === j && pt.k === k)
        );
        this.pieces.push(
          new Piece({
            gl: this.gl,
            textureInfo,
            program,
            puzzleWidth: this.PUZZLE_WIDTH,
            puzzleHeight: this.PUZZLE_HEIGHT,
            puzzleImageWidth: this.image.width,
            puzzleImageHeight: this.image.height,
            j,
            k,
          })
        );
      }
    }

    window.addEventListener("mousedown", this.onMouseDown.bind(this));
    window.addEventListener("mouseup", this.onMouseUp.bind(this));
    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    window.addEventListener("wheel", this.onWheel.bind(this));
  }

  update(deltaTime: number, elapsed: number) {
    this.pieces.forEach((piece) => piece.update(deltaTime, elapsed));
  }

  draw() {
    const width = this.gl.canvas.clientWidth | 0;
    const height = this.gl.canvas.clientHeight | 0;
    if (this.gl.canvas.width !== width || this.gl.canvas.height !== height) {
      this.gl.canvas.width = width;
      this.gl.canvas.height = height;
    }

    // Tell WebGL how to convert from clip space to pixels
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    this.gl.clearColor(0, 0, 1, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.pieces.forEach((piece) => piece.draw(this.gl, this.camera.projection));
  }

  start() {
    document.body.append(this.stats.dom);

    requestAnimationFrame(this.render.bind(this));
  }

  render(time: number) {
    if (!this.startTime) {
      this.startTime = time;
    }
    const now = time * 0.001;
    const deltaTime = Math.min(0.1, now - this.lastTime);
    this.lastTime = now;
    const elapsed = time - this.startTime;

    this.stats.begin();

    this.update(deltaTime, elapsed);
    this.draw();

    this.stats.end();

    requestAnimationFrame(this.render.bind(this));
  }

  onWheel(e: WheelEvent) {
    this.camera.zoom = clamp(0.1, 5, this.camera.zoom + e.deltaY * 0.005);
    this.camera.updateProjection(this.gl.canvas.width, this.gl.canvas.height);
  }

  onResize() {
    this.gl.canvas.width = window.innerWidth;
    this.gl.canvas.height = window.innerHeight;
    this.camera.updateProjection(this.gl.canvas.width, this.gl.canvas.height);
  }

  onMouseUp() {
    this.dragging = false;
    if (this.activePiece) {
      this.activePiece.active = false;
      this.activePiece = undefined;
    }
  }

  onMouseDown(e: MouseEvent) {
    this.dragging = true;

    // Don't select piece if middle mouse button is pressed or if the meta key
    // (cmd) is pressed
    if (e.button !== 1 && !e.metaKey) {
      const invProjection = mat4.create();
      mat4.invert(invProjection, this.camera.projection);

      const pos = vec3.fromValues(
        (e.offsetX / window.innerWidth) * 2 - 1,
        ((e.offsetY / window.innerHeight) * 2 - 1) * -1,
        1
      );

      vec3.transformMat4(pos, pos, invProjection);

      this.pieces.reverse();
      const clickedPiece = this.pieces.find((piece) => {
        if (
          pos[0] > piece.position.x &&
          pos[0] < piece.position.x + piece.sliceWidth &&
          pos[1] > piece.position.y &&
          pos[1] < piece.position.y + piece.sliceHeight
        ) {
          return true;
        }
      });
      this.pieces.reverse();

      if (clickedPiece) {
        this.pieces.splice(this.pieces.indexOf(clickedPiece), 1);
        this.pieces.push(clickedPiece);
        this.activePiece = clickedPiece;
      }
    }
  }

  onMouseMove(e: MouseEvent) {
    if (this.dragging) {
      if (this.activePiece) {
        this.activePiece.position.x += e.movementX * this.camera.zoom;
        this.activePiece.position.y += e.movementY * this.camera.zoom;
      } else {
        this.camera.x += -e.movementX * this.camera.zoom;
        this.camera.y += -e.movementY * this.camera.zoom;

        this.camera.updateProjection(
          this.gl.canvas.width,
          this.gl.canvas.height
        );
      }
    }
  }
}
