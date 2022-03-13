import React from "react";
import { Checkbox, Modal, Text } from "@nextui-org/react";
import { useAppDispatch, useAppSelector } from "../hook/store";
import { setShowPerfStats } from "../game/slice";

type OptionsMenuProps = {
  visible: boolean;
  onClose: () => void;
};

export default function OptionsMenu({ visible, onClose }: OptionsMenuProps) {
  const dispatch = useAppDispatch();
  const showPerf = useAppSelector((state) => state.game.showPerfStats);

  return (
    <Modal closeButton open={visible} onClose={onClose}>
      <Modal.Header>
        <Text size={18}>Options</Text>
      </Modal.Header>

      <Modal.Body>
        <Checkbox
          checked={showPerf}
          onChange={(e) => {
            dispatch(setShowPerfStats(e.target.checked));
          }}
          animated={false}
        >
          Show performance stats
        </Checkbox>
      </Modal.Body>
      <Modal.Footer />
    </Modal>
  );
}
