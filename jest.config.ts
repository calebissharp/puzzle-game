import nextJest from "next/jest";
import type { Config } from "@jest/types";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config.InitialOptions = {
  verbose: true,
  testEnvironment: "jsdom",
};

export default createJestConfig(config);
