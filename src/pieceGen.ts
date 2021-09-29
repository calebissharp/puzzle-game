import { chunk, flatten, mean, min, reverse, sum } from "lodash";
import { drawPoints } from "./curve";
import { loadImage, random } from "./util";
import bumpMapUrl from "../puzzles/10641-normal.jpg";
import { vec2, vec3 } from "gl-matrix";

export type PieceTexture = {
  j: number;
  k: number;
  imagePadding: number;
  image: HTMLImageElement;
  bumpMap: HTMLImageElement;
};

type CreatePuzzlePiecesOptions = {
  image: HTMLImageElement;
  puzzleWidth: number;
  puzzleHeight: number;
  drawBounds?: boolean;
  pieceBorder?: boolean;
};

function rescale(
  n: number,
  nMin: number,
  nMax: number,
  rMin: number,
  rMax: number
) {
  return ((n - nMin) / (nMax - nMin)) * (rMax - rMin) + rMin;
}

function rotVec(vector: vec3, axis: vec3, rad: number) {
  const result = vec3.create();

  const a = vec3.create();
  const b = vec3.create();
  const c = vec3.create();

  vec3.scale(a, vector, Math.cos(rad));

  vec3.cross(b, axis, vector);
  vec3.scale(b, b, Math.sin(rad));

  const c1 = vec3.dot(axis, vector) * (1 - Math.cos(rad));
  vec3.scale(c, axis, c1);

  vec3.add(result, a, b);
  vec3.add(result, result, c);

  return result;
}

function meanVec(vectors: (vec2 | vec3)[]) {
  const x = mean(vectors.map((v) => v[0]));
  const y = mean(vectors.map((v) => v[1]));
  const z = mean(vectors.map((v) => v[2]));

  return vec3.fromValues(x, y, z);
}

const INITIAL_Z = -0.5;

export function drawNormal(
  iterations: number,
  data: Uint8ClampedArray,
  width: number,
  height: number
) {
  let vectors: (vec3 | null)[] = Array.from({ length: data.length / 4 }).map(
    () => null
  );
  let borderPixels = Array.from({ length: data.length / 4 }).map(() => false);

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 255) continue;
    const alphaThres = 255;

    const left = data[i - 1] < alphaThres;
    const above = data[i - width * 4 + 3] < alphaThres;
    const below = data[i + width * 4 + 3] < alphaThres;
    const right = data[i + 7] < alphaThres;

    const isNextToAlpha = left || above || below || right;
    let angle = null;

    if (left && above && below) angle = 180;
    else if (left && above && right) angle = 90;
    else if (left && below && right) angle = 270;
    else if (above && below && right) angle = 0;
    else if (left && below) angle = 225;
    else if (right && below) angle = 315;
    else if (left && above) angle = 135;
    else if (right && above) angle = 45;
    else if (below) angle = 270;
    else if (left) angle = 180;
    else if (right) angle = 0;
    else if (above) angle = 90;

    if (isNextToAlpha) {
      const angleRad = angle * (Math.PI / 180);
      const vector = vec3.fromValues(
        Math.cos(angleRad),
        Math.sin(angleRad),
        INITIAL_Z
      );
      vec3.normalize(vector, vector);
      vectors[i / 4] = vector;

      const x = vector[0];
      const y = vector[1];
      // const z = vector[2];
      const z = INITIAL_Z;

      data[i] = rescale(x, -1, 1, 0, 255);
      data[i + 1] = rescale(y, -1, 1, 0, 255);
      data[i + 2] = rescale(z, 0, -1, 128, 255);

      borderPixels[i / 4] = true;
    }
  }

  // Smooth initial normals based on surrounding normals
  for (let step = 0; step < 5; step++) {
    let newVectors = [...vectors];

    for (let i = 0; i <= vectors.length; i++) {
      const angle = vectors[i];
      if (angle === null || angle === undefined) continue;

      const adjacentVectors = [
        vectors[i + 1], // right
        vectors[i - 1], // left
        vectors[i - width], // above
        vectors[i + width], // below
        vectors[i - width - 1], // top-left
        vectors[i - width + 1], // top-right
        vectors[i + width - 1], // bottom-left
        vectors[i + width + 1], // bottom-right
      ].filter((a) => a !== undefined && a !== null);

      if (adjacentVectors.length > 0) {
        const newVector = meanVec([angle, ...adjacentVectors]);

        vec3.normalize(newVector, newVector);
        newVectors[i] = newVector;
        const x = newVector[0];
        const y = newVector[1];
        const z = INITIAL_Z;

        data[i * 4] = rescale(x, -1, 1, 0, 255);
        data[i * 4 + 1] = rescale(y, -1, 1, 0, 255);
        data[i * 4 + 2] = rescale(z, 0, -1, 128, 255);
      }
    }

    vectors = [...newVectors];
  }

  let rotateStep = (Math.PI / 2 / iterations) * (-1 - INITIAL_Z);

  for (let n = 0; n <= iterations - 1; n++) {
    let newBorderPixels = [...borderPixels];
    let newVectors = [...vectors];

    for (let i = 0; i < data.length; i += 4) {
      const right = borderPixels[i / 4 + 1];
      const above = borderPixels[i / 4 - width];
      const below = borderPixels[i / 4 + width];
      const left = borderPixels[i / 4 - 1];

      const adjacentVectors = [
        vectors[i / 4 + 1],
        vectors[i / 4 - 1],
        vectors[i / 4 - width],
        vectors[i / 4 + width],
        vectors[i / 4 - width - 1], // top-left
        vectors[i / 4 - width + 1], // top-right
        vectors[i / 4 + width - 1], // bottom-left
        vectors[i / 4 + width + 1], // bottom-right
      ].filter((a) => a !== undefined && a !== null);

      const isNextToBorder = left || above || below || right;

      if (
        !borderPixels[i / 4] &&
        isNextToBorder &&
        data[i + 3] === 255 &&
        adjacentVectors.length > 0
      ) {
        let newVector = meanVec(adjacentVectors);
        newVector[2] = INITIAL_Z;

        const tangent = vec3.create();
        vec3.copy(tangent, newVector);
        tangent[2] = 0;
        vec3.normalize(tangent, tangent);
        vec3.rotateZ(tangent, tangent, vec3.fromValues(0, 0, 0), Math.PI / 2);
        vec3.normalize(tangent, tangent);

        // Rotate vector about tangent axis face it towards the viewer
        newVector = rotVec(newVector, tangent, -rotateStep * n);

        vec3.normalize(newVector, newVector);
        newVectors[i / 4] = newVector;
        const x = newVector[0];
        const y = newVector[1];
        const z = newVector[2];

        data[i] = rescale(x, -1, 1, 0, 255);
        data[i + 1] = rescale(y, -1, 1, 0, 255);
        data[i + 2] = rescale(z, 0, -1, 128, 255);

        newBorderPixels[i / 4] = true;
      }
    }

    if (newBorderPixels.length === 0) return;

    vectors = [...newVectors];

    borderPixels = [...newBorderPixels];
  }

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 255 && vectors[i / 4] === null) {
      vectors[i / 4] = vec3.fromValues(0, 0, -1);
      data[i] = 128;
      data[i + 1] = 128;
      data[i + 2] = 255;
    }
  }

  // Smooth normals
  for (let step = 0; step < 10; step++) {
    let newVectors = [...vectors];

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 255) continue;

      const adjacentVectors = [
        vectors[i / 4 + 1],
        vectors[i / 4 - 1],
        vectors[i / 4 - width],
        vectors[i / 4 + width],
        vectors[i / 4 - width - 1], // top-left
        vectors[i / 4 - width + 1], // top-right
        vectors[i / 4 + width - 1], // bottom-left
        vectors[i / 4 + width + 1], // bottom-right
      ].filter((a) => a !== undefined && a !== null);

      if (adjacentVectors.length > 0) {
        const newVector = meanVec(adjacentVectors);

        vec3.normalize(newVector, newVector);
        newVectors[i / 4] = newVector;
        const x = newVector[0];
        const y = newVector[1];
        const z = newVector[2];

        data[i] = rescale(x, -1, 1, 0, 255);
        data[i + 1] = rescale(y, -1, 1, 0, 255);
        data[i + 2] = rescale(z, 0, -1, 128, 255);
      }
    }

    vectors = [...newVectors];
  }
}

export async function genPuzzlePieceTextures({
  image,
  puzzleWidth,
  puzzleHeight,
  drawBounds = false,
  pieceBorder = false,
}: CreatePuzzlePiecesOptions): Promise<PieceTexture[]> {
  const pieceWidth = Math.ceil(image.width / puzzleWidth);
  const pieceHeight = Math.ceil(image.height / puzzleHeight);

  const MAX_JOINER_HEIGHT = Math.ceil(Math.max(pieceWidth, pieceHeight) * 0.2);

  const canvasWidth = Math.ceil(pieceWidth + MAX_JOINER_HEIGHT * 2);
  const canvasHeight = Math.ceil(pieceHeight + MAX_JOINER_HEIGHT * 2);

  const bumpMap = await loadImage(bumpMapUrl);

  const pieceImages: HTMLImageElement[] = [];

  const pieces: {
    pointsBottom?: number[];
    pointsRight?: number[];
    j: number;
    k: number;
    image: HTMLImageElement;
    bump: HTMLImageElement;
    imagePadding: number;
  }[] = Array.from({ length: puzzleHeight * puzzleWidth });

  const diffuseTimes = [];
  const normalTimes = [];

  for (let j = 0; j < puzzleWidth; j++) {
    for (let k = 0; k < puzzleHeight; k++) {
      const p1 = performance.now();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (drawBounds) {
        // Draw piece bounds
        ctx.lineWidth = 5;
        ctx.strokeStyle = "blue";

        ctx.beginPath();
        ctx.rect(
          (canvasWidth - pieceWidth) / 2,
          (canvasHeight - pieceHeight) / 2,
          pieceWidth,
          pieceHeight
        );
        ctx.stroke();
      }

      const i = k * puzzleWidth + j;

      const pieceAbove = pieces[i - puzzleWidth];
      const pieceLeft = pieces[i - 1];

      const [pointsBottom, pointsRight, path] = drawPiece(
        ctx,
        canvasWidth / 2,
        canvasHeight / 2,
        pieceWidth,
        pieceHeight,
        k < puzzleHeight - 1,
        j < puzzleWidth - 1,
        MAX_JOINER_HEIGHT,
        canvasWidth,
        canvasHeight,
        pieceLeft?.pointsRight,
        pieceAbove?.pointsBottom,
        pieceBorder
      );

      ctx.globalCompositeOperation = "source-in";

      ctx.drawImage(
        image,
        j * pieceWidth - MAX_JOINER_HEIGHT,
        k * pieceHeight - MAX_JOINER_HEIGHT,
        pieceWidth + MAX_JOINER_HEIGHT * 2,
        pieceHeight + MAX_JOINER_HEIGHT * 2,
        0,
        0,
        canvasWidth,
        canvasHeight
      );

      ctx.globalCompositeOperation = "source-over";

      // ctx.lineWidth = 1;
      // ctx.strokeStyle = "#828282";
      // ctx.stroke();

      const url = canvas.toDataURL("image/png");
      const pieceImage = document.createElement("img");
      pieceImage.width = canvasWidth;
      pieceImage.height = canvasHeight;
      pieceImage.src = url;
      pieceImages.push(pieceImage);

      const p2 = performance.now();
      diffuseTimes.push(p2 - p1);

      const bumpCanvas = document.createElement("canvas");
      const bctx = bumpCanvas.getContext("2d");
      bumpCanvas.width = canvasWidth;
      bumpCanvas.height = canvasHeight;

      bctx.rect(0, 0, canvasWidth, canvasHeight);
      bctx.fillStyle = `rgb(128,128,255)`;
      // bctx.fillStyle = `rgb(0,255,0)`;
      bctx.fill(path);

      const borderPixels: number[] = [];

      let imageData = bctx.getImageData(0, 0, canvasWidth, canvasHeight);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) data[i + 3] = 255;
      }

      drawBorder(Math.ceil(pieceWidth * 0.05), data, canvasWidth, canvasHeight);

      bctx.putImageData(imageData, 0, 0);

      const bumpUrl = bumpCanvas.toDataURL("image/png");
      const bumpMap = new Image();
      bumpMap.width = bumpCanvas.width;
      bumpMap.height = bumpCanvas.height;
      bumpMap.src = bumpUrl;

      normalTimes.push(performance.now() - p2);

      pieces[i] = {
        pointsBottom,
        pointsRight,
        j,
        k,
        image: pieceImage,
        bump: bumpMap,
        imagePadding: MAX_JOINER_HEIGHT,
      };
    }
  }

  console.log(
    `Took ${sum(diffuseTimes).toFixed(0)}ms to generate textures (${mean(
      diffuseTimes
    ).toFixed(1)}ms/image)`
  );
  console.log(
    `Took ${sum(normalTimes).toFixed(0)}ms to generate normal maps (${mean(
      normalTimes
    ).toFixed(1)}ms/image)`
  );

  return pieces.map((piece) => ({
    j: piece.j,
    k: piece.k,
    image: piece.image,
    imagePadding: piece.imagePadding,
    bumpMap: piece.bump,
  }));
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  pieceWidth: number,
  pieceHeight: number,
  drawBottom = true,
  drawRight = true,
  MAX_JOINER_HEIGHT: number,
  canvasWidth: number,
  canvasHeight: number,
  leftPoints?: number[],
  topPoints?: number[],
  drawBorder?: boolean
): [number[] | null, number[] | null, Path2D] {
  const leftSide = (canvasWidth - pieceWidth) / 2;
  const rightSide = leftSide + pieceWidth;
  const topSide = (canvasHeight - pieceHeight) / 2;
  const bottomSide = canvasHeight - MAX_JOINER_HEIGHT;

  const flippedLeftPoints = leftPoints?.map((p, i) => {
    // x coord
    if (i % 2 === 0) return p - pieceWidth;
    return p;
  });

  const flippedTopPoints = topPoints?.map((p, i) => {
    // y coord
    if (i % 2 === 1) return p - pieceHeight;
    return p;
  });

  const offsetX = random(-(pieceWidth / 2) * 0.3, (pieceWidth / 2) * 0.3);

  const smallVariationX = pieceWidth * 0.05;
  const smallVariationY = pieceHeight * 0.05;

  const pointsBottom = [
    leftPoints ? leftPoints[leftPoints.length - 2] - pieceWidth : leftSide,
    leftPoints ? leftPoints[leftPoints.length - 1] : bottomSide,

    cx + pieceWidth * -0.2 + offsetX,
    cy + pieceHeight * 0.4 + random(-smallVariationY, smallVariationY),

    cx + pieceWidth * -0.15 + offsetX,
    bottomSide * 1 + MAX_JOINER_HEIGHT / 2,
    cx + pieceWidth * 0.15 + offsetX,
    bottomSide * 1 + MAX_JOINER_HEIGHT / 2,

    cx + pieceWidth * 0.2 + offsetX,
    cy + pieceHeight * 0.4 + random(-smallVariationY, smallVariationY),

    drawRight && drawBottom
      ? leftSide + pieceWidth + random(-smallVariationX, smallVariationX)
      : leftSide + pieceWidth,
    bottomSide + random(-smallVariationY, smallVariationY),
  ];

  const offsetY = random(-(pieceHeight / 2) * 0.3, (pieceHeight / 2) * 0.3);

  const pointsRight = [
    topPoints
      ? topPoints[topPoints.length - 2]
      : rightSide + random(-smallVariationX, smallVariationX),
    topPoints ? topPoints[topPoints.length - 1] - pieceHeight : topSide,

    cx + pieceWidth * 0.45 + random(-smallVariationX, smallVariationX),
    cy + pieceHeight * -0.15 + offsetY,

    cx + pieceWidth * 0.55 + MAX_JOINER_HEIGHT / 2,
    cy + pieceHeight * -0.15 + offsetY,
    cx + pieceWidth * 0.55 + MAX_JOINER_HEIGHT / 2,
    cy + pieceHeight * 0.15 + offsetY,

    cx + pieceWidth * 0.45 + random(-smallVariationX, smallVariationX),
    cy + pieceHeight * 0.15 + offsetY,

    drawBottom ? pointsBottom[pointsBottom.length - 2] : rightSide,
    drawBottom ? pointsBottom[pointsBottom.length - 1] : bottomSide,
  ];

  const path = new Path2D();
  // ctx.beginPath();

  const tension = 1;

  if (flippedLeftPoints) {
    const flippedLeftPointsRev = flatten(reverse(chunk(flippedLeftPoints, 2)));
    path.moveTo(flippedLeftPointsRev[0], flippedLeftPointsRev[1]);
    drawPoints(path, flippedLeftPointsRev, tension, false, 100);
  } else {
    path.moveTo(leftSide, bottomSide);
    if (flippedTopPoints) {
      path.lineTo(flippedTopPoints[0], flippedTopPoints[1]);
    } else {
      path.lineTo(leftSide, topSide);
    }
  }

  if (flippedTopPoints) {
    drawPoints(path, flippedTopPoints, tension, false, 100);
  } else {
    path.lineTo(pointsRight[0], pointsRight[1]);
  }

  if (drawRight) {
    drawPoints(path, pointsRight, tension, false, 100);
  } else {
    path.lineTo(rightSide, bottomSide);
  }

  if (drawBottom) {
    const bottomPointsRev = flatten(reverse(chunk(pointsBottom, 2)));
    drawPoints(path, bottomPointsRev, tension, false, 100);
  } else {
    if (drawRight) {
      path.lineTo(
        pointsRight[pointsRight.length - 2],
        pointsRight[pointsRight.length - 1]
      );
    } else {
      path.lineTo(rightSide, bottomSide);
    }
  }

  path.closePath();

  ctx.fill(path);

  return [
    drawBottom ? pointsBottom : null,
    drawRight ? pointsRight : null,
    path,
  ];
}
