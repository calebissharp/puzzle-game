import styles from "../../styles/Home.module.scss";
import GameControls from "./GameControls";
import { GameProvider } from "../game/GameProvider";
import GameLoader from "./GameLoader";

type GameProps = {
  image: HTMLImageElement;
  piecesX: number;
  piecesY: number;
  genNormals?: boolean;
};

const Game = ({ image, piecesX, piecesY, genNormals }: GameProps) => {
  return (
    <GameProvider
      piecesX={piecesX}
      piecesY={piecesY}
      genNormals={genNormals ?? false}
      imageUrl={image.src}
    >
      {(canvasProps) => (
        <div className={styles.gameContainer}>
          <GameLoader />

          <canvas {...canvasProps} className={styles.game} />

          <GameControls />
        </div>
      )}
    </GameProvider>
  );
};

export default Game;
