import React from 'react';
import { VisualMode } from '../types';

// Component neutralized to remove camera dependencies.
// Interaction is now fully handled via mouse/touch in App.tsx.

interface HandControllerProps {
  onModeChange: (mode: VisualMode) => void;
  onRotationChange: (rotation: number) => void;
}

const HandController: React.FC<HandControllerProps> = () => {
  return null;
};

export default HandController;