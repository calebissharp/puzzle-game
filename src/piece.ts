import { mat4, vec3 } from "gl-matrix";
import { PieceTexture } from "./pieceGen";
import { initShaderProgram, TextureInfo } from "./render";

type PieceOptions = {
  gl: WebGLRenderingContext;
  textureInfo: TextureInfo;
  program: WebGLProgram;
  puzzleWidth: number;
  puzzleHeight: number;
  puzzleImageWidth: number;
  puzzleImageHeight: number;
  imagePadding?: number;
  j: number;
  k: number;
};

export class Piece {
  position = { x: 0, y: 0 };
  correctPosition = { x: 0, y: 0 };
  scale = { x: 1, y: 1 };
  j: number;
  k: number;
  active: boolean = false;
  locked: boolean = false;
  sliceX: number;
  sliceY: number;
  sliceWidth: number;
  sliceHeight: number;
  imagePadding: number;

  textureInfo: TextureInfo;
  program: WebGLProgram;

  attachedPieces: Set<Piece> = new Set();

  positionBuffer: WebGLBuffer;
  texCoordBuffer: WebGLBuffer;

  positionLocation: number;
  texcoordLocation: number;
  matrixLocation: WebGLUniformLocation;
  textureMatrixLocation: WebGLUniformLocation;
  textureLocation: WebGLUniformLocation;

  constructor({
    gl,
    textureInfo,
    program,
    puzzleWidth,
    puzzleHeight,
    puzzleImageWidth,
    puzzleImageHeight,
    imagePadding = 0,
    j,
    k,
  }: PieceOptions) {
    this.textureInfo = textureInfo;
    this.j = j;
    this.k = k;
    this.program = program;

    const pieceBoundsWidth = puzzleImageWidth / puzzleWidth;
    const pieceBoundsHeight = puzzleImageHeight / puzzleHeight;

    this.sliceWidth = this.textureInfo.width;
    this.sliceHeight = this.textureInfo.height;
    this.sliceX = pieceBoundsWidth * this.j;
    this.sliceY = pieceBoundsHeight * this.k;

    this.attachedPieces.add(this);

    this.imagePadding = imagePadding;

    this.position.x = pieceBoundsWidth * this.j - imagePadding;
    this.position.y = pieceBoundsHeight * this.k - imagePadding;
    this.correctPosition.x = this.position.x;
    this.correctPosition.y = this.position.y;

    // Create a buffer.
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    this.positionBuffer = positionBuffer;

    // Put a unit quad in the buffer
    var positions = [
      0, 0, 0, 1, 1, 0,

      1, 0, 0, 1, 1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Create a buffer for texture coords
    const texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    this.texCoordBuffer = texcoordBuffer;

    // Put texcoords in the buffer
    var texcoords = [
      0, 0, 0, 1, 1, 0,

      1, 0, 0, 1, 1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

    // look up where the vertex data needs to go.
    this.positionLocation = gl.getAttribLocation(this.program, "a_position");
    this.texcoordLocation = gl.getAttribLocation(this.program, "a_texcoord");

    // lookup uniforms
    this.matrixLocation = gl.getUniformLocation(this.program, "u_matrix");
    this.textureMatrixLocation = gl.getUniformLocation(
      program,
      "u_textureMatrix"
    );
    this.textureLocation = gl.getUniformLocation(this.program, "u_texture");
  }

  draw(gl: WebGLRenderingContext, camera: mat4) {
    gl.bindTexture(gl.TEXTURE_2D, this.textureInfo.texture);

    // Tell WebGL to use our shader program pair
    gl.useProgram(this.program);

    // Setup the attributes to pull data from our buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.enableVertexAttribArray(this.texcoordLocation);
    gl.vertexAttribPointer(this.texcoordLocation, 2, gl.FLOAT, false, 0, 0);

    // this matrix will convert from pixels to clip space
    const matrix = mat4.create();

    // this matrix will translate our quad to dstX, dstY
    mat4.translate(
      matrix,
      camera,
      vec3.fromValues(this.position.x, this.position.y, 0)
    );

    // this matrix will scale our 1 unit quad
    // from 1 unit to texWidth, texHeight units
    mat4.scale(
      matrix,
      matrix,
      vec3.fromValues(this.sliceWidth, this.sliceHeight, 1)
    );

    // Set the matrix.
    gl.uniformMatrix4fv(this.matrixLocation, false, matrix);

    const texMatrix = mat4.create();

    gl.uniformMatrix4fv(this.textureMatrixLocation, false, texMatrix);

    // Tell the shader to get the texture from texture unit 0
    gl.uniform1i(this.textureLocation, 0);

    // draw the quad (2 triangles, 6 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  jiggle() {
    this.position.x += (Math.random() - 0.5) * 10;
    this.position.y += (Math.random() - 0.5) * 10;
  }

  update(delta: number, elapsed: number) {
    if (!this.locked) {
      // this.jiggle();
    }
  }

  checkPosition(otherPieces: Piece[]) {
    const thresholdX = this.sliceWidth * 0.2;
    const thresholdY = this.sliceHeight * 0.2;

    const isCorrect =
      Math.abs(this.position.x - this.correctPosition.x) < thresholdX &&
      Math.abs(this.position.y - this.correctPosition.y) < thresholdY;

    if (isCorrect) {
      this.position.x = this.correctPosition.x;
      this.position.y = this.correctPosition.y;
      this.locked = true;

      for (const attachedPiece of this.attachedPieces) {
        attachedPiece.position.x = attachedPiece.correctPosition.x;
        attachedPiece.position.y = attachedPiece.correctPosition.y;
        attachedPiece.locked = true;
      }
    }

    // check right side
    const rightPiece = otherPieces.find(
      (piece) =>
        piece.j === this.j + 1 &&
        piece.k === this.k &&
        Math.abs(this.bounds.right - piece.bounds.left) < thresholdX &&
        Math.abs(this.centerY - piece.centerY) < thresholdY
    );

    // check left side
    const leftPiece = otherPieces.find(
      (piece) =>
        piece.j === this.j - 1 &&
        piece.k === this.k &&
        Math.abs(this.bounds.left - piece.bounds.right) < thresholdX &&
        Math.abs(this.centerY - piece.centerY) < thresholdY
    );

    // check bottom side
    const bottomPiece = otherPieces.find(
      (piece) =>
        piece.j === this.j &&
        piece.k === this.k + 1 &&
        Math.abs(this.bounds.bottom - piece.bounds.top) < thresholdX &&
        Math.abs(this.centerX - piece.centerX) < thresholdY
    );

    // check top side
    const topPiece = otherPieces.find(
      (piece) =>
        piece.j === this.j &&
        piece.k === this.k - 1 &&
        Math.abs(this.bounds.top - piece.bounds.bottom) < thresholdX &&
        Math.abs(this.centerX - piece.centerX) < thresholdY
    );

    if (rightPiece) {
      this.setAllPos(
        rightPiece.bounds.left - this.bounds.width - this.imagePadding,
        rightPiece.position.y
      );

      this.attachedPieces = new Set([
        ...this.attachedPieces,
        ...rightPiece.attachedPieces,
      ]);
    } else if (leftPiece) {
      this.setAllPos(
        leftPiece.bounds.left + this.bounds.width - this.imagePadding,
        leftPiece.position.y
      );

      this.attachedPieces = new Set([
        ...this.attachedPieces,
        ...leftPiece.attachedPieces,
      ]);
    } else if (topPiece) {
      this.setAllPos(
        topPiece.position.x,
        topPiece.bounds.top + this.bounds.height - this.imagePadding
      );

      this.attachedPieces = new Set([
        ...this.attachedPieces,
        ...topPiece.attachedPieces,
      ]);
    } else if (bottomPiece) {
      this.setAllPos(
        bottomPiece.position.x,
        bottomPiece.bounds.top - this.bounds.height - this.imagePadding
      );

      this.attachedPieces = new Set([
        ...this.attachedPieces,
        ...bottomPiece.attachedPieces,
      ]);
    }

    for (const attachedPiece of this.attachedPieces) {
      attachedPiece.attachedPieces = this.attachedPieces;
    }

    return isCorrect;
  }

  get bounds() {
    return {
      left: this.position.x + this.imagePadding,
      right: this.position.x + this.sliceWidth - this.imagePadding,
      top: this.position.y + this.imagePadding,
      bottom: this.position.y + this.sliceHeight - this.imagePadding,
      width: this.sliceWidth - this.imagePadding * 2,
      height: this.sliceHeight - this.imagePadding * 2,
    };
  }

  get centerX() {
    return this.position.x + this.sliceWidth / 2;
  }

  get centerY() {
    return this.position.y + this.sliceHeight / 2;
  }

  moveAllPos(deltaX: number, deltaY: number) {
    for (const attachedPiece of this.attachedPieces) {
      attachedPiece.position.x += deltaX;
      attachedPiece.position.y += deltaY;
    }
  }

  setAllPos(x: number, y: number) {
    const deltaX = x - this.position.x;
    const deltaY = y - this.position.y;

    for (const attachedPiece of this.attachedPieces) {
      if (attachedPiece === this) {
        this.position.x = x;
        this.position.y = y;
      } else {
        attachedPiece.position.x += deltaX;
        attachedPiece.position.y += deltaY;
      }
    }
  }
}

export function getTextureInfo(
  gl: WebGLRenderingContext,
  pieceTexture: PieceTexture
): TextureInfo {
  const tex = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pieceTexture.image
  );

  // let's assume all images are not a power of 2
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  const textureInfo = {
    width: pieceTexture.image.width, // we don't know the size until it loads
    height: pieceTexture.image.height,
    texture: tex,
  };

  return textureInfo;
}

export function getPieceShaderProgram(gl: WebGLRenderingContext) {
  const pieceVsSource = `
attribute vec4 a_position;
attribute vec2 a_texcoord;
 
uniform mat4 u_matrix;
uniform mat4 u_textureMatrix;
 
varying vec2 v_texcoord;
 
void main() {
   gl_Position = u_matrix * a_position;
   v_texcoord = (u_textureMatrix * vec4(a_texcoord, 0, 1)).xy;
}`;

  const pieceFsSource = `
precision mediump float;
 
varying vec2 v_texcoord;
 
uniform sampler2D u_texture;
 
void main() {
  vec4 texColor = texture2D(u_texture, v_texcoord);

  if(texColor.a < 0.5)
    discard;

  gl_FragColor = texColor;
}`;

  const program = initShaderProgram(gl, pieceVsSource, pieceFsSource);

  return program;
}
