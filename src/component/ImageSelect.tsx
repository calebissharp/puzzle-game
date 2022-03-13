import React, { useRef, useState } from "react";
import { Button, styled } from "@nextui-org/react";
import { getPuzzleDimensions, loadImage } from "../game/util";
import { useAppDispatch, useAppSelector } from "../hook/store";
import { setShowPerfStats } from "../game/slice";

type ImageSelectProps = {
  onSubmit: (values: {
    image: HTMLImageElement;
    piecesX: number;
    piecesY: number;
    genNormals: boolean;
  }) => void;
};

export default function ImageSelect({ onSubmit }: ImageSelectProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [genNormals, setGenNormals] = useState(true);
  const dispatch = useAppDispatch();

  const showPerf = useAppSelector((state) => state.game.showPerfStats);

  const [selectedPieceOption, setSelectedPieceOption] = useState(0);

  const piecesOptions =
    image?.width && image?.height
      ? [
          getPuzzleDimensions(image.width, image.height, 250),
          getPuzzleDimensions(image.width, image.height, 500),
          getPuzzleDimensions(image.width, image.height, 1000),
        ]
      : null;

  return (
    <div>
      <Input
        type="file"
        accept="image/png, image/jpeg"
        multiple={false}
        ref={inputRef}
        onChange={async (e) => {
          const file = e.target.files?.[0];

          if (file) {
            const image = await loadImage(URL.createObjectURL(file));
            setImage(image);
          }
        }}
      />
      <Button
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        Choose image
      </Button>

      <label>
        Generate normals
        <input
          type="checkbox"
          checked={genNormals}
          onChange={(e) => {
            setGenNormals(e.target.checked);
          }}
        />
      </label>

      <label>
        Show performance stats
        <input
          type="checkbox"
          checked={showPerf}
          onChange={(e) => {
            dispatch(setShowPerfStats(e.target.checked));
          }}
        />
      </label>

      {image && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Image src={image.src} alt="Image preview" />
        </div>
      )}

      {piecesOptions && (
        <select
          onChange={(e) => {
            setSelectedPieceOption(parseInt(e.target.value));
          }}
          value={selectedPieceOption}
        >
          {piecesOptions.map(([x, y], i) => (
            <option key={i} value={i}>
              {x * y} pieces ({x}x{y})
            </option>
          ))}
        </select>
      )}

      <Button
        disabled={!image}
        onClick={() => {
          if (image && piecesOptions?.[selectedPieceOption]) {
            onSubmit({
              image,
              piecesX: piecesOptions[selectedPieceOption][0],
              piecesY: piecesOptions[selectedPieceOption][1],
              genNormals,
            });
          }
        }}
      >
        Continue
      </Button>

      <Button
        color="secondary"
        onClick={() => {
          loadImage("/puzzles/uv.jpg").then((image) => {
            onSubmit({
              image,
              piecesX: 16,
              piecesY: 16,
              genNormals,
            });
          });
        }}
      >
        Use debug image
      </Button>
    </div>
  );
}

const Input = styled("input", {
  display: "none",
});

const Image = styled("img", {
  height: "50vh",
  objectFit: "cover",
});
