import * as THREE from "three";
import * as Stats from "stats.js";

const PUZZLE_WIDTH = 32;
const PUZZLE_HEIGHT = 32;

const PIECE_WIDTH = 20;
const PIECE_HEIGHT = 20;

async function main() {
  const puzzleTexture = await new THREE.TextureLoader().loadAsync(
    new URL("../puzzles/store.jpg", import.meta.url).toString()
  );

  console.log(puzzleTexture.image.width);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    window.innerWidth / -2,
    window.innerWidth / 2,
    window.innerHeight / 2,
    window.innerHeight / -2,
    -1,
    1000
  );
  scene.add(camera);

  const pieces: THREE.Sprite[] = [];

  for (let i = 0; i < PUZZLE_HEIGHT; i++) {
    for (let j = 0; j < PUZZLE_HEIGHT; j++) {
      const imageWidth = puzzleTexture.image.width;
      const imageHeight = puzzleTexture.image.height;
      const x = i * PIECE_WIDTH;
      const y = j * PIECE_HEIGHT;

      const material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        map: puzzleTexture,
      });
      const geometry = new THREE.PlaneGeometry(PIECE_WIDTH, PIECE_WIDTH, 1, 1);

      const uvs = geometry.uv[0];
      uvs[0][0].set(0, h);
      uvs[0][1].set(0, 0);
      uvs[0][2].set(w, h);
      uvs[1][0].set(0, 0);
      uvs[1][1].set(w, 0);
      uvs[1][2].set(w, h);

      const plane = new THREE.Mesh(geometry, material);
      plane.position.set(i * PIECE_WIDTH, j * PIECE_HEIGHT, 1);

      scene.add(plane);

      // const sprite = new THREE.Sprite(material);
      // sprite.scale.set(PIECE_WIDTH, PIECE_HEIGHT, 1);
      // sprite.position.set(i * PIECE_WIDTH, j * PIECE_HEIGHT, 1);

      // scene.add(sprite);
      // pieces.push(sprite);
    }
  }

  let dragging = false;

  window.addEventListener("mousedown", () => {
    dragging = true;
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
  });

  window.addEventListener("mousemove", (e) => {
    if (dragging) {
      camera.position.add(
        new THREE.Vector3(-e.movementX, e.movementY, 0).divideScalar(
          camera.zoom
        )
      );
    }
  });

  window.addEventListener("wheel", (e) => {
    camera.zoom = THREE.MathUtils.clamp(
      camera.zoom + camera.zoom * -e.deltaY * 0.005,
      0.1,
      5
    );
    camera.updateProjectionMatrix();
  });

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const stats1 = new Stats();
  stats1.showPanel(0); // Panel 0 = fps
  stats1.dom.style.cssText = "position:absolute;top:0px;left:0px;";
  document.body.appendChild(stats1.dom);

  const stats2 = new Stats();
  stats2.showPanel(2); // Panel 2 = mb
  stats2.dom.style.cssText = "position:absolute;top:0px;left:80px;";
  document.body.appendChild(stats2.dom);

  function animate() {
    stats1.begin();
    stats2.begin();

    renderer.render(scene, camera);

    stats1.end();
    stats2.end();

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

main();
