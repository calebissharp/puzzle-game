import { chunk, flatten, reverse } from "lodash";

const PUZZLE_WIDTH = 38;
const PUZZLE_HEIGHT = 32;
const MAX_JOINER_HEIGHT = 40;

type PieceTexture = {
  j: number;
  k: number;
  image: HTMLImageElement;
};

export async function createPuzzlePieces(): Promise<PieceTexture[]> {
  const image = await loadImage(
    // "https://upload.wikimedia.org/wikipedia/commons/6/68/Joe_Biden_presidential_portrait.jpg"
    new URL("../puzzles/store.jpg", import.meta.url).toString()
  );

  const pieceWidth = image.width / PUZZLE_WIDTH;
  const pieceHeight = image.height / PUZZLE_HEIGHT;

  const bitmaps: ImageBitmap[] = [];

  const pieceImages: HTMLImageElement[] = [];

  const pieces: {
    pointsBottom?: number[];
    pointsRight?: number[];
    j: number;
    k: number;
    image: HTMLImageElement;
  }[] = Array.from({ length: PUZZLE_HEIGHT * PUZZLE_WIDTH });

  for (let j = 0; j < PUZZLE_WIDTH; j++) {
    for (let k = 0; k < PUZZLE_HEIGHT; k++) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = pieceWidth + MAX_JOINER_HEIGHT * 2;
      canvas.height = pieceHeight + MAX_JOINER_HEIGHT * 2;

      console.log(`generating piece image ${j}, ${k}`);

      ctx.lineWidth = 5;
      ctx.strokeStyle = "blue";

      // Draw piece bounds
      // ctx.beginPath();
      // ctx.rect(
      //   (canvas.width - pieceWidth) / 2,
      //   (canvas.height - pieceHeight) / 2,
      //   pieceWidth,
      //   pieceHeight
      // );
      // ctx.stroke();

      const i = k * PUZZLE_WIDTH + j;

      const pieceAbove = pieces[i - PUZZLE_WIDTH];
      const pieceLeft = pieces[i - 1];

      ctx.strokeStyle = "green";
      const [pointsBottom, pointsRight] = drawPiece(
        ctx,
        canvas.width / 2,
        canvas.height / 2,
        pieceWidth,
        pieceHeight,
        k < PUZZLE_HEIGHT - 1,
        j < PUZZLE_WIDTH - 1,
        pieceLeft?.pointsRight,
        pieceAbove?.pointsBottom
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

  // document.body.append(canvas);
  // const list = document.createElement("div");
  // list.className = "pieces-list";
  // list.append(...pieceImages);
  // document.body.append(list);
  // document.body.append(pieceImages[0]);
  // document.body.append(pieceImages[PUZZLE_WIDTH]);
  // document.body.append(pieceImages[0 + 1]);
  // document.body.append(pieceImages[PUZZLE_WIDTH + 1]);

  // test image
  // ctx.drawImage(pieceImages[9], 0, 0);

  // const url = await imageToDataUrl(imageBitmap);
  // const blob = await imageToBlob(bitmaps[4]);
  // const url = URL.createObjectURL(blob);

  // window.open(url, "__blank");

  // window.open(url);

  return pieces.map((piece) => ({
    j: piece.j,
    k: piece.k,
    image: piece.image,
  }));
}

function imageToDataUrl(image: ImageBitmap) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = image.width + 500;
  canvas.height = image.height + 500;
  ctx.drawImage(image, 0, 0);
  const dataURL = canvas.toDataURL("image/png");

  return dataURL;
}

function imageToBlob(image: ImageBitmap) {
  return new Promise<Blob>((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.height = image.height;
    canvas.width = image.width;
    ctx.drawImage(image, 0, 0);
    ctx.canvas.toBlob((blob) => {
      resolve(blob);
    });
  });
}

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.addEventListener("load", () => {
      resolve(img);
    });
    img.src = src;
    // if (img.complete || img.complete === undefined) {
    //   img.src =
    //     "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    //   img.src = src;
    // }
  });
}

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  pieceWidth: number,
  pieceHeight: number,
  drawBottom = true,
  drawRight = true,
  leftPoints?: number[],
  topPoints?: number[]
) {
  // ctx.globalCompositeOperation = "source-in";

  // Given the center point of the piece (cx,cy) and the side length (s)
  // The single side "outy" design is below
  // Use this single design (with transforms/mirroring) to make all pieces
  // ctx.scale(-1, 1);
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
  // const offsetX = 0;
  console.log(pieceWidth);

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
  // const offsetY = 0;

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

    pointsBottom[pointsBottom.length - 2],
    pointsBottom[pointsBottom.length - 1],
  ];

  const path = new Path2D();

  // const tension = pieceWidth * 0.003;
  const tension = 1;
  console.log("tension", tension);

  if (flippedLeftPoints) {
    // ctx.moveTo(flippedLeftPoints[0], flippedLeftPoints[1]);
    // drawPoints(ctx, flippedLeftPoints, 1, false, 200, false);

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
    const flippedTopPointsRev = flatten(reverse(chunk(flippedTopPoints, 2)));
    drawPoints(path, flippedTopPoints, tension, false, 100);
  } else {
    // ctx.moveTo(
    //   flippedLeftPoints ? flippedLeftPoints[0] : leftSide,
    //   flippedLeftPoints ? flippedLeftPoints[1] : topSide
    // );
    path.lineTo(pointsRight[0], pointsRight[1]);
  }

  if (drawRight) {
    drawPoints(path, pointsRight, tension, false, 100);
  } else {
    path.lineTo(rightSide, bottomSide);
  }

  if (drawBottom) {
    const bottomPointsRev = flatten(reverse(chunk(pointsBottom, 2)));
    // ctx.moveTo(pointsBottom[0], pointsBottom[1]);
    drawPoints(path, bottomPointsRev, tension, false, 100);
  }

  path.closePath();

  ctx.strokeStyle = "red";
  ctx.lineWidth = 4;
  // ctx.stroke(path);
  ctx.clip(path);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";

  return [drawBottom ? pointsBottom : null, drawRight ? pointsRight : null];
}

function drawPoints(
  ctx: Path2D,
  ptsa: number[],
  tension: number,
  isClosed: boolean,
  numOfSegments: number
) {
  // ctx.beginPath();

  drawLines(ctx, getCurvePoints(ptsa, tension, isClosed, numOfSegments));
}

function getCurvePoints(
  pts: number[],
  tension: number,
  isClosed: boolean,
  numOfSegments: number
) {
  // use input value if provided, or use a default value
  tension = typeof tension != "undefined" ? tension : 0.5;
  isClosed = isClosed ? isClosed : false;
  numOfSegments = numOfSegments ? numOfSegments : 16;

  var _pts = [],
    res = [], // clone array
    x,
    y, // our x,y coords
    t1x,
    t2x,
    t1y,
    t2y, // tension vectors
    c1,
    c2,
    c3,
    c4, // cardinal points
    st,
    t,
    i; // steps based on num. of segments

  // clone array so we don't change the original
  //
  _pts = pts.slice(0);

  // The algorithm require a previous and next point to the actual point array.
  // Check if we will draw closed or open curve.
  // If closed, copy end points to beginning and first points to end
  // If open, duplicate first points to befinning, end points to end
  if (isClosed) {
    _pts.unshift(pts[pts.length - 1]);
    _pts.unshift(pts[pts.length - 2]);
    _pts.unshift(pts[pts.length - 1]);
    _pts.unshift(pts[pts.length - 2]);
    _pts.push(pts[0]);
    _pts.push(pts[1]);
  } else {
    _pts.unshift(pts[1]); //copy 1. point and insert at beginning
    _pts.unshift(pts[0]);
    _pts.push(pts[pts.length - 2]); //copy last point and append
    _pts.push(pts[pts.length - 1]);
  }

  // ok, lets start..

  // 1. loop goes through point array
  // 2. loop goes through each segment between the 2 pts + 1e point before and after
  for (i = 2; i < _pts.length - 4; i += 2) {
    for (t = 0; t <= numOfSegments; t++) {
      // calc tension vectors
      t1x = (_pts[i + 2] - _pts[i - 2]) * tension;
      t2x = (_pts[i + 4] - _pts[i]) * tension;

      t1y = (_pts[i + 3] - _pts[i - 1]) * tension;
      t2y = (_pts[i + 5] - _pts[i + 1]) * tension;

      // calc step
      st = t / numOfSegments;

      // calc cardinals
      c1 = 2 * Math.pow(st, 3) - 3 * Math.pow(st, 2) + 1;
      c2 = -(2 * Math.pow(st, 3)) + 3 * Math.pow(st, 2);
      c3 = Math.pow(st, 3) - 2 * Math.pow(st, 2) + st;
      c4 = Math.pow(st, 3) - Math.pow(st, 2);

      // calc x and y cords with common control vectors
      x = c1 * _pts[i] + c2 * _pts[i + 2] + c3 * t1x + c4 * t2x;
      y = c1 * _pts[i + 1] + c2 * _pts[i + 3] + c3 * t1y + c4 * t2y;

      //store points in array
      res.push(x);
      res.push(y);
    }
  }

  return res;
}

function drawLines(ctx: Path2D, pts: number[]) {
  ctx.lineTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length - 1; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
}
