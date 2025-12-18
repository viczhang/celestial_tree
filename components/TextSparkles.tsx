import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { VisualMode } from '../types';

interface TextSparklesProps {
  mode: VisualMode;
}

const TextSparkles: React.FC<TextSparklesProps> = ({ mode }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const isText = mode === VisualMode.TEXT;
    const targetScale = isText ? 1 : 0;
    
    // Smooth transition for appearance/disappearance
    const lerpSpeed = 2.0;
    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * lerpSpeed);
    
    groupRef.current.scale.setScalar(newScale);
    
    // Hide completely if very small to save performance
    groupRef.current.visible = newScale > 0.01;
  });

  return (
    <group ref={groupRef}>
      {/* Dense inner sparkles for the text body */}
      <Sparkles 
        count={60} 
        scale={[16, 8, 4]} 
        size={6} 
        speed={0.4} 
        opacity={1} 
        color="#fff" 
      />
      {/* Floating outer sparkles for ambience */}
      <Sparkles 
        count={40} 
        scale={[18, 10, 8]} 
        size={10} 
        speed={0.2} 
        opacity={0.5} 
        color="#fff" 
      />
    </group>
  );
};

export default TextSparkles;