import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { VisualMode } from '../types';

interface ChristmasRibbonProps {
  mode: VisualMode;
  rotationStrength: number;
}

const ChristmasRibbon: React.FC<ChristmasRibbonProps> = ({ mode, rotationStrength }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      const isVisible = mode === VisualMode.TREE;
      const targetY = isVisible ? 2.8 + Math.sin(t * 0.8) * 0.15 : -10;
      
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);
      
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        (rotationStrength * 0.3) + Math.sin(t * 0.5) * 0.05,
        0.05
      );
    }
  });

  return (
    <group ref={groupRef}>
      <Text
        font="https://fonts.gstatic.com/s/cinzeldecorative/v14/daaCSScvSbq2nc5IxIASwl700DdlKwywW6T0.woff"
        fontSize={0.6}
        maxWidth={8}
        lineHeight={1.2}
        letterSpacing={0.1}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
      >
        MERRY CHRISTMAS
        <meshStandardMaterial
          color="#ffdb4d"
          emissive="#ffaa00"
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </Text>
    </group>
  );
};

export default ChristmasRibbon;