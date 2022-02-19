import { mat4, vec3 } from "gl-matrix";
import { initShaderProgram } from "./render";

export class Rectangle {
  position = { x: 0, y: 0 };
  width: number;
  height: number;

  program: WebGLProgram;

  positionBuffer: WebGLBuffer;

  positionLocation: number;
  matrixLocation: WebGLUniformLocation;

  constructor(
    gl: WebGLRenderingContext,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    this.position = { x, y };
    this.width = width;
    this.height = height;
  }

  async load(gl: WebGLRenderingContext) {
    this.program = await initShaderProgram(gl, vsSource, fsSource);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    this.positionBuffer = positionBuffer;

    // Put a unit quad in the buffer
    var positions = [
      0, 0, 0, 1, 1, 0,

      1, 0, 0, 1, 1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    this.matrixLocation = gl.getUniformLocation(this.program, "u_matrix");
    this.positionLocation = gl.getAttribLocation(this.program, "a_position");
  }

  render(gl: WebGLRenderingContext, camera: mat4) {
    gl.useProgram(this.program);

    // Setup the attributes to pull data from our buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

    const matrix = mat4.create();
    mat4.translate(
      matrix,
      camera,
      vec3.fromValues(this.position.x, this.position.y, 0)
    );
    mat4.scale(matrix, matrix, vec3.fromValues(this.width, this.height, 1));

    // Set the matrix.
    gl.uniformMatrix4fv(this.matrixLocation, false, matrix);

    // draw the quad (2 triangles, 6 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}

const vsSource = `
attribute vec4 a_position;
 
uniform mat4 u_matrix;
 
varying vec2 v_texcoord;
 
void main() {
   gl_Position = u_matrix * a_position;
}
`;

const fsSource = `
precision mediump float;
 
 
void main() {
  gl_FragColor = vec4(0.329, 0.329, 0.329, 1.0);
}`;
