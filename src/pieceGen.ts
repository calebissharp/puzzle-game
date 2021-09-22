import { chunk, flatten, reverse } from "lodash";
import { drawPoints } from "./curve";
import { random } from "./util";

export type PieceTexture = {
  j: number;
  k: number;
  imagePadding: number;
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
  const pieceWidth = Math.ceil(image.width / puzzleWidth);
  const pieceHeight = Math.ceil(image.height / puzzleHeight);

  const MAX_JOINER_HEIGHT = Math.ceil(Math.max(pieceWidth, pieceHeight) * 0.2);

  const canvasWidth = Math.ceil(pieceWidth + MAX_JOINER_HEIGHT * 2);
  const canvasHeight = Math.ceil(pieceHeight + MAX_JOINER_HEIGHT * 2);

  const pieceImages: HTMLImageElement[] = [];

  const pieces: {
    pointsBottom?: number[];
    pointsRight?: number[];
    j: number;
    k: number;
    image: HTMLImageElement;
    imagePadding: number;
  }[] = Array.from({ length: puzzleHeight * puzzleWidth });

  for (let j = 0; j < puzzleWidth; j++) {
    for (let k = 0; k < puzzleHeight; k++) {
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

      const [pointsBottom, pointsRight] = drawPiece(
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

      ctx.lineWidth = 1;
      ctx.strokeStyle = "#828282";
      ctx.stroke();

      const url = canvas.toDataURL("image/png");
      const pieceImage = new Image();
      pieceImage.width = canvasWidth;
      pieceImage.height = canvasHeight;
      pieceImage.src = url;
      pieceImages.push(pieceImage);

      pieces[i] = {
        pointsBottom,
        pointsRight,
        j,
        k,
        image: pieceImage,
        imagePadding: MAX_JOINER_HEIGHT,
      };
    }
  }

  return pieces.map((piece) => ({
    j: piece.j,
    k: piece.k,
    image: piece.image,
    imagePadding: piece.imagePadding,
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
) {
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

  ctx.beginPath();

  const tension = 1;

  if (flippedLeftPoints) {
    const flippedLeftPointsRev = flatten(reverse(chunk(flippedLeftPoints, 2)));
    ctx.moveTo(flippedLeftPointsRev[0], flippedLeftPointsRev[1]);
    drawPoints(ctx, flippedLeftPointsRev, tension, false, 100);
  } else {
    ctx.moveTo(leftSide, bottomSide);
    if (flippedTopPoints) {
      ctx.lineTo(flippedTopPoints[0], flippedTopPoints[1]);
    } else {
      ctx.lineTo(leftSide, topSide);
    }
  }

  if (flippedTopPoints) {
    drawPoints(ctx, flippedTopPoints, tension, false, 100);
  } else {
    ctx.lineTo(pointsRight[0], pointsRight[1]);
  }

  if (drawRight) {
    drawPoints(ctx, pointsRight, tension, false, 100);
  } else {
    ctx.lineTo(rightSide, bottomSide);
  }

  if (drawBottom) {
    const bottomPointsRev = flatten(reverse(chunk(pointsBottom, 2)));
    drawPoints(ctx, bottomPointsRev, tension, false, 100);
  } else {
    if (drawRight) {
      ctx.lineTo(
        pointsRight[pointsRight.length - 2],
        pointsRight[pointsRight.length - 1]
      );
    } else {
      ctx.lineTo(rightSide, bottomSide);
    }
  }

  ctx.closePath();

  ctx.fill();

  return [drawBottom ? pointsBottom : null, drawRight ? pointsRight : null];
}
