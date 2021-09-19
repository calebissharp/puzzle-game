import { Resources } from "../resources";
import { throttle, times } from "lodash";

const IMAGE_PADDING = 50;
const PUZZLE_WIDTH = 10;
const PUZZLE_HEIGHT = 10;

interface Camera {
  x: number;
  y: number;
  zoom: number;
}

async function main() {
  const canvas = document.querySelector<HTMLCanvasElement>("#game");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext("2d");

  const resources = new Resources();
  const image = resources.addImage(
    "store",
    new URL("../puzzles/store.jpg", import.meta.url).toString()
  );

  await resources.loadAll();

  let start, previousTimeStamp;
  let prevFpsTime = 0;
  let fps = 0;
  let frames = 0;
  let fpsInterval = 1000;
  let dragging = false;
  let camera: Camera = calculateCameraInitialPosition(ctx, image);
  const pieces: Piece[] = [];

  for (let j = 0; j < PUZZLE_WIDTH; j++) {
    for (let k = 0; k < PUZZLE_HEIGHT; k++) {
      pieces.push(new Piece(image, j, k));
    }
  }

  function render(timestamp) {
    if (start === undefined) {
      start = timestamp;
      previousTimeStamp = timestamp;
    }
    const elapsed = timestamp - start;
    const delta = timestamp - previousTimeStamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // FPS ------------
    frames++;

    if (timestamp >= prevFpsTime + fpsInterval) {
      fps = (frames * fpsInterval) / (timestamp - prevFpsTime);

      prevFpsTime = timestamp;
      frames = 0;
    }

    ctx.font = "20px sans-serif";

    ctx.fillStyle = "white";
    const message = `${fps.toFixed(0)} fps`;
    const text = ctx.measureText(message);
    ctx.fillText(
      message,
      canvas.width - text.width - 20,
      text.fontBoundingBoxAscent + 20
    );
    // /FPS ------------

    // camera.zoom = 0.1 + (elapsed % 3000) * 0.0001;

    // Draw pieces
    pieces.map((piece) => {
      piece.draw(ctx, camera);
      // piece.position.x += delta * (Math.random() - 0.5) * 0.5;
      // piece.position.y += delta * (Math.random() - 0.5) * 0.5;
    });

    ctx.strokeStyle = "red";
    ctx.lineWidth = 20 * camera.zoom;
    const radius = 400 * camera.zoom;

    ctx.beginPath();
    ctx.arc(
      camera.zoom * (100 - (camera.x + canvas.width)),
      100 - camera.y + canvas.height,
      radius,
      0,
      2 * Math.PI
    );
    ctx.stroke();

    ctx.strokeStyle = "green";
    ctx.beginPath();
    const [x, y] = project(camera, ctx, 0, 0);
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();

    previousTimeStamp = timestamp;

    window.requestAnimationFrame(render);
  }

  window.requestAnimationFrame(render);

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    camera = calculateCameraInitialPosition(ctx, image);
  });

  window.addEventListener("mousedown", () => {
    dragging = true;
  });

  window.addEventListener("mousemove", (e) => {
    if (dragging) {
      camera.x += e.movementX;
      camera.y += e.movementY;
    }
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
  });

  window.addEventListener("wheel", (e) => {
    camera.zoom = clamp(0.1, 1, camera.zoom - e.deltaY * 0.001);
    camera.x += camera.zoom / canvas.width;
    camera.y += camera.zoom / canvas.height;
  });
}

main();

class Piece {
  position = { x: 0, y: 0 };
  image: HTMLImageElement;
  j: number;
  k: number;
  sliceX: number;
  sliceY: number;
  sliceWidth: number;
  sliceHeight: number;

  constructor(image: HTMLImageElement, j: number, k: number) {
    this.image = image;
    this.j = j;
    this.k = k;

    this.sliceWidth = this.image.width / PUZZLE_WIDTH;
    this.sliceHeight = this.image.height / PUZZLE_HEIGHT;
    this.sliceX = this.sliceWidth * this.j;
    this.sliceY = this.image.height - this.sliceHeight * (this.k + 1);

    this.position.x = this.sliceWidth * this.j;
    this.position.y = -this.sliceHeight * (this.k + 1);
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera) {
    const imageWidth = this.sliceWidth * camera.zoom;
    const imageHeight = this.sliceHeight * camera.zoom;

    const [x, y] = project(camera, ctx, this.position.x, this.position.y);
    // const x = this.position.x * camera.zoom + camera.x;
    // const y = this.position.y * camera.zoom - camera.y;

    ctx.drawImage(
      this.image,
      this.sliceX,
      this.sliceY,
      this.sliceWidth,
      this.sliceHeight,
      x,
      y,
      imageWidth,
      imageHeight
    );
    ctx.strokeStyle = "red";

    ctx.beginPath();
    ctx.rect(x, y, imageWidth, imageHeight);
    ctx.stroke();

    ctx.font = `${camera.zoom * 180}px sans-serif`;

    ctx.fillStyle = "white";
    const message = `${this.j}, ${this.k}`;
    const text = ctx.measureText(message);
    ctx.fillText(
      message,
      x + (imageWidth - text.width) / 2,
      y + (imageHeight + text.fontBoundingBoxAscent) / 2
    );
  }
}

function calculateCameraInitialPosition(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement
): Camera {
  // const zoom =
  //   Math.min(ctx.canvas.width / image.width, ctx.canvas.height / image.height) -
  //   0.02;

  const zoom = 0.1;

  const imageWidth = image.width * zoom;
  const imageHeight = image.height * zoom;

  // const x = -(ctx.canvas.width - imageWidth) / 2;
  // const y = -(ctx.canvas.height - imageHeight) / 2;

  // const x = ctx.canvas.width / 2;
  // const y = ctx.canvas.height / 2;

  const x = 0;
  const y = 0;

  return { zoom, x, y };
}

function clamp(min: number, max: number, n: number) {
  return Math.min(Math.max(n, min), max);
}

function project(
  camera: Camera,
  ctx: CanvasRenderingContext2D,
  worldX,
  worldY
): [screenX: number, screnY: number] {
  const screenWidth = ctx.canvas.width;
  const screenHeight = ctx.canvas.height;

  // console.log(camera.x, camera.y);

  const screenX = worldX * camera.zoom + (camera.x + screenWidth / 2);
  const screenY = worldY * camera.zoom + (camera.y + screenHeight / 2);

  return [screenX, screenY];
}
