import { mat4, vec3, vec4 } from "gl-matrix";

const PUZZLE_WIDTH = 16;
const PUZZLE_HEIGHT = 16;

type TextureInfo = {
  width: number;
  height: number;
  texture: WebGLTexture;
};

type DrawInfo = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  xScale: number;
  yScale: number;
  textureInfo: TextureInfo;
};

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      "Unable to initialize the shader program: " +
        gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      "An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

const imageVsSource = `
attribute vec4 a_position;
attribute vec2 a_texcoord;
 
uniform mat4 u_matrix;
uniform mat4 u_textureMatrix;
 
varying vec2 v_texcoord;
 
void main() {
   gl_Position = u_matrix * a_position;
   v_texcoord = (u_textureMatrix * vec4(a_texcoord, 0, 1)).xy;
}`;

const imageFsSource = `
precision mediump float;
 
varying vec2 v_texcoord;
 
uniform sampler2D u_texture;
 
void main() {
   gl_FragColor = texture2D(u_texture, v_texcoord);
}`;

async function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector<HTMLCanvasElement>("#game");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  // setup GLSL program
  const program = initShaderProgram(gl, imageVsSource, imageFsSource);

  // look up where the vertex data needs to go.
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

  // lookup uniforms
  const matrixLocation = gl.getUniformLocation(program, "u_matrix");
  const textureLocation = gl.getUniformLocation(program, "u_texture");

  // Create a buffer.
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Put a unit quad in the buffer
  const positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Create a buffer for texture coords
  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

  // Put texcoords in the buffer
  const texcoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

  // creates a texture info { width: w, height: h, texture: tex }
  // The texture will start with 1x1 pixels and be updated
  // when the image has loaded
  function loadImageAndCreateTextureInfo(url: string): Promise<TextureInfo> {
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
      const img = new Image();
      img.addEventListener("load", function () {
        textureInfo.width = img.width;
        textureInfo.height = img.height;

        gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img
        );

        resolve(textureInfo);
      });
      img.src = url;
    });
  }

  const textureInfos = [
    await loadImageAndCreateTextureInfo(
      new URL("../puzzles/uv.jpg", import.meta.url).toString()
    ),
  ];

  const camera = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    zoom: 2,
  };
  let dragging = false;

  const pieces: Piece[] = [];

  for (let j = 0; j < PUZZLE_WIDTH; j++) {
    for (let k = 0; k < PUZZLE_HEIGHT; k++) {
      pieces.push(new Piece(gl, textureInfos[0], program, j, k));
    }
  }

  window.addEventListener("mousedown", (e) => {
    dragging = true;

    const projection = mat4.create();
    mat4.ortho(
      projection,
      camera.x - (gl.canvas.width / 2) * camera.zoom,
      camera.x + (gl.canvas.width / 2) * camera.zoom,
      camera.y + (gl.canvas.height / 2) * camera.zoom,
      camera.y - (gl.canvas.height / 2) * camera.zoom,
      -1,
      1
    );

    const pos = vec4.fromValues(e.screenX, e.screenY, 100, 0);

    vec4.transformMat4(pos, pos, projection);

    console.log(pos);
  });

  window.addEventListener("mouseup", (e) => {
    dragging = false;
  });

  window.addEventListener("mousemove", (e) => {
    if (dragging) {
      camera.x += -e.movementX * camera.zoom;
      camera.y += -e.movementY * camera.zoom;
    }
  });

  window.addEventListener("wheel", (e) => {
    camera.zoom = clamp(0.1, 3, camera.zoom + e.deltaY * 0.005);
  });

  function update(deltaTime: number) {
    pieces.forEach((piece) => piece.update(deltaTime));
  }

  function draw() {
    const width = gl.canvas.clientWidth | 0;
    const height = gl.canvas.clientHeight | 0;
    if (gl.canvas.width !== width || gl.canvas.height !== height) {
      gl.canvas.width = width;
      gl.canvas.height = height;
    }

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clear(gl.COLOR_BUFFER_BIT);

    const projection = mat4.create();
    mat4.ortho(
      projection,
      camera.x - (gl.canvas.width / 2) * camera.zoom,
      camera.x + (gl.canvas.width / 2) * camera.zoom,
      camera.y + (gl.canvas.height / 2) * camera.zoom,
      camera.y - (gl.canvas.height / 2) * camera.zoom,
      -1,
      1
    );
    pieces.forEach((piece) => piece.draw(gl, projection));
  }

  let then = 0;
  function render(time: number) {
    const now = time * 0.001;
    const deltaTime = Math.min(0.1, now - then);
    then = now;

    update(deltaTime);
    draw();

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
main();

function clamp(min: number, max: number, n: number) {
  return Math.max(Math.min(max, n), min);
}

class Piece {
  position = { x: 0, y: 0 };
  j: number;
  k: number;
  sliceX: number;
  sliceY: number;
  sliceWidth: number;
  sliceHeight: number;
  textureInfo: TextureInfo;
  program: WebGLProgram;
  positionBuffer: WebGLBuffer;
  texCoordBuffer: WebGLBuffer;

  positionLocation: number;
  texcoordLocation: number;
  matrixLocation: WebGLUniformLocation;
  textureMatrixLocation: WebGLUniformLocation;
  textureLocation: WebGLUniformLocation;

  constructor(
    gl: WebGLRenderingContext,
    textureInfo: TextureInfo,
    program: WebGLProgram,
    j: number,
    k: number
  ) {
    this.textureInfo = textureInfo;
    this.j = j;
    this.k = k;
    this.program = program;

    this.sliceWidth = this.textureInfo.width / PUZZLE_WIDTH;
    this.sliceHeight = this.textureInfo.height / PUZZLE_HEIGHT;
    this.sliceX = this.sliceWidth * this.j;
    this.sliceY = this.sliceHeight * this.k;

    this.position.x = this.sliceWidth * this.j;
    this.position.y = this.sliceHeight * this.k;

    // Create a buffer.
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    this.positionBuffer = positionBuffer;

    // Put a unit quad in the buffer
    var positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Create a buffer for texture coords
    const texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    this.texCoordBuffer = texcoordBuffer;

    // Put texcoords in the buffer
    var texcoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
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
    mat4.fromTranslation(
      texMatrix,
      vec3.fromValues(
        this.sliceX / this.textureInfo.width,
        this.sliceY / this.textureInfo.height,
        0
      )
    );
    mat4.scale(
      texMatrix,
      texMatrix,
      vec3.fromValues(
        this.sliceWidth / this.textureInfo.width,
        this.sliceHeight / this.textureInfo.height,
        1
      )
    );

    gl.uniformMatrix4fv(this.textureMatrixLocation, false, texMatrix);

    // Tell the shader to get the texture from texture unit 0
    gl.uniform1i(this.textureLocation, 0);

    // draw the quad (2 triangles, 6 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  update(delta: number) {}
}
