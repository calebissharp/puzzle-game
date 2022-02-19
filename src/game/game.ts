import { mat4, vec3 } from "gl-matrix";
import { shuffle } from "lodash";
import Stats from "stats.js";
import { Camera } from "./camera";
import { getPieceShaderProgram, getTextureInfo, Piece } from "./piece";
import { genPuzzlePieceTextures } from "./pieceGen";
import { Rectangle } from "./rectangle";
import { clamp, loadImage } from "./util";
import { EventEmitter } from "events";

export class PuzzleGame extends EventEmitter {
  gl: WebGLRenderingContext;

  PUZZLE_WIDTH: number;
  PUZZLE_HEIGHT: number;

  camera: Camera;

  imageUrl: string;
  image: HTMLImageElement | null = null;

  startTime: number = 0;
  elapsedTime: number = 0;
  lastTime: number = 0;

  dragging = false;

  pieces: Piece[] = [];
  /**
   * The piece currently being moved
   */
  activePiece?: Piece;

  background: Rectangle | null = null;

  stats: Stats;

  constructor(imageUrl: string, puzzleWidth: number, puzzleHeight: number) {
    super();

    this.PUZZLE_WIDTH = puzzleWidth;
    this.PUZZLE_HEIGHT = puzzleHeight;
    this.imageUrl = imageUrl;

    const canvas = document.querySelector<HTMLCanvasElement>("#game");

    if (!canvas) {
      throw new Error("Couldn't find canvas");
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const gl = canvas.getContext("webgl");
    if (!gl) {
      throw new Error("Failed to load WebGL context");

      return;
    }

    this.gl = gl;

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    this.camera = new Camera(this.gl.canvas.width, this.gl.canvas.height);

    this.stats = new Stats();
    this.stats.showPanel(0);

    window.addEventListener("resize", this.onResize.bind(this));
  }

  async load() {
    this.emit("loading", true);
    const program = getPieceShaderProgram(this.gl);

    this.image = await loadImage(this.imageUrl);

    this.camera.x = this.image.width / 2;
    this.camera.y = this.image.height / 2;
    this.camera.zoom = 5;
    this.camera.updateProjection(this.gl.canvas.width, this.gl.canvas.height);

    this.background = new Rectangle(
      this.gl,
      0,
      0,
      this.image.width,
      this.image.height
    );
    await this.background.load(this.gl);

    const pieceTextures = await genPuzzlePieceTextures({
      image: this.image,
      puzzleWidth: this.PUZZLE_WIDTH,
      puzzleHeight: this.PUZZLE_HEIGHT,
      pieceBorder: true,
    });

    for (let j = 0; j < this.PUZZLE_WIDTH; j++) {
      for (let k = 0; k < this.PUZZLE_HEIGHT; k++) {
        const pieceTexture = pieceTextures.find(
          (pt) => pt.j === j && pt.k === k
        );
        if (!pieceTexture) {
          throw new Error(`Could not find piece texture for piece ${j}, ${k}`);
        }

        const textureInfo = getTextureInfo(this.gl, pieceTexture.image);
        const bumpMap = getTextureInfo(this.gl, pieceTexture.bumpMap);
        this.pieces.push(
          new Piece({
            gl: this.gl,
            textureInfo,
            bumpMap,
            program,
            puzzleWidth: this.PUZZLE_WIDTH,
            puzzleHeight: this.PUZZLE_HEIGHT,
            puzzleImageWidth: this.image.width,
            puzzleImageHeight: this.image.height,
            imagePadding: pieceTexture.imagePadding,
            j,
            k,
          })
        );
      }
    }

    for (const piece of this.pieces) {
      // piece.locked = true;
    }

    this.scramblePieces(true);

    this.gl.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.gl.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.gl.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.gl.canvas.addEventListener("wheel", this.onWheel.bind(this));

    this.emit("loading", false);
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

    this.gl.clearColor(50 / 255, 50 / 255, 50 / 255, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.background?.render(this.gl, this.camera.projection);

    this.pieces.forEach((piece) => piece.draw(this.gl, this.camera));
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
      for (const attachedPiece of this.activePiece.attachedPieces) {
        // Check position of each piece in group
        attachedPiece.checkPosition(
          this.pieces.filter(
            (piece) => !attachedPiece.attachedPieces.has(piece)
          )
        );
      }

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

      if (clickedPiece && !clickedPiece.locked) {
        for (const piece of clickedPiece.attachedPieces) {
          const index = this.pieces.indexOf(piece);
          this.pieces.splice(index, 1);
          this.pieces.push(piece);
        }
        this.activePiece = clickedPiece;
      }
    }
  }

  onMouseMove(e: MouseEvent) {
    if (this.dragging) {
      const movementX = e.movementX / window.devicePixelRatio;
      const movementY = e.movementY / window.devicePixelRatio;

      if (this.activePiece) {
        // this.activePiece.position.x += e.movementX * this.camera.zoom;
        // this.activePiece.position.y += e.movementY * this.camera.zoom;
        this.activePiece.moveAllPos(
          movementX * this.camera.zoom,
          movementY * this.camera.zoom
        );
      } else {
        this.camera.x += -movementX * this.camera.zoom;
        this.camera.y += -movementY * this.camera.zoom;

        this.camera.updateProjection(
          this.gl.canvas.width,
          this.gl.canvas.height
        );
      }
    }
  }

  scramblePieces(shufflePos = true) {
    if (!this.image) {
      throw new Error("Cannot scramble pieces until image is loaded");
    }

    const allPositions = Array.from({
      length: this.PUZZLE_WIDTH * this.PUZZLE_HEIGHT,
    }).map((_, i) => i);

    const positions = shufflePos ? shuffle(allPositions) : allPositions;

    for (const [i, piece] of this.pieces.entries()) {
      const row = Math.floor(positions[i] / this.PUZZLE_WIDTH);

      const padding = 15;
      const width = piece.sliceWidth + padding;
      const height = piece.sliceHeight + padding;

      if (row > Math.ceil(this.PUZZLE_HEIGHT / 2)) {
        piece.position.y = -(row - Math.ceil(this.PUZZLE_HEIGHT / 2)) * height;
      } else {
        piece.position.y = this.image.height + row * height;
      }

      piece.position.x = positions[i] * width - width * this.PUZZLE_WIDTH * row;

      piece.locked = false;
    }
  }
}
