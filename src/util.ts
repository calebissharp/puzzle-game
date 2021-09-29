export function imageToBlob(image: HTMLImageElement) {
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

export function dot(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}

export function imageToDataUrl(image: ImageBitmap) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = image.width + 500;
  canvas.height = image.height + 500;
  ctx.drawImage(image, 0, 0);
  const dataURL = canvas.toDataURL("image/png");

  return dataURL;
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve) => {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.addEventListener("load", () => {
      resolve(img);
    });
    img.src = src;
  });
}

export function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

type TextureInfo = {
  width: number;
  height: number;
  texture: WebGLTexture;
};

// creates a texture info { width: w, height: h, texture: tex }
// The texture will start with 1x1 pixels and be updated
// when the image has loaded

export function loadImageAndCreateTextureInfo(
  gl: WebGLRenderingContext,
  url: string
): Promise<TextureInfo> {
  return new Promise((resolve) => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 255, 255])
    );

    // let's assume all images are not a power of 2
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    const textureInfo = {
      width: 1, // we don't know the size until it loads
      height: 1,
      texture: tex,
    };
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.addEventListener("load", function () {
      textureInfo.width = img.width;
      textureInfo.height = img.height;

      gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

      resolve(textureInfo);
    });
    img.src = url;
  });
}

export function clamp(min: number, max: number, n: number) {
  return Math.max(Math.min(max, n), min);
}

export function mulberry32(a: number) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
