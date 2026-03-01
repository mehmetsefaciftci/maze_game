import { useState } from 'react';

export function usePressFeedback() {
  const [pressed, setPressed] = useState(false);

  const onPointerDown = () => setPressed(true);
  const onPointerUp = () => setPressed(false);
  const onPointerLeave = () => setPressed(false);
  const onPointerCancel = () => setPressed(false);

  return {
    pressed,
    handlers: {
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onPointerCancel,
    },
  };
}
