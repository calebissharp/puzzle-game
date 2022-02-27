import React, { useRef, useState } from "react";
import { Button, styled } from "@nextui-org/react";
import { getPuzzleDimensions, loadImage } from "../game/util";

type ImageSelectProps = {
  onSubmit: (image: HTMLImageElement, piecesX: number, piecesY: number) => void;
};

export default function ImageSelect({ onSubmit }: ImageSelectProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
            onSubmit(image, ...piecesOptions[selectedPieceOption]);
          }
        }}
      >
        Continue
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
