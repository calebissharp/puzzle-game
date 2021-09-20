import { chunk, flatten, reverse } from "lodash";
import { drawPoints } from "./curve";
import { imageToBlob, random } from "./util";

export type PieceTexture = {
  j: number;
  k: number;
  image: HTMLImageElement;
};

type CreatePuzzlePiecesOptions = {
  image: HTMLImageElement;
  puzzleWidth: number;
  puzzleHeight: number;
  drawBounds?: boolean;
  pieceBorder?: boolean;
};

export async function genPuzzlePieceTextures({
  image,
  puzzleWidth,
  puzzleHeight,
  drawBounds = false,
  pieceBorder = false,
}: CreatePuzzlePiecesOptions): Promise<PieceTexture[]> {
  const pieceWidth = image.width / puzzleWidth;
  const pieceHeight = image.height / puzzleHeight;

  const pieceImages: HTMLImageElement[] = [];

  const pieces: {
    pointsBottom?: number[];
    pointsRight?: number[];
    j: number;
    k: number;
    image: HTMLImageElement;
  }[] = Array.from({ length: puzzleHeight * puzzleWidth });

  for (let j = 0; j < puzzleWidth; j++) {
    for (let k = 0; k < puzzleHeight; k++) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;

      const MAX_JOINER_HEIGHT = Math.max(pieceWidth, pieceHeight) * 0.2;

      canvas.width = pieceWidth + MAX_JOINER_HEIGHT * 2;
      canvas.height = pieceHeight + MAX_JOINER_HEIGHT * 2;

      if (drawBounds) {
        // Draw piece bounds
        ctx.lineWidth = 5;
        ctx.strokeStyle = "blue";

        ctx.beginPath();
        ctx.rect(
          (canvas.width - pieceWidth) / 2,
          (canvas.height - pieceHeight) / 2,
          pieceWidth,
          pieceHeight
        );
        ctx.stroke();
      }

      const i = k * puzzleWidth + j;

      const pieceAbove = pieces[i - puzzleWidth];
      const pieceLeft = pieces[i - 1];

      const [pointsBottom, pointsRight] = drawPiece(
        ctx,
        canvas.width / 2,
        canvas.height / 2,
        pieceWidth,
        pieceHeight,
        k < puzzleHeight - 1,
        j < puzzleWidth - 1,
        MAX_JOINER_HEIGHT,
        pieceLeft?.pointsRight,
        pieceAbove?.pointsBottom,
        pieceBorder
      );

      ctx.drawImage(
        image,
        j * pieceWidth - MAX_JOINER_HEIGHT,
        k * pieceHeight - MAX_JOINER_HEIGHT,
        pieceWidth + MAX_JOINER_HEIGHT * 2,
        pieceHeight + MAX_JOINER_HEIGHT * 2,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const url = canvas.toDataURL("image/png");
      const pieceImage = new Image();
      pieceImage.width = canvas.width;
      pieceImage.height = canvas.height;
      pieceImage.src = url;
      pieceImages.push(pieceImage);

      pieces[i] = {
        pointsBottom,
        pointsRight,
        j,
        k,
        image: pieceImage,
      };
    }
  }

  return pieces.map((piece) => ({
    j: piece.j,
    k: piece.k,
    image: piece.image,
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
  leftPoints?: number[],
  topPoints?: number[],
  drawBorder?: boolean
) {
  // Given the center point of the piece (cx,cy) and the side length (s)
  // The single side "outy" design is below
  // Use this single design (with transforms/mirroring) to make all pieces
  const leftSide = (ctx.canvas.width - pieceWidth) / 2;
  const rightSide = leftSide + pieceWidth;
  const topSide = (ctx.canvas.height - pieceHeight) / 2;
  const bottomSide = ctx.canvas.height - MAX_JOINER_HEIGHT;

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

  ctx.lineWidth = 0;
  ctx.clip(path);

  if (drawBorder) {
    ctx.lineWidth = 10;
    ctx.strokeStyle = "white";
    ctx.stroke(path);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";

  return [drawBottom ? pointsBottom : null, drawRight ? pointsRight : null];
}
