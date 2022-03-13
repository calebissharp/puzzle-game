import { drawNormal } from "../pieceGen";
import * as path from "path";
import * as fs from "fs";
import * as _ from "lodash";

const WIDTH = 90;

const data = new Uint8ClampedArray(
  fs
    .readFileSync(path.resolve(__dirname, "./data.txt"), "utf-8")
    .split(",")
    .map((s) => parseInt(s))
);

test("drawNormal", async () => {
  const newData = new Uint8ClampedArray([...data]);
  drawNormal(4, newData, WIDTH);

  expect(newData).toMatchSnapshot();
});

test("benchmark", () => {
  const iterations = 5;

  const times = [];

  const log = console.log;
  console.log = () => null;
  for (let i = 0; i < iterations; i++) {
    const newData = new Uint8ClampedArray([...data]);
    const p1 = performance.now();
    drawNormal(4, newData, 90);
    const p2 = performance.now();
    times.push(p2 - p1);
  }

  console.log = log;

  const min = _.min(times) ?? 0;
  const max = _.max(times) ?? 0;

  console.log(
    `Averaged ${_.mean(times).toFixed(
      2
    )}ms during ${iterations} iterations (min: ${min.toFixed(
      2
    )}ms | max: ${max.toFixed(2)}ms)`
  );
});
