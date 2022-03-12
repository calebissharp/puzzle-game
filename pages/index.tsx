import { useState } from "react";
import type { NextPage } from "next";
import Head from "next/head";

import Game from "../src/component/Game";
import ImageSelect from "../src/component/ImageSelect";

type GameInitialState = {
  image: HTMLImageElement;
  piecesX: number;
  piecesY: number;
  genNormals?: boolean;
  showPerf?: boolean;
};

const Home: NextPage = () => {
  const [gameOptions, setGameOptions] = useState<GameInitialState | null>(null);

  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {gameOptions ? (
        <Game
          image={gameOptions.image}
          piecesX={gameOptions.piecesX}
          piecesY={gameOptions.piecesY}
          genNormals={gameOptions.genNormals}
          showPerf={gameOptions.showPerf}
        />
      ) : (
        <ImageSelect
          onSubmit={({ image, piecesX, piecesY, genNormals, showPerf }) => {
            setGameOptions({ image, piecesX, piecesY, genNormals, showPerf });
          }}
        />
      )}
    </div>
  );
};

export default Home;
