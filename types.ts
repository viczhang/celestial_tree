
import { ThreeElements } from '@react-three/fiber';

export enum VisualMode {
  TREE = 'TREE',
  GALAXY = 'GALAXY',
  TEXT = 'TEXT'
}

export interface ParticleData {
  initialPosition: [number, number, number];
  treePosition: [number, number, number];
  galaxyPosition: [number, number, number];
  textPosition: [number, number, number];
  color: [number, number, number]; // RGB
  size: number;
}

export interface ControlState {
  mode: VisualMode;
  rotation: number; // -1 to 1
}

// Global augmentation to register React Three Fiber's intrinsic elements (mesh, group, points, etc.)
// This resolves "Property '...' does not exist on type 'JSX.IntrinsicElements'" errors.
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
