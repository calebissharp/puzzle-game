import React from "react";
import { Button, Checkbox, Collapse, Modal, Text } from "@nextui-org/react";
import usePerf from "../game/hooks/usePerf";
import { useGame } from "../game/hooks/useGame";
import useJiggle from "../game/hooks/useJiggle";

type OptionsMenuProps = {
  visible: boolean;
  onClose: () => void;
};

export default function OptionsMenu({ visible, onClose }: OptionsMenuProps) {
  const { game } = useGame();

  const [showPerf, setShowPerf] = usePerf();
  const [jiggling, setJiggling] = useJiggle();

  return (
    <Modal closeButton open={visible} onClose={onClose}>
      <Modal.Header>
        <Text size={18}>Options</Text>
      </Modal.Header>

      <Modal.Body>
        <Checkbox
          checked={showPerf}
          onChange={(e) => {
            setShowPerf(e.target.checked);
          }}
          animated={false}
        >
          Show performance stats
        </Checkbox>

        <Collapse.Group>
          <Collapse title="Debug options">
            <Button
              onClick={() => {
                if (game) {
                  // game.solve()
                }
              }}
            >
              Solve puzzle
            </Button>

            <Button
              onClick={() => {
                setJiggling(!jiggling);
              }}
            >
              Toggle Jiggle ({jiggling ? "ON" : "OFF"})
            </Button>
          </Collapse>
        </Collapse.Group>
      </Modal.Body>
      <Modal.Footer />
    </Modal>
  );
}
